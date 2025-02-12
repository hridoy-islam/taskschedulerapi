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

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Toggle `isDeleted` status
  const newStatus = !user.isDeleted;

  // Check if the user is a company
  if (user.role === "company") {
    // Toggle the `isDeleted` status for all members of this company
    await User.updateMany(
      { company: user._id }, // Filter members assigned to this company
      { isDeleted: newStatus } // Set the new `isDeleted` status
    );
  }

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
    // Only fetch users with roles 'admin' or 'director' for admin and director users
    const query = { role: { $in: ['admin', 'director','company'] } };
    const filteredUsers = await User.find(query).lean();
    return filteredUsers;
  }

  else if (user.role === 'company') {
    const query = { 
      company: user._id, 
      role: { $in: ['creator', 'user'] } 
    };
    const companyUsers = await User.find(query).lean();
    return companyUsers // Return users from the same company
  }


  else if (user.role === 'creator') {
    const companyId = user.company; // Get the company ID of the user

    // Build the query to fetch all users with the same company ID
    query.company = companyId;  // Only users who share the same company ID
  
    // Execute the query to find users
    const users = await User.find(query).lean();
  
    return users;
  }


  else if (user.role === 'user') {
    // Users can only see their colleagues
    const colleaguesIds = user.colleagues || [];
    const query = { _id: { $in: colleaguesIds } }; // Use the colleagues array
    const colleagues = await User.find(query).lean(); // Fetch colleagues based on the query
  
    return colleagues; // Return only the colleagues
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
