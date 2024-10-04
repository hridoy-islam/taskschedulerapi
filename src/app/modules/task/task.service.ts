import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { TaskSearchableFields } from "./task.constant";
import { TTask } from "./task.interface";
import { Task } from "./task.model";
import AppError from "../../errors/AppError";

const createTaskIntoDB = async (payload: TTask) => {
  const result = await Task.create(payload);
  return result;
};

const getAllTaskFromDB = async (query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(Task.find(), query)
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

export const TaskServices = {
  getAllTaskFromDB,
  getSingleTaskFromDB,
  updateTaskIntoDB,
  createTaskIntoDB,
};
