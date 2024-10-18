import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { TaskSearchableFields } from "./task.constant";
import { TTask } from "./task.interface";
import { Task } from "./task.model";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import moment from "moment";

const createTaskIntoDB = async (payload: TTask) => {
  const author = await User.findById(payload.author);
  const assigned = await User.findById(payload.assigned);
  if (!author || !assigned) {
    return null;
  }

  if (author._id.toString() === assigned._id.toString()) {
    payload.company = null;
  } else {
    payload.company = assigned.company;
  }

  const result = await Task.create(payload);
  return result;
};

const getAllTaskFromDB = async (query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query
  )
    .search(TaskSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await taskQuery.countTotal();
  const result = await taskQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleTaskFromDB = async (id: string) => {
  const result = await Task.findById(id);
  return result;
};
const updateTaskIntoDB = async (id: string, payload: Partial<TTask>) => {
  // Fetch the existing task to get its createdAt date
  const existingTask = await Task.findById(id);
  if (!existingTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }

  // If the payload contains a dueDate in days, calculate the new due date
  if (typeof payload.dueDate === "number") {
    // If dueDate exists in the existing task, sum it with the new value
    const existingDueDateInDays = existingTask.dueDate
      ? Math.floor(
          (new Date(existingTask.dueDate).getTime() -
            new Date(existingTask.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    // Sum the existing days with the new due date
    const newDueDateInDays = existingDueDateInDays + payload.dueDate;

    // Create a new Date object based on createdAt
    const createdAt = existingTask.createdAt; // existing createdAt date
    const newDueDate = new Date(createdAt);
    newDueDate.setUTCDate(newDueDate.getUTCDate() + newDueDateInDays); // Adding the total days in UTC

    // Update the payload with the new dueDate
    payload.dueDate = newDueDate.toISOString();
  }

  // Update the task in the database
  const result = await Task.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};

const getTasksBoth = async (authorId: string, assignedId: string) => {
  const [authorExists, assignedExists] = await Promise.all([
    User.exists({ _id: authorId }),
    User.exists({ _id: assignedId }),
  ]);

  // If either user does not exist, return empty result
  if (!authorExists || !assignedExists) {
    return null;
  }

  const tasks = await Task.find({
    $or: [
      { author: authorId, assigned: assignedId },
      { author: assignedId, assigned: authorId },
    ],
  }).populate("author assigned company");

  return tasks;
};

const getDueTasksByUser = async (assignedId: string) => {
  const todayStart = moment().startOf("day").toDate();
  const tomorrowStart = moment().add(1, "day").startOf("day").toDate();

  const query = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $lt: tomorrowStart, // Due date is before tomorrow
    },
  };
  const tasks = await Task.find(query)
    .populate("author assigned company")
    .exec();
  return tasks;
};

const getUpcommingTaskByUser = async (assignedId: string) => {
  const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
  // Get the date three days from now and set to the end of that day
  const threeDaysFromNowEnd = moment().add(3, "days").endOf("day").toDate();

  const query = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $gte: tomorrowStart, // Due date is today or later
      $lt: threeDaysFromNowEnd, // Due date is before the end of the third day
    },
  };
  const tasks = await Task.find(query)
    .populate("author assigned company")
    .exec();
  return tasks;
};

export const TaskServices = {
  getAllTaskFromDB,
  getSingleTaskFromDB,
  updateTaskIntoDB,
  createTaskIntoDB,
  getTasksBoth,
  getDueTasksByUser,
  getUpcommingTaskByUser,
};
