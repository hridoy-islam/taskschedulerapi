/* eslint-disable no-unused-vars */
import { Types } from "mongoose";
// import { USER_ROLE } from "./user.constant";

export interface TLastSeen {
  _id: Types.ObjectId;
  userId: Types.ObjectId | null;
  lastSeenId: Types.ObjectId | null;
}

export enum TaskFrequency {
  ONCE = "once",
  DAILY = "daily",
  WEEKDAYS = "weekdays",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

interface IHistory {
  date: Date;
  completed: boolean;
}


export interface TTask {
  _id: Types.ObjectId;
  taskName: string;
  description?: string;
  author: Types.ObjectId;
  assigned?: Types.ObjectId;
  company?: Types.ObjectId | null;
  status: "pending" | "completed";
  isDeleted?: boolean;
  dueDate?: Date | string;
  lastSeen?: TLastSeen[];
  createdAt: Date;
  updatedAt: Date;
  seen: boolean;
  importantBy: Types.ObjectId[];
  frequency: TaskFrequency;
  scheduledAt?: Date;
  scheduledDays?: number[];
  customSchedule?: Date[];
  history: IHistory[];
  scheduledDate?:number

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




