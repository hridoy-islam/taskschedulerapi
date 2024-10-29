/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TComment {
  _id: Types.ObjectId;
    taskId: Types.ObjectId; // Reference to the task
    authorId: Types.ObjectId; // Reference to the author
    content: string; // The comment content
}
