/* eslint-disable no-unused-vars */
import mongoose, { Model, Types } from "mongoose";

export interface TGroupMessage {
  content: string;
  taskId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  isFile?: boolean;
  seenBy?: mongoose.Types.ObjectId[];

}
