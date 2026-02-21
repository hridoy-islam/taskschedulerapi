import { Task } from "../task/task.model";
import { TaskServices } from "../task/task.service";
import { User } from "../user/user.model";
import { TComment } from "./comment.interface";
import { Comment } from "./comment.model";
import { getIO } from "../../../socket";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { NotificationService } from "../notification/notification.service";

// const createCommentIntoDB = async (payload: TComment) => {

//   const { taskId, authorId, isFile } = payload;

//   const task = await Task.findById(taskId);
//   const author = await User.findById(authorId);
//   if (!task || !author) {
//     return null;
//   }

//   const commentPayload = {
//     ...payload,
//     seenBy: [authorId], 
//   };
//   const data = await Comment.create(commentPayload);
  
//   const users = {
//     creator: task?.author,
//     assigned: task?.assigned,
//     authorId
//   };
 
//   const otherUser = users.creator.toString() === authorId.toString() ? users.assigned : users.creator;


//     const result = {
//       ...data.toObject(),
//       otherUser,
//       authorName: author.name,
//       taskName: task.taskName,
//     };

//   return result;
// };

export const createCommentIntoDB = async (payload: TComment) => {
  // 1. Fetch the related task and the user making the comment
  const task = await Task.findById(payload.taskId);
  const commentAuthor = await User.findById(payload.authorId);

  if (!task || !commentAuthor) {
    throw new Error("Task or User not found");
  }

  // 2. Create the Comment
  const result = await Comment.create(payload);

  // 3. Determine who should receive the notification
  console.log("--- DEBUGGING NOTIFICATION ---");
  console.log("Task Author:", task.author.toString());
  console.log("Task Assigned:", (task as any).assigned?.toString());
  console.log("Comment Author:", payload.authorId.toString());

  let recipientId = null;

  if (task.author.toString() === payload.authorId.toString()) {
    recipientId = (task as any).assigned?.toString();
    console.log("Matched! Sender is Task Author. Recipient is:", recipientId);
  } else if ((task as any).assigned?.toString() === payload.authorId.toString()) {
    recipientId = task.author.toString();
    console.log("Matched! Sender is Assigned User. Recipient is:", recipientId);
  } else {
    console.log("NO MATCH! The commenter is neither the author nor the assigned user.");
  }

  // 4. Notification Logic
  if (recipientId && recipientId !== payload.authorId.toString()) {
    console.log("Attempting to create notification in DB for:", recipientId);
    
    const notification = await NotificationService.createNotificationIntoDB({
      userId: recipientId,
      senderId: payload.authorId,
      type: "comment",
      message: `${commentAuthor.name} commented on "${(task as any).taskName || 'a task'}"`,
      docId: task._id.toString(),
    });

    console.log("Notification saved to DB:", notification._id);

    // Emit the socket event
    const io = getIO();
    io.to(recipientId).emit("notification", notification);
    console.log("Socket emitted to room:", recipientId);
  } else {
    console.log("Notification skipped. Recipient is null or equal to authorId.");
  }

  return result;
};
const getCommentsFromDB = async (id: string, user: any) => {
  const result = await Comment.find({ taskId: id }).populate({
    path: 'authorId', // Populate the author's ID for the comment
    select: '_id name' // Select only the ID and name for the author of the comment
  });


  await Comment.updateMany(
    { taskId: new Types.ObjectId(id) },
    { $addToSet: { seenBy: user._id } } // Add the user ID to `seenBy` if not already present
  );
  return result;
}

export const updateCommentFromDB = async (
  messageId: string,
  updatedContent: { content?: string; isFile?: boolean },
  requester: Types.ObjectId | string
): Promise<TComment> => {
  // Find the message by ID
  const message = await Comment.findById(messageId);
  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found");
  }

  // Authorization check
  if (!message.authorId.equals(new Types.ObjectId(requester))) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this message"
    );
  }

  

  // Update fields
  if (updatedContent.content !== undefined) {
    message.content = updatedContent.content;
  }

  if (updatedContent.isFile !== undefined) {
    message.isFile = updatedContent.isFile;
  }

  await message.save();
  return message;
};


export const CommentServices = {
  createCommentIntoDB,
  getCommentsFromDB,
  updateCommentFromDB
};
