import { Schema, model } from "mongoose";
import { TGroupMessage } from "./message.interface";

const GroupMessageSchema = new Schema<TGroupMessage>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Group",
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
        ref: "User",
      },
    ],
    mentionBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "GroupMessage",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const GroupMessage = model<TGroupMessage>(
  "GroupMessage",
  GroupMessageSchema,
);
