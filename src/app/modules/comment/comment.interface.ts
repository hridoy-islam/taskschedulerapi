/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TComment {
    _id: Types.ObjectId;
    taskId: Types.ObjectId; // Reference to the task
    authorId: Types.ObjectId; // Reference to the author
    isFile: boolean; // Is the comment a file
    content: string; // The comment content
    seenBy:Types.ObjectId[];
}
