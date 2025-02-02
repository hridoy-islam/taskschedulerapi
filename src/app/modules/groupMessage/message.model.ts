import { Schema, model } from "mongoose";
import { TGroupMessage } from "./message.interface";

const GroupMessageSchema = new Schema<TGroupMessage>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "task",
    },
    content: {
      type: String,
      required: true,
    },
    isFile: {
      type: Boolean,
      default: false,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User who has seen the comment
      }]
  },
  {
    timestamps: true,
  }
);


export const GroupMessage = model<TGroupMessage>("GroupMessage", GroupMessageSchema);
