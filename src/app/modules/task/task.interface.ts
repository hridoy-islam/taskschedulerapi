/* eslint-disable no-unused-vars */
import { Types } from "mongoose";
// import { USER_ROLE } from "./user.constant";

export interface TTask {
  _id: Types.ObjectId;
  taskName: string;
  description?: string;
  author: Types.ObjectId;
  assigned?: Types.ObjectId;
  status: "pending" | "completed";
  isDeleted?: boolean;
  dueDate?: string;
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
