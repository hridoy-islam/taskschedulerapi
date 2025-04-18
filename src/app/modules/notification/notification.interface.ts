/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TNotification {
  userId: Types.ObjectId; // The user receiving the notification
  senderId: Types.ObjectId; // The user sending the notification
  type: string;     // Type of notification (e.g., "task", "note")
  message: string;  // Notification message
  isRead?: boolean; // Optional read status, default is false
  docId?: string; 
}
