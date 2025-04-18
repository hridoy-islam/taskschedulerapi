/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TNotification } from "./notification.interface";

const notificationSchema = new Schema<TNotification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref:"User" }, // The user to whom the notification is sent
    senderId: { type: Schema.Types.ObjectId, required: true, ref:"User" }, // The user sending the notification
    type: { type: String, required: true }, // Notification title
    message: { type: String, required: true }, // Notification message
    isRead: { type: Boolean, default: false }, // Read/unread status
    docId:{ type: String, default: "" }
  },
  {
    timestamps: true,
  }
);

export const Notification = model<TNotification>("notification", notificationSchema);
