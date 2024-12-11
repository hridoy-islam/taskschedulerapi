import QueryBuilder from "../../builder/QueryBuilder";
import { TNotification } from "./notification.interface";
import { Notification } from "./notification.model";

const createNotificationIntoDB = async (payload: TNotification) => {
  const result = await Notification.create(payload);
  return result;
};

const getNotificationsFromDB = async (userId: string, query: Record<string, unknown>) => {
    // Start building the query
    const notificationQuery = new QueryBuilder( Notification.find({ userId }).populate("senderId userId"), query)
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


  // Mark a notification as read
export const markAsReadIntoDB = async (notificationId: string) => {
    const result = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return result;
};

export const NotificationService = {
    createNotificationIntoDB,
    getNotificationsFromDB,
    markAsReadIntoDB
};
