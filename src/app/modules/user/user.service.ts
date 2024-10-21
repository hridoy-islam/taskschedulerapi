import QueryBuilder from "../../builder/QueryBuilder";
import { UserSearchableFields } from "./user.constant";
import { TUser } from "./user.interface";
import { User } from "./user.model";

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
  const result = await User.findById(id).populate("colleagues");
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
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const query: any = {
    isDeleted: false,
    _id: { $ne: userId }, // Exclude the current user
  };

  // If user is a 'user' or 'creator', filter by their company
  if (["user", "creator"].includes(user.role)) {
    query.company = user.company; // Filter by user's company
  } else if (user.role === "company") {
    query.company = user._id; // Use the company user's _id
  }

  const users = await User.find(query);
  return users;
};

export const UserServices = {
  getAllUserFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  getAllUserByCompany,
};
