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

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const getAllUserByCompany = async (userId: string) => {
  // 1. Fetch user using .lean() and WITHOUT populate. 
  // This keeps the JSON clean and prevents bloated nested objects.
  const user = await User.findById(userId).lean();
  
  if (!user) {
    return null;
  }

  let usersList: any[] = [];
  const colleagueIds = user.colleagues || [];

  // ============================================
  // ADMIN / DIRECTOR
  // ============================================
  if (user.role === 'admin' || user.role === 'director') {
    const adminQuery = { 
      $or: [
        { role: { $in: ['admin', 'director'] } },
        { _id: { $in: colleagueIds } }
      ], 
      isDeleted: false,
      _id: { $ne: userId } 
    };
    usersList = await User.find(adminQuery).lean();
  }

  // ============================================
  // COMPANY
  // ============================================
  else if (user.role === 'company') {
    const companyQuery = { 
      $or: [
        { company: user._id, role: { $in: ['creator', 'user'] } },
        { _id: { $in: colleagueIds } }
      ],
      isDeleted: false,
      _id: { $ne: userId }
    };
    usersList = await User.find(companyQuery).lean();
  }

  // ============================================
  // CREATOR
  // ============================================
  else if (user.role === 'creator') {
    const creatorQuery = {
      $or: [
        { company: user.company },     // Co-workers in same company
        { _id: { $in: colleagueIds } } // Colleagues
      ],
      isDeleted: false,
      _id: { $ne: userId }
    };

    // Add company owner to the query if a company ID exists
    if (user.company) {
      creatorQuery.$or.push({ _id: user.company } as any);
    }
    
    usersList = await User.find(creatorQuery).lean();
  }

  // ============================================
  // USER
  // ============================================
  else if (user.role === 'user') {
    const userQuery = {
      $or: [
        { _id: { $in: colleagueIds } } // Colleagues
      ],
      isDeleted: false,
      _id: { $ne: userId }
    };
    
    // Add company owner to the query if a company ID exists
    if (user.company) {
      userQuery.$or.push({ _id: user.company } as any);
    }
    
    usersList = await User.find(userQuery).lean();
  }

  // ============================================
  // FALLBACK
  // ============================================
  else {
    usersList = await User.find({ isDeleted: false, _id: { $ne: userId } }).lean();
  }

  // ============================================
  // FINAL DEDUPLICATION & SORTING
  // ============================================
  
  // 1. Remove any duplicates (using Map for O(n) performance)
  const uniqueUsersMap = new Map();
  usersList.forEach(u => {
    if (u && u._id) {
      uniqueUsersMap.set(u._id.toString(), u);
    }
  });
  
  let finalUsersList = Array.from(uniqueUsersMap.values());
  
  // 2. Sort everyone alphabetically by name
  finalUsersList.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return a._id.toString().localeCompare(b._id.toString());
  });
  
  // 3. Add current user at the TOP
  // Because we used .lean() at the top, this will be clean without bloated arrays
  finalUsersList.unshift(user);
  
  return finalUsersList;
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
