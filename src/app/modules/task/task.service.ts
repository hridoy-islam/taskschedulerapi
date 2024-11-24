import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { TaskSearchableFields } from "./task.constant";
import { TTask } from "./task.interface";
import { Task } from "./task.model";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import moment from "moment";
import mongoose from "mongoose";

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
  // const updatedMembers = result?.lastSeen.map((member) => {
  //   return {
  //     _id: member._id,
  //     userId: member.userId,
  //     lastMessageReadId: member.lastMessageReadId,
  //   };
  // });
  // return {
  //   ...result,
  //   lastSeen: updatedMembers,
  // };
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

const getTasksBoth = async (authorId: string, assignedId: string, queryParams: Record<string, any>) => {
  const [authorExists, assignedExists] = await Promise.all([
    User.exists({ _id: authorId }),
    User.exists({ _id: assignedId }),
  ]);

  // If either user does not exist, return empty result
  if (!authorExists || !assignedExists) {
    return null;
  }

    // Define the query filters
    const query = {
      $or: [
        { author: authorId, assigned: assignedId },
        { author: assignedId, assigned: authorId },
      ],
      ...queryParams,
    };

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"), // Populate relevant fields
    query // Base query parameters
  )
    .search(['taskName']) // Optionally search by task name
    .filter() // Apply any additional filters from queryParams
    .paginate() // Handle pagination
    .sort() // Apply sorting (if needed)
    .fields(); // Include any specific fields required

  // Get the total count of matching tasks for metadata (pagination info)
  const meta = await taskQuery.countTotal();
  // Execute the query to fetch the tasks
  const result = await taskQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getDueTasksByUser = async (assignedId: string, queryParams: Record<string, any>) => {
  const todayStart = moment().startOf("day").toDate();
  const tomorrowStart = moment().add(1, "day").startOf("day").toDate();

  const query = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $lt: tomorrowStart, // Due date is before tomorrow
    },
    ...queryParams,
  };

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query
  )
    .search(['taskName'])
    .filter() // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)
  const result = await taskQuery.modelQuery; // Get the query result

  return {
    meta,
    result,
  };
};


const getUpcommingTaskByUser = async (assignedId: string, queryParams: Record<string, any>) => {
  const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
  // Get the date three days from now and set to the end of that day
  const threeDaysFromNowEnd = moment().add(7, "days").endOf("day").toDate();

  const query = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $gte: tomorrowStart, // Due date is today or later
      $lt: threeDaysFromNowEnd, // Due date is before the end of the third day
    },
    ...queryParams,
  };

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query
  )
    .search(['taskName'])
    .filter() // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)
  const result = await taskQuery.modelQuery; // Get the query result

  return {
    meta,
    result,
  };
};


const getAssignedTaskByUser = async (authorId: string, queryParams: Record<string, any>) => {
  const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
  const sevenDaysFromNowEnd = moment().add(7, "days").endOf("day").toDate();

  const query = {
    author: authorId, // Author matches the passed authorId
    assigned: { $ne: authorId }, // Assigned is not equal to the passed authorId
    status: "pending", // Assuming you only want pending tasks
    dueDate: {
      $gte: tomorrowStart, // Due date is today or later
      $lt: sevenDaysFromNowEnd, // Due date is before the end of the seventh day
    },
    ...queryParams,
  };
  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query
  )
    .search(['taskName'])
    .filter() // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)
  const result = await taskQuery.modelQuery; // Get the query result

  return {
    meta,
    result,
  };
}

const getTodaysTaskByUser = async (userid: string) => {
  const todayStart = moment().utc().startOf("day").toDate();
  // End of today in UTC
  const todayEnd = moment().utc().endOf("day").toDate();

  const query = {
    assigned: userid, // Filter by assigned ID
    status: "pending", // Adjust as needed (e.g., include completed tasks if necessary)
    dueDate: {
      $gte: todayStart, // Due date is today or later
      $lt: todayEnd, // Due date is before the end of today
    },
  };

  const tasks = await Task.find(query)
    .populate("author assigned company") // Adjust based on your schema
    .exec();

  return tasks;
};

const getTasksForPlannerByMonth = async (
  year: string,
  month: string,
  assigned: string
) => {
  const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
  const endDate = moment(startDate).endOf("month").toDate();

  const tasks = await Task.find({
    dueDate: {
      $gte: startDate,
      $lt: endDate,
    },
    ...(assigned && { assigned }), // Filter by assigned user if provided
  }).populate('author', 'name') // Populate only the name field from the author
  .populate('assigned', 'name');
  return tasks;
};

const getTasksForPlannerByWeek = async (
  year: string,
  week: string,
  assigned?: string // Optional parameter for filtering by user
) => {

  
  // Parse the week and year as numbers
  const weekNumber = parseInt(week, 10);
  const yearNumber = parseInt(year, 10);

  // Validate week number
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    throw new Error(
      "Invalid week number. Please provide a number between 1 and 53."
    );
  }

  // Validate year number (if necessary)
  if (isNaN(yearNumber) || yearNumber < 0) {
    throw new Error("Invalid year. Please provide a valid year.");
  }

  // const startDate = moment()
  //   .year(yearNumber)
  //   .week(weekNumber)
  //   .startOf("isoWeek")
  //   .toDate();

  const startDate = moment().year(yearNumber).week(weekNumber).startOf("isoWeek").subtract(1, 'days').toDate();

  console.log(startDate);

  const endDate = moment(startDate).endOf("isoWeek").toDate();

  console.log(endDate);

  // Fetch tasks from the database
  const tasks = await Task.find({
    dueDate: {
      $gte: startDate,
      $lt: endDate,
    },
    ...(assigned ? { assigned } : {}), // Filter by assigned user if provided
  });

  return tasks;
};

const getTasksForPlannerByDay = async (
  date: string,
  assigned?: string // Optional parameter for filtering by user
) => {
  const targetDate = moment(date).startOf("day").toDate();
  const endDate = moment(targetDate).endOf("day").toDate();

  // Fetch tasks from the database
  const tasks = await Task.find({
    dueDate: {
      $gte: targetDate,
      $lt: endDate,
    },
    ...(assigned && { assigned }), // Filter by assigned user if provided
  });

  return tasks;
};

const updateReadComment = async (
  taskId: string,
  userId: string,
  messageId: string
) => {
  // Fetch the group by ID
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }


  
 try {
   // Update the user's last read message in the group
    if (task.author.toString() === userId) {
      task.authorLastSeenId = new mongoose.Types.ObjectId(messageId);
    } else {
      task.assignedLastSeenId = new mongoose.Types.ObjectId(messageId);
 } }catch (error) {
    console.log(error);
 }
  // Save the updated group
  const result = await task.save();
  return result;
};

export const TaskServices = {
  getAllTaskFromDB,
  getSingleTaskFromDB,
  updateTaskIntoDB,
  createTaskIntoDB,
  getTasksBoth,
  getDueTasksByUser,
  getUpcommingTaskByUser,
  getTodaysTaskByUser,
  getTasksForPlannerByDay,
  getTasksForPlannerByWeek,
  getTasksForPlannerByMonth,
  getAssignedTaskByUser,
  updateReadComment,
};
