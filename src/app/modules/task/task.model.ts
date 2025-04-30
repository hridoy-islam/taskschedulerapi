/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TLastSeen, TTask } from "./task.interface";

const lastSeenSchema = new Schema<TLastSeen>(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastSeenId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
  }
);


const frequencyOptions = ["once", "daily", "weekdays", "weekly", "monthly", "custom"] as const;
type TaskFrequency = typeof frequencyOptions[number];

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
    lastSeen: [lastSeenSchema],
    assigned: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming tasks are assigned to users
    },
    company: {
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
    // important: {
    //   type: Boolean,
    //   default: false,
    // },
    seen: {
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
    scheduledDays: {
      type: [Number], // For weekly tasks (days of the week, e.g., [0, 1, 2] for Sun, Mon, Tue)
    },
    scheduledDate: {
      type: Number, // For weekly tasks (days of the week, e.g., [0, 1, 2] for Sun, Mon, Tue)
    },
   
    customSchedule: {
      type: [Date], // For custom tasks (specific dates in ISO format)
    },
    history: [
      {
        date: {
          type: Date,
          required: true,
        },
        completed: {
          type: Boolean,
          required: true,
        },
      },
    ],

    importantBy: [{ type: Schema.Types.ObjectId, ref: "User",default: []  }],
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
