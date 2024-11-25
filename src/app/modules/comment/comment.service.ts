import { Task } from "../task/task.model";
import { TaskServices } from "../task/task.service";
import { User } from "../user/user.model";
import { TComment } from "./comment.interface";
import { Comment } from "./comment.model";

const createCommentIntoDB = async (payload: TComment) => {

  const { taskId, authorId, isFile } = payload;

  const task = await Task.findById(taskId);
  const author = await User.findById(authorId);
  if (!task || !author) {
    return null;
  }

  const data = await Comment.create(payload);
  if (data) {
    const taskId = data?.taskId.toString();
    const userId = data?.authorId.toString();
    const messageId = data?._id.toString();
    try {
      const task = await TaskServices.updateReadComment(
        taskId,
        userId,
        messageId
      );
    } catch (error) {
      console.error(error);
    }
  }
  const users = {
    creator: task?.author,
    assigned: task?.assigned,
    authorId
  };
  // check other-User against authorId
  const otherUser = users.creator.toString() === authorId.toString() ? users.assigned : users.creator;

  const result = {
    ...data.toObject(),
    otherUser,
    authorName: author.name,
    taskName : task.taskName
  };
  return result;
};

const getCommentsFromDB = async (id: string) => {
  const result = await Comment.find({ taskId: id }).populate({
    path: 'authorId', // Populate the author's ID for the comment
    select: '_id name' // Select only the ID and name for the author of the comment
  });
  if (result) {
    const taskId = id;
    const userId = result[0]?.authorId?._id.toString();
    const messageId = result[result.length - 1]._id.toString();
  try {
    const task = await TaskServices.updateReadComment(taskId, userId, messageId)
  } catch (error) {
    console.error(error);
  }
  }
  return result;
}

export const CommentServices = {
  createCommentIntoDB,
  getCommentsFromDB
};
