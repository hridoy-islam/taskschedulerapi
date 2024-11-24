import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Group } from "../group/group.model";
import { User } from "../user/user.model";
import { TGroupMessage } from "./message.interface";
import { GroupMessage } from "./message.model";

const createMessageIntoDB = async (payload: TGroupMessage, requester: any) => {
  const { taskId, authorId, isFile } = payload;
  const isMember = await Group.findOne({
    _id: taskId,
    "members._id": requester._id,
  });

  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not a member of the group"
    );
  }

  const task = await Group.findById(taskId);
  const author = await User.findById(authorId);
  if (!task || !author) {
    return null;
  }

  const data = await GroupMessage.create(payload);

  const otherUserArr = task.members.filter(
    (member) => member._id.toString() !== authorId.toString()
  );

  const result = {
    ...data.toObject(),
    otherUserArr,
    authorName: author.name,
    taskName: task.groupName,
  };
  return result;
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
  const result = await GroupMessage.find({ taskId: id })
    .populate({
      path: "authorId", // Populate the author's ID for the comment
      select: "_id name", // Select only the ID and name for the author of the comment
    })
    .sort({ _id: 1 }) // Sort in ascending order to get the oldest messages first
    .skip(skip) // Skip the documents for reverse pagination
    .limit(limit); // Limit the number of documents returned
  return result;
};

export const CommentServices = {
  createMessageIntoDB,
  getMessagesFromDB
};
