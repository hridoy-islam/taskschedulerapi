/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TTask } from "./task.interface";

const taskSchema = new Schema<TTask>(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User", // Assuming there's a User model
    },
    assigned: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming tasks are assigned to users
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    dueDate: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    important: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Task = model<TTask>("task", taskSchema);
