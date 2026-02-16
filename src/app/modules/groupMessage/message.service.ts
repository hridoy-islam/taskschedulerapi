import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Group } from "../group/group.model";
import { User } from "../user/user.model";
import { TGroupMessage } from "./message.interface";
import { GroupMessage } from "./message.model";
import mongoose, { Types } from "mongoose";
import { NotificationService } from "../notification/notification.service";
import { getIO } from "../../../socket";

interface IRequester {
  _id: string;
  
}

const createMessageIntoDB = async (payload: TGroupMessage, requester: IRequester) => {
  const { taskId, authorId, isFile } = payload;

  // Ensure both IDs are ObjectId instances
  const taskObjectId = taskId;
  const requesterObjectId = requester._id;

  const task = await Group.findById(taskObjectId);

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  const isMember = task.members.some(
    (member) => member._id.toString() === requesterObjectId.toString()
  );

  if (!isMember) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not a member of the group");
  }

  if (task.status === "archived") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This group is archived and cannot accept new messages."
    );
  }

  const author = await User.findById(authorId);
  if (!author) {
    throw new AppError(httpStatus.NOT_FOUND, "Author not found");
  }

  const data = await GroupMessage.create(payload);

  // ==========================================
  // NEW LOGIC: Handle Mentions & Notifications
  // ==========================================
  if (payload.mentionBy && payload.mentionBy.length > 0) {
    const notificationMessage = `${author.name} mentioned you in group "${task.groupName}"`;
    const io = getIO();

    // Create notifications for all mentioned users
    const notifications = await Promise.all(
      payload.mentionBy.map(async (mentionedUserId) => {
        // Prevent sending a notification if the author somehow mentioned themselves
        if (mentionedUserId.toString() !== authorId.toString()) {
          return await NotificationService.createNotificationIntoDB({
            userId: mentionedUserId, // User receiving the notification
            senderId: author._id,    // User who sent the message
            type: "group",           // Or "mention" depending on your enums
            message: notificationMessage,
            docId: task._id.toString(), // Linking to the group/task
          });
        }
      })
    );

    // Send the notification in real-time using WebSocket
    notifications.forEach((notification) => {
      if (notification) {
        const memberId = notification.userId.toString();
        io.to(memberId).emit("notification", notification);
      }
    });
  }
 
  const otherUserArr = task.members.filter(
    (member) => member._id.toString() !== authorId.toString()
  );

  return {
    ...data.toObject(),
    otherUserArr,
    authorName: author.name,
    taskName: task.groupName,
  };
};


const getMessagesFromDB = async (id: string, page: number, limit: number, requester: any) => {


    const isMember = await Group.findOne({
      _id: id,
      "members._id": requester._id,
    });

    if (!isMember) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not a member of the group"
      );
    }


  const totalMessages = await GroupMessage.countDocuments({ taskId: id });
  const skip = totalMessages > page * limit ? totalMessages - page * limit : 0;
  const results = await GroupMessage.find({ taskId: id })
    .populate({
      path: "authorId", // Populate the author's ID for the comment
      select: "_id name", // Select only the ID and name for the author of the comment
    })
    .sort({ _id: 1 }) // Sort in ascending order to get the oldest messages first
    .skip(skip) // Skip the documents for reverse pagination
    .limit(limit); 


    // await Promise.all(
    //   results.map(async (result) => {
    //     if (!result.seenBy.includes(requester._id)) {
    //       result.seenBy.push(requester._id); // Add the user to the `seenBy` array
    //       await result.save(); // Save the updated message
    //     }
    //   })
    // );

    await Promise.all(
  results.map(async (result) => {
    if (!Array.isArray(result.seenBy)) {
      result.seenBy = []; // Ensure it's initialized
    }

    if (!result.seenBy.includes(requester._id)) {
      result.seenBy.push(requester._id);
      await result.save();
    }
  })
);


  return results;
};



const updateMessageFromDB = async (
  messageId: string,
  updatedData: {
    content?: string;
    isFile?: boolean;
    mentionBy?: string[];
  },
  requester: string
) => {
  const message = await GroupMessage.findById(messageId);

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found");
  }

  if (!message.authorId.equals(requester)) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this message"
    );
  }

  const group = await Group.findById(message.taskId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  if (group.status === "archived") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This group is archived and messages cannot be edited"
    );
  }

  // ===============================
  // Detect New Mentions
  // ===============================
  let newMentionedUsers: string[] = [];

  if (updatedData.mentionBy) {
    const previousMentions = (message.mentionBy || []).map(id => id.toString());

    const updatedMentions = updatedData.mentionBy;

    newMentionedUsers = updatedMentions.filter(
      (id) => !previousMentions.includes(id)
    );

    // Update mentionBy
    message.mentionBy = updatedMentions as any;
  }

  // ===============================
  // Update Content
  // ===============================
  if (updatedData.content !== undefined) {
    message.content = updatedData.content;
  }

  if (updatedData.isFile !== undefined) {
    message.isFile = updatedData.isFile;
  }

  await message.save();

  // ===============================
  // Create Notifications for NEW mentions
  // ===============================
  if (newMentionedUsers.length > 0) {
    const author = await User.findById(message.authorId);
    const io = getIO();

    const notificationMessage = `${author?.name} mentioned you in group "${group.groupName}"`;

    const notifications = await Promise.all(
      newMentionedUsers.map(async (userId) => {
        if (userId !== message.authorId.toString()) {
          return await NotificationService.createNotificationIntoDB({
            userId: new Types.ObjectId(userId),
            senderId: message.authorId,
            type: "group",
            message: notificationMessage,
            docId: group._id.toString(),
          });
        }
      })
    );

    notifications.forEach((notification) => {
      if (notification) {
        io.to(notification.userId.toString()).emit(
          "notification",
          notification
        );
      }
    });
  }

  return message;
};








export const CommentServices = {
  createMessageIntoDB,
  getMessagesFromDB,
  updateMessageFromDB
};
