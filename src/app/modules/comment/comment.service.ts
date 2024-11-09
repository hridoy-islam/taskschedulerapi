import { Task } from "../task/task.model";
import { User } from "../user/user.model";
import { TComment } from "./comment.interface";
import { Comment } from "./comment.model";

const createCommentIntoDB = async (payload: TComment) => {

  const { taskId, authorId } =  payload;

  const task = await Task.findById(taskId);
  const author = await User.findById(authorId);
  if (!task || !author) {
    return null;
  }

  const data = await Comment.create(payload);

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
  return result;
}

export const CommentServices = {
  createCommentIntoDB,
  getCommentsFromDB
};
