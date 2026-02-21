/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TLastSeen, TScheduleTask } from "./scheduleTask.interface";





const frequencyOptions = ["once", "daily", "weekdays", "weekly", "monthly", "custom"] as const;

const ScheduleTaskSchema = new Schema<TScheduleTask>(
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
      ref: "User",
    },
    
    assigned: {
      type: Schema.Types.ObjectId,
      ref: "User", 
    },
   
    company: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
      priority: {
      type: String,
      enum: ["low", "medium","high"],
      default: "low",
    },
    dueDate: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    
    isRecurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String , 
      enum: frequencyOptions,
      default:"once"
    },
    scheduledAt: {
      type: Date, 
    },
 
    scheduledDate: {
      type: Number, 
    },
   


  },
  {
    timestamps: true,
  }
);

ScheduleTaskSchema.pre<TScheduleTask>("save", function (next) {
  if (!this.dueDate) {
    this.dueDate = new Date(this.createdAt); // Set dueDate to createdAt
  }
  next();
});

ScheduleTaskSchema.methods.getFormattedDates = function () {
  return {
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
    dueDate: this.dueDate ? this.dueDate.toISOString() : null,
  };
};

export const ScheduleTask = model<TScheduleTask>("ScheduleTask", ScheduleTaskSchema);
