/* eslint-disable no-unused-vars */
import { Types } from "mongoose";
// import { USER_ROLE } from "./user.constant";


export interface TTask {
  _id: Types.ObjectId;
  taskName: string;
  description?: string;
  author: Types.ObjectId;
  assigned?: Types.ObjectId;
  company?: Types.ObjectId | null;
  status: "pending" | "completed";
  isDeleted?: boolean;
  important?: boolean;
  dueDate?: Date | string;
  authorLastSeenId: Types.ObjectId | null;
  assignedLastSeenId: Types.ObjectId | null;
  createdAt: Date; // Automatically generated by Mongoose
  updatedAt: Date; // Automatically generated by Mongoose
}

// export interface TaskModel extends Model<TTask> {
//   //instance methods for checking if the user exist
//   //isTaskExists(name: string): Promise<TTask>;
//   //instance methods for checking if passwords are matched
//   // isPasswordMatched(
//   //   plainTextPassword: string,
//   //   hashedPassword: string
//   // ): Promise<boolean>;
//   // // isJWTIssuedBeforePasswordChanged(
//   // //   passwordChangedTimestamp: Date,
//   // //   jwtIssuedTimestamp: number,
//   // // ): boolean;
// }

// export type TUserRole = keyof typeof USER_ROLE;
