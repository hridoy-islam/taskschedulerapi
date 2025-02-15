import { Task } from "../task/task.model";
import { TaskServices } from "../task/task.service";
import { User } from "../user/user.model";
import { TComment } from "./comment.interface";
import { Comment } from "./comment.model";
import { getIO } from "../../../socket";
import { Types } from "mongoose";

const createCommentIntoDB = async (payload: TComment) => {

  const { taskId, authorId, isFile } = payload;

  const task = await Task.findById(taskId);
  const author = await User.findById(authorId);
  if (!task || !author) {
    return null;
  }

  const commentPayload = {
    ...payload,
    seenBy: [authorId], 
  };
  const data = await Comment.create(commentPayload);
  // if (data) {
  //   const taskId = data?.taskId.toString();
  //   const userId = data?.authorId.toString();
  //   const messageId = data?._id.toString();
  //   try {
  //     const task = await TaskServices.updateReadComment(
  //       taskId,
  //       userId,
  //       messageId
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  const users = {
    creator: task?.author,
    assigned: task?.assigned,
    authorId
  };
  // check other-User against authorId
  // const otherUser = users.creator.toString() === authorId.toString() ? users.assigned : users.creator;
  const otherUser = users.creator.toString() === authorId.toString() ? users.assigned : users.creator;


    const result = {
      ...data.toObject(),
      otherUser,
      authorName: author.name,
      taskName: task.taskName,
    };

  return result;
};


const getCommentsFromDB = async (id: string, user: any) => {
  const result = await Comment.find({ taskId: id }).populate({
    path: 'authorId', // Populate the author's ID for the comment
    select: '_id name' // Select only the ID and name for the author of the comment
  });
  // if (result) {
  //   const taskId = id;
  //   const userId = result[0]?.authorId?._id.toString();
  //   const messageId = result[result.length - 1]._id.toString();
  // try {
  //   const task = await TaskServices.updateReadComment(taskId, userId, messageId)
  //   console.log(task);
  // } catch (error) {
  //   console.error(error);
  // }
  // }


  await Comment.updateMany(
    { taskId: new Types.ObjectId(id) },
    { $addToSet: { seenBy: user._id } } // Add the user ID to `seenBy` if not already present
  );
  return result;
}




export const CommentServices = {
  createCommentIntoDB,
  getCommentsFromDB
};
