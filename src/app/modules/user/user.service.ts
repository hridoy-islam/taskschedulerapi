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
  const user = await User.findById(userId).populate('colleagues');
  
  if (!user) {
    return null;
  }

  let usersList: any[] = [];

  // ============================================
  // ADMIN / DIRECTOR - See other admins/directors + colleagues
  // ============================================
  if (user.role === 'admin' || user.role === 'director') {
    const adminQuery = { 
      $or: [
        { role: { $in: ['admin', 'director'] } },
        { _id: { $in: user.colleagues || [] } }
      ], 
      isDeleted: false,
      _id: { $ne: userId } // Exclude self (we'll add them separately)
    };
    
    usersList = await User.find(adminQuery).sort({ name: 1 }).lean();
  }

  // ============================================
  // COMPANY - See creators/users in their company + colleagues
  // ============================================
  else if (user.role === 'company') {
    const companyQuery = { 
      company: user._id, 
      role: { $in: ['creator', 'user'] },
      isDeleted: false,
      _id: { $ne: userId }
    };
    
    usersList = await User.find(companyQuery).sort({ name: 1 }).lean();
    
    // Add colleagues (if not already included)
    if (user.colleagues?.length) {
      const colleagueIds = user.colleagues.map((c: any) => c._id || c);
      const colleagues = await User.find({ 
        _id: { $in: colleagueIds }, 
        isDeleted: false 
      }).sort({ name: 1 }).lean();
      
      // Only add colleagues not already in the list
      colleagues.forEach(colleague => {
        if (!usersList.some(u => u._id.toString() === colleague._id.toString())) {
          usersList.push(colleague);
        }
      });
    }
  }

  // ============================================
  // CREATOR - See company owner + other creators/users + colleagues
  // ============================================
  else if (user.role === 'creator') {
    const companyId = user.company;
    
    const creatorQuery = {
      company: companyId,
      isDeleted: false,
      _id: { $ne: userId }
    };
    
    usersList = await User.find(creatorQuery).sort({ name: 1 }).lean();
    
    // Add the company owner if exists and not deleted
    if (companyId) {
      const company = await User.findOne({ 
        _id: companyId, 
        isDeleted: false 
      }).lean();
      
      if (company && !usersList.some(u => u._id.toString() === company._id.toString())) {
        usersList.push(company);
      }
    }
    
    // Add colleagues (if not already included)
    if (user.colleagues?.length) {
      const colleagueIds = user.colleagues.map((c: any) => c._id || c);
      const colleagues = await User.find({ 
        _id: { $in: colleagueIds }, 
        isDeleted: false 
      }).sort({ name: 1 }).lean();
      
      colleagues.forEach(colleague => {
        if (!usersList.some(u => u._id.toString() === colleague._id.toString())) {
          usersList.push(colleague);
        }
      });
    }
  }

  // ============================================
  // USER - See only company owner + colleagues
  // ============================================
  else if (user.role === 'user') {
    const colleagueIds = user.colleagues?.map((c: any) => c._id || c) || [];
    
    const userQuery: any = {
      _id: { $in: colleagueIds },
      isDeleted: false
    };
    
    usersList = await User.find(userQuery).sort({ name: 1 }).lean();
    
    // Add company owner if exists
    if (user.company) {
      const company = await User.findOne({ 
        _id: user.company, 
        isDeleted: false 
      }).lean();
      
      if (company && !usersList.some(u => u._id.toString() === company._id.toString())) {
        usersList.push(company);
      }
    }
  }

  // ============================================
  // FALLBACK - Other roles (if any)
  // ============================================
  else {
    const fallbackQuery = {
      isDeleted: false,
      _id: { $ne: userId }
    };
    usersList = await User.find(fallbackQuery).sort({ name: 1 }).lean();
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
  
  // 2. Add current user at the TOP
  if (!finalUsersList.some(u => u._id.toString() === userId)) {
    finalUsersList.unshift(user.toObject ? user.toObject() : user);
  } else {
    // If user is already in list, move them to top
    finalUsersList = finalUsersList.filter(u => u._id.toString() !== userId);
    finalUsersList.unshift(user.toObject ? user.toObject() : user);
  }
  
  // 3. Sort everyone EXCEPT the first user (current user stays at top)
  const currentUser = finalUsersList[0];
  const otherUsers = finalUsersList.slice(1);
  
  otherUsers.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    
    // Tie-breaker: sort by _id for stability
    return a._id.toString().localeCompare(b._id.toString());
  });
  
  finalUsersList = [currentUser, ...otherUsers];
  
  return finalUsersList;
};

export default getAllUserByCompany;



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
