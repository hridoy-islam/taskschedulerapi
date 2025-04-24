import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { NotificationService } from "./notification.service";


// Create a new notification
export const createNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.createNotificationIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification is created successfully",
    data: result,
  });
});


// Fetch notifications for a user
export const getNotifications = catchAsync(async (req, res) => {

  const { userId } = req.params;
  const result = await NotificationService.getNotificationsFromDB(userId, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification retrived succesfully",
    data: result,
  });

});

// Mark a notification as read
const markAsRead = catchAsync(async (req, res) => {

  const { notificationId } = req.params;
  const result = await NotificationService.markAsReadIntoDB(notificationId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification Marked as Read succesfully",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const result = await NotificationService.markAllAsSeen({ userId });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read successfully",
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
});


export const NotificationControllers = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
