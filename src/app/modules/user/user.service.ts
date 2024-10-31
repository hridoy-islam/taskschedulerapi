import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserSearchableFields } from "./user.constant";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import AppError from "../../errors/AppError";

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find().populate("company"), query)
    .search(UserSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleUserFromDB = async (id: string) => {
  const result = await User.findById(id).populate("colleagues company");
  return result;
};

const updateUserIntoDB = async (id: string, payload: Partial<TUser>) => {

  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};

const getAllUserByCompany = async (userId: string) => {
  const user = await User.findById(userId).populate('colleagues'); ;
  if (!user) {
    return null;
  }

  const query: any = {
    isDeleted: false,
    _id: { $ne: userId }, // Exclude the current user
  };

  // Determine the user's role and set the query accordingly
  if (user.role === 'admin' || user.role === 'director') {
    // Admins and Directors can see all users
    const allUsers = await User.find(query).lean();
    return allUsers
  }

  else if (user.role === 'company') {
    query.$or = [
      { company: user._id }, // Users from the same company
      { role: { $in: ['admin', 'director'] } } // Admins and Directors
    ];
    const companyUsers = await User.find(query).lean();
    return companyUsers // Return users from the same company
  }

  else if (user.role === 'creator' || user.role === 'user') {
    // Creators and regular users see their colleagues
    const colleaguesIds = user.colleagues || [];
    query._id = { $in: colleaguesIds }; // Use the colleagues array
    const colleagues = await User.find(query).lean(); // Fetch colleagues based on the query
    return colleagues // Return only the colleagues
  }

  const users = await User.find(query);
  return users;
};



const assignUserToDB = async (id: string, payload: { colleagueId: string; action: 'add' | 'remove' }) => {
  const session = await User.startSession(); // Declare session outside
  session.startTransaction();

  try {
    const [user, colleague] = await Promise.all([
      User.findById(id),
      User.findById(payload.colleagueId)
    ]);

    if (!user || !colleague) {
      throw new AppError(httpStatus.NOT_FOUND, "User or colleague not found");
    }

    if (payload.action === 'add') {
      // Add colleagueId to user's colleagues array
      await User.findByIdAndUpdate(
        id,
        { $addToSet: { colleagues: payload.colleagueId } },
        { new: true, session }
      );

      // Add userId to colleague's colleagues array
      await User.findByIdAndUpdate(
        payload.colleagueId,
        { $addToSet: { colleagues: id } },
        { new: true, session }
      );
    } else if (payload.action === 'remove') {
      // Remove colleagueId from user's colleagues array
      await User.findByIdAndUpdate(
        id,
        { $pull: { colleagues: payload.colleagueId } },
        { new: true, session }
      );

      // Remove userId from colleague's colleagues array
      await User.findByIdAndUpdate(
        payload.colleagueId,
        { $pull: { colleagues: id } },
        { new: true, session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    
    // Fetch the updated user document
    const updatedUser = await User.findById(id).populate('colleagues'); // Populate if you want colleague details

    return updatedUser; // Return the updated user data
  } catch (error: any) {
    // Rollback the transaction on error
    await session.abortTransaction();
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error?.message);
  } finally {
    // End the session in the finally block to ensure it's called
    session.endSession();
  }
};


export const UserServices = {
  getAllUserFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  getAllUserByCompany,
  assignUserToDB
};
