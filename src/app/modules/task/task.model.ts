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
      type: Date,
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

taskSchema.pre<TTask>("save", function (next) {
  if (!this.dueDate) {
    this.dueDate = new Date(this.createdAt); // Set dueDate to createdAt
  }
  next();
});

taskSchema.methods.getFormattedDates = function () {
  return {
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
    dueDate: this.dueDate ? this.dueDate.toISOString() : null,
  };
};

export const Task = model<TTask>("task", taskSchema);
