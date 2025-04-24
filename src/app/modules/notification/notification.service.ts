import QueryBuilder from "../../builder/QueryBuilder";
import { TNotification } from "./notification.interface";
import { Notification } from "./notification.model";

const createNotificationIntoDB = async (payload: TNotification) => {
  const result = await Notification.create(payload);
  return result;
};

const getNotificationsFromDB = async (userId: string, query: Record<string, unknown>) => {
    // Start building the query
    const notificationQuery = new QueryBuilder( Notification.find({ userId }).populate("senderId").populate("userId"), query)
      .filter() // Apply filters
      .sort() // Apply sorting
      .paginate() // Apply pagination
      .fields(); // Select specific fields
    // Get total count for meta
    const meta = await notificationQuery.countTotal();
  
    // Get the query result
    const result = await notificationQuery.modelQuery;
  
    return {
      meta,
      result,
    };
  };


  // Check if a notification already exists for a user and note
const findNotification = async ({ userId, noteId }: { userId: string; noteId: string }) => {
  try {
    // Query for an existing notification based on userId and noteId
    const notification = await Notification.findOne({ userId, noteId });
    return notification; // Returns null if no notification found
  } catch (error) {
    console.error("Error checking for existing notification:", error);
    throw new Error("Error checking for existing notification");
  }
};
const markAllAsSeen = async ({ userId }: { userId: string }) => {
  try {
    const result = await Notification.updateMany(
      { 
        userId, 
        isRead: false 
      },
      { 
        $set: { isRead: true } 
      }
    );
    
    return result;
  } catch (error) {
    throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const markAsReadIntoDB = async (notificationId: string) => {
    const result = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return result;
};

export const NotificationService = {
    createNotificationIntoDB,
    getNotificationsFromDB,
    markAsReadIntoDB,
    findNotification,
    markAllAsSeen 
};
