import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { TaskSearchableFields } from "./task.constant";
import { TTask } from "./task.interface";
import { Task } from "./task.model";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import moment from "moment";
import mongoose from "mongoose";
import { Comment } from "../comment/comment.model";
import { NotificationService } from "../notification/notification.service";
import { getIO } from "../../../socket";
import { ScheduleTask } from "../scheduleTask/scheduleTask.model";




const handleRecurringTask = async (task: any, originalPayload: any) => {
  try {
    // 1. Check for the boolean flag
    const isRec = originalPayload?.isRecurring || originalPayload?.IsRecurring || task?.isRecurring || task?.IsRecurring;

    if (!isRec) {
      // If false, just exit quietly
      return;
    }

    // 2. Safely map payload and ensure undefined is passed instead of null for numbers
    const schedulePayload = {
      taskName: originalPayload.taskName || task.taskName,
      description: originalPayload.description || task.description,
      author: task.author, // from the created task to ensure it's an ObjectId
      assigned: task.assigned, // from the created task
      company: task.company || null,
      status: originalPayload.status || task.status || "pending",
      priority: originalPayload.priority || task.priority || "low",
      dueDate: originalPayload.dueDate || task.dueDate,
      isRecurring: true, // Force to boolean true
      frequency: originalPayload.frequency || task.frequency || "once",
      scheduledAt: originalPayload.scheduledAt || task.scheduledAt,
      scheduledDate: originalPayload.scheduledDate || task.scheduledDate || undefined,
    };

    // 3. Check if this exact schedule already exists
    const exists = await ScheduleTask.findOne({
      taskName: schedulePayload.taskName,
      author: schedulePayload.author,
    });

    if (exists) {

      await ScheduleTask.updateOne(
        { _id: exists._id },
        { $set: schedulePayload }
      );
     
      return { success: true, message: "Schedule task updated!" };
    }

    // 🆕 CREATE NEW
    const newSchedule = await ScheduleTask.create(schedulePayload);
    
    
    return { success: true, message: "Schedule task created!" };

  } catch (error) {
   
    console.error(" Error creating schedule:", error);
  }
};


const createTaskIntoDB = async (payload: TTask) => {
  const author = await User.findById(payload.author);
  const assigned = await User.findById(payload.assigned);
  
  if (!author || !assigned) {
    return null;
  }

  // Company Logic
  if (author._id.toString() === assigned._id.toString()) {
    payload.company = null;
  } else {
    payload.company = assigned.company;
  }

  // Setup LastSeen array
  const lastSeen = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: author._id,
      lastSeenId: null,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: assigned._id,
      lastSeenId: null,
    },
  ];
  payload.lastSeen = lastSeen;

  // 1. Create the Task
  const result = await Task.create(payload);

  // 2. Handle Recurring Logic (New Addition)
await handleRecurringTask(result, payload);

  // 3. Notification Logic
  if (author._id.toString() !== assigned._id.toString()) {
    const notification = await NotificationService.createNotificationIntoDB({
      userId: assigned._id,
      senderId: author._id,
      type: "task",
      message: `${author.name} assigned a new task "${result.taskName}"`,
      docId: result._id.toString(),
    });

    const io = getIO();
    const assignedId = assigned._id.toString();
    io.to(assignedId).emit("notification", notification);
  }

  return result;
};

const getAllTaskFromDB = async (query: Record<string, unknown>) => {
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query,
  )
    .search(TaskSearchableFields)
    .filter(query)
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

const getAllTaskForUserFromDB = async (
  id: string,
  query: Record<string, unknown>,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  const filterQuery = {
    $or: [
      { author: new mongoose.Types.ObjectId(id) },
      { assigned: new mongoose.Types.ObjectId(id) },
    ],
  };

  const taskQuery = new QueryBuilder(
    Task.find(filterQuery).populate("author assigned company"),
    query,
  )
    .search(TaskSearchableFields)
    .filter(query)
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
  const result = await Task.findById(id)
    .populate({
      path: "author",
      select: "name image",
    })
    .populate({
      path: "assigned",
      select: "name image",
    });

  return result;
};

const reassignTaskFromDB = async (id: string) => {
  const task = await Task.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "pending",
        completedBy: [],
      },
      $pop: {
        history: 1, // removes last item
      },
    },
    { new: true },
  );

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }

  return task;
};

const updateTaskIntoDB = async (id: string, payload: Partial<TTask>) => {
  const existingTask = await Task.findById(id);

  if (!existingTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }

  // ------------------------------------------------
  // 1️⃣ Due Date Formatting
  // ------------------------------------------------
  if (payload.dueDate) {
    if (typeof payload.dueDate === "number") {
      const existingDueDateInDays = existingTask.dueDate
        ? Math.floor(
            (moment(existingTask.dueDate).utc().valueOf() -
              moment(existingTask.createdAt).utc().valueOf()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      const newDueDateInDays = existingDueDateInDays + payload.dueDate;
      const createdAt = moment(existingTask.createdAt).utc();
      const newDueDate = createdAt.add(newDueDateInDays, "days");

      payload.dueDate = newDueDate.toISOString() as any;
    } else {
      payload.dueDate = moment(payload.dueDate).utc().toISOString() as any;
    }
  }

  const updateQuery: any = {
    $set: { ...payload },
  };

  // Prevent manual overwrite of history
  if (updateQuery.$set.history) {
    delete updateQuery.$set.history;
  }

  // ------------------------------------------------
  // 2️⃣ AUTO ADD ASSIGNED IF AUTHOR COMPLETED
  // ------------------------------------------------

  // Get the most up-to-date array (from payload if being updated, otherwise from DB)
  let currentCompletedBy =
    payload.completedBy || existingTask.completedBy || [];

  const authorId = existingTask.author?.toString();
  const assignedId = existingTask.assigned?.toString();

  // Only proceed if both an author and an assigned user exist
  if (authorId && assignedId) {
    // Check for the presence of both users
    const isAuthorPresent = currentCompletedBy.some(
      (entry: any) => entry.userId?.toString() === authorId,
    );

    const isAssignedPresent = currentCompletedBy.some(
      (entry: any) => entry.userId?.toString() === assignedId,
    );

    // If author is in the array, but assigned is NOT, add assigned "no matter what"
    if (isAuthorPresent && !isAssignedPresent) {
      // Clone the array and append the assigned user
      currentCompletedBy = [
        ...currentCompletedBy,
        { userId: existingTask.assigned },
      ];

      // Explicitly set it in updateQuery.$set to avoid $addToSet vs $set conflicts
      updateQuery.$set.completedBy = currentCompletedBy;
    }
  }




  
 

  const result = await Task.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  return result;
};

// get the message count for each group
const getUnreadCount = async (data: any) => {
  const { _id, taskId } = data;
  const user = await User.findById(_id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // console.log(`User found: ${user}`);

  // Ensure `user._id` is of type `ObjectId`
  const userObjectId = mongoose.Types.ObjectId.isValid(_id)
    ? new mongoose.Types.ObjectId(_id)
    : null;
  const taskObjectId = mongoose.Types.ObjectId.isValid(_id)
    ? new mongoose.Types.ObjectId(taskId)
    : null;

  if (!userObjectId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid User ID format");
  }

  // Fetch tasks where the user is a member
  // const tasks = await Task.find({
  //   // "lastSeen.userId": userObjectId,
  //   _id: taskObjectId,
  // });
  const tasks = await Task.find({
    $or: [
      { author: userObjectId, assigned: taskObjectId },
      { assigned: userObjectId, author: taskObjectId },
    ],
  });

  const groupWithMessageCount = await Promise.all(
    tasks.map(async (task: any) => {
      const member = task.lastSeen.find(
        (m: any) => m.userId.toString() === userObjectId.toString(),
      );
      const lastMessageReadId = member ? member.lastSeenId : null;

      const unreadMessageCount = await Comment.countDocuments({
        taskId: task._id,
        ...(lastMessageReadId !== null
          ? { _id: { $gt: lastMessageReadId } }
          : {}),
      });

      return {
        ...task.toObject(),
        unreadMessageCount,
      };
    }),
  );
  return groupWithMessageCount;
};

const getSingleUserUnreadCount = async (data: any) => {
  const { _id, type } = data;
  const user = await User.findById(_id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // console.log(`User found: ${user}`);

  // Ensure `user._id` is of type `ObjectId`
  const userObjectId = mongoose.Types.ObjectId.isValid(_id)
    ? new mongoose.Types.ObjectId(_id)
    : null;

  if (!userObjectId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid User ID format");
  }

  // Fetch tasks where the user is a member
  // const tasks = await Task.find({
  //   // "lastSeen.userId": userObjectId,
  //   _id: taskObjectId,
  // });
  let tasks;
  if (type === "author") {
    tasks = await Task.find({
      $or: [{ author: userObjectId }],
    });
  } else {
    tasks = await Task.find({
      $or: [{ assigned: userObjectId }],
    });
  }

  const groupWithMessageCount = await Promise.all(
    tasks.map(async (task: any) => {
      const member = task.lastSeen.find(
        (m: any) => m.userId.toString() === userObjectId.toString(),
      );
      const lastMessageReadId = member ? member.lastSeenId : null;

      const unreadMessageCount = await Comment.countDocuments({
        taskId: task._id,
        ...(lastMessageReadId !== null
          ? { _id: { $gt: lastMessageReadId } } // Count messages after the last read ID
          : {}), // Count all messages if lastMessageReadId is null
      });

      return {
        ...task.toObject(),
        unreadMessageCount,
      };
    }),
  );
  return groupWithMessageCount;
};

const getTasksBoth = async (
  authorId: string,
  assignedId: string,
  queryParams: Record<string, any>,
) => {
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
      // { author: assignedId, assigned: authorId },
    ],
    ...queryParams,
  };

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"), // Apply the query here
    query,
  )
    .search(["taskName"]) // Optionally search by task name
    .filter(query) // Apply any additional filters from queryParams
    .paginate() // Handle pagination
    .sort() // Apply sorting (if needed)
    .fields(); // Include any specific fields required

  // Get the total count of matching tasks for metadata (pagination info)
  const meta = await taskQuery.countTotal();
  // Execute the query to fetch the tasks
  const count = await getUnreadCount({ _id: authorId, taskId: assignedId });
  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });

  const data2 = await taskQuery.modelQuery;
  const result = data2.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });
  return {
    meta,
    result,
  };
};

const getNeedToFinishTasks = async (
  authorId: string,
  queryParams: Record<string, any>,
) => {
  // 1. Check if author exists
  const authorExists = await User.exists({ _id: authorId });

  if (!authorExists) {
    return null;
  }

  // 2. Define the filters
  const filters = {
    author: authorId,
    status: "pending",
    // $expr allows us to compare the 'assigned' field with the 'completedBy' array
    $expr: {
      $in: [
        "$assigned",
        { $ifNull: ["$completedBy.userId", []] }, // FIX: Ensure this always resolves to an array
      ],
    },
    isDeleted: false,
  };

  // 3. Build the query
  const taskQuery = new QueryBuilder(
    Task.find(filters).populate("author assigned company"),
    queryParams,
  )
    .search(["taskName"])
    .filter(queryParams)
    .paginate()
    .sort()
    .fields();

  const meta = await taskQuery.countTotal();
  const data = await taskQuery.modelQuery;

  // 4. Unread Count Logic
  const count = await getUnreadCount({ _id: authorId });
  const readCountMap = new Map(
    count.map((c: any) => [c._id.toString(), c.unreadMessageCount]),
  );

  const result = data.map((task: any) => {
    const taskObj = task.toObject();
    return {
      ...taskObj,
      unreadMessageCount: readCountMap.get(taskObj._id.toString()) || 0,
    };
  });

  return {
    meta,
    result,
  };
};
const getNeedToFinishTasksBoth = async (
  authorId: string,
  assignedId: string,
  queryParams: Record<string, any>,
) => {
  const [authorExists, assignedExists] = await Promise.all([
    User.exists({ _id: authorId }),
    User.exists({ _id: assignedId }),
  ]);

  if (!authorExists || !assignedExists) {
    return null;
  }

  // FIX: Explicitly check if the 'completedBy' array contains the 'assigned' user's ID.
  // This matches tasks that are Pending but where the assignee has marked them as done.
  const filters = {
    $or: [
      {
        author: authorId,
        assigned: assignedId,
        "completedBy.userId": assignedId, // Check if assignee is in completedBy
      },
      // If you enable bidirectional support later, use this:
      // {
      //   author: assignedId,
      //   assigned: authorId,
      //   "completedBy.userId": authorId
      // }
    ],
    status: "pending",
  };

  const taskQuery = new QueryBuilder(
    Task.find(filters).populate("author assigned company"),
    queryParams,
  )
    .search(["taskName"])
    .filter(queryParams)
    .paginate()
    .sort()
    .fields();

  const meta = await taskQuery.countTotal();
  const data2 = await taskQuery.modelQuery;

  // Unread Count Logic
  const count = await getUnreadCount({ _id: authorId });
  const readCountMap = new Map(
    count.map((c: any) => [c._id.toString(), c.unreadMessageCount]),
  );

  const result = data2.map((task: any) => {
    return {
      ...task.toObject(),
      unreadMessageCount: readCountMap.get(task._id.toString()) || 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getcompleteTasksBoth = async (
  authorId: string,
  assignedId: string,
  queryParams: Record<string, any>,
) => {
  const [authorExists, assignedExists] = await Promise.all([
    User.exists({ _id: authorId }),
    User.exists({ _id: assignedId }),
  ]);

  if (!authorExists || !assignedExists) {
    return null;
  }

  // Get the start and end of the current day to check the history array
  const startOfDay = moment().startOf("day").toDate();
  const endOfDay = moment().endOf("day").toDate();

  // FIX: Advanced query for completed status + recurring history
  const filters = {
    $and: [
      {
        $or: [
          { author: authorId, assigned: assignedId },
          { author: assignedId, assigned: authorId },
        ],
      },
      {
        $or: [
          { status: "completed" }, 
         {
            "completedBy.userId": authorId
          }
        ],
      },
    ],
  };

  const taskQuery = new QueryBuilder(
    Task.find(filters).populate("author assigned company"),
    queryParams,
  )
    .search(["taskName"])
    .filter(queryParams)
    .paginate()
    .sort()
    .fields();

  const meta = await taskQuery.countTotal();
  const data2 = await taskQuery.modelQuery;

  // Unread Count Logic
  const count = await getUnreadCount({ _id: authorId });
  const readCountMap = new Map(
    count.map((c: any) => [c._id.toString(), c.unreadMessageCount]),
  );

  const result = data2.map((task: any) => {
    return {
      ...task.toObject(),
      unreadMessageCount: readCountMap.get(task._id.toString()) || 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getDueTasksByUser = async (
  assignedId: string,
  queryParams: Record<string, any>,
) => {
  const todayStart = moment().startOf("day").toDate();
  const tomorrowStart = moment().add(1, "day").startOf("day").toDate();

  // Check if date range is provided in queryParams
  const { start, end } = queryParams.dateRange || {};
  const startDate = start ? moment(start).startOf("day").toDate() : null;
  const endDate = end ? moment(end).endOf("day").toDate() : null;

  const query: {
    assigned: string;
    status: string;
    dueDate: { $lt?: Date; $gte?: Date; $lte?: Date };
    [key: string]: any;
  } = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $lt: tomorrowStart, // Default filter: Due date is before tomorrow
    },
    ...queryParams,
  };

  // Add additional filters for date range
  // if (startDate) {
  //   query.dueDate.$gte = startDate; // Add $gte for startDate
  // }
  // if (endDate) {
  //   query.dueDate.$lte = endDate; // Add $lte for endDate
  // }

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query,
  )
    .search(["taskName"])
    .filter(queryParams) // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)
  const data = await taskQuery.modelQuery; // Get the query result

  // Execute the query to fetch the tasks
  const count = await getSingleUserUnreadCount({
    _id: assignedId,
  });
  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });
  const result = data.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getUpcommingTaskByUser = async (
  assignedId: string,
  queryParams: Record<string, any>,
) => {
  const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
  // Get the date three days from now and set to the end of that day
  // const threeDaysFromNowEnd = moment().add(7, "days").endOf("day").toDate();

  const query = {
    assigned: assignedId, // Filter by assigned ID
    status: "pending",
    dueDate: {
      $gte: tomorrowStart, // Due date is today or later
    },
    ...queryParams,
  };

  // $lt: threeDaysFromNowEnd, // Due date is before the end of the third day

  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query,
  )
    .search(["taskName"])
    .filter(queryParams) // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)
  const data = await taskQuery.modelQuery; // Get the query result

  // Execute the query to fetch the tasks
  const count = await getSingleUserUnreadCount({
    _id: assignedId,
  });
  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });
  const result = data.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getImportantTaskByUser = async (
  userId: string,
  queryParams: Record<string, any>,
) => {
  const query = {
    importantBy: userId,
    status: "pending",
    ...queryParams,
  };

  // 2. Pass the query to your QueryBuilder
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query,
  )
    .search(["taskName"])
    .filter(queryParams)
    .paginate()
    .sort()
    .fields();

  const meta = await taskQuery.countTotal();
  const data = await taskQuery.modelQuery;

  // 3. Fetch unread counts
  const count = await getSingleUserUnreadCount({
    _id: userId,
  });

  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });

  // 4. Map the results
  const result = data.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getAssignedTaskByUser = async (
  authorId: string,
  queryParams: Record<string, any>,
) => {
  // const tomorrowStart = moment().add(1, "days").startOf("day").toDate();
  // const sevenDaysFromNowEnd = moment().add(7, "days").endOf("day").toDate();

  const query = {
    author: authorId, // Author matches the passed authorId
    assigned: { $ne: authorId }, // Assigned is not equal to the passed authorId
    status: "pending", // Assuming you only want pending tasks
    ...queryParams,
  };
  // Use the QueryBuilder to build the query
  const taskQuery = new QueryBuilder(
    Task.find().populate("author assigned company"),
    query,
  )
    .search(["taskName"])
    .filter(queryParams) // Apply filters (this will automatically apply the provided `query` object)
    .paginate() // Handle pagination if necessary
    .sort() // You can define a sort order as needed
    .fields(); // Include any specific fields you need

  const meta = await taskQuery.countTotal(); // Get metadata (e.g., total count)

  const data = await taskQuery.modelQuery; // Get the query result
  // Execute the query to fetch the tasks
  const count = await getSingleUserUnreadCount({
    _id: authorId,
    type: "author",
  });
  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });
  const result = data.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });

  return {
    meta,
    result,
  };
};

const getTodaysTaskByUser = async (userid: string) => {
  const todayStart = moment().startOf("day").toDate();
  // End of today in UTC
  const todayEnd = moment().endOf("day").toDate();

  const query = {
    assigned: userid, // Filter by assigned ID
    status: "pending", // Adjust as needed (e.g., include completed tasks if necessary)
    dueDate: {
      $gte: todayStart, // Due date is today or later
      $lt: todayEnd, // Due date is before the end of today
    },
  };

  // console.log("Query for today's tasks:", query);

  const data = await Task.find(query)
    .populate("author assigned company") // Adjust based on your schema
    .exec();

  // Execute the query to fetch the tasks
  const count = await getSingleUserUnreadCount({
    _id: userid,
  });
  const readCount = count.map((c: any) => {
    return {
      _id: c._id,
      unreadMessageCount: c.unreadMessageCount,
    };
  });
  const result = data.map((task: any) => {
    const unreadCount = readCount.find(
      (c: any) => c._id.toString() === task._id.toString(),
    );
    return {
      ...task.toObject(),
      unreadMessageCount: unreadCount ? unreadCount.unreadMessageCount : 0,
    };
  });
  // console.log(result)
  return result;
};

const getTasksForPlannerByMonth = async (
  year: string,
  month: string,
  assigned: string,
) => {
  const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
  const endDate = moment(startDate).endOf("month").toDate();

  const tasks = await Task.find({
    dueDate: {
      $gte: startDate,
      $lt: endDate,
    },

    status: "pending",
    ...(assigned && { assigned }), // Filter by assigned user if provided
  })
    .populate("author", "name") // Populate only the name field from the author
    .populate("assigned", "name");
  return tasks;
};

const getTasksForPlannerByWeek = async (
  year: string,
  week: string,
  assigned: string, // Optional parameter for filtering by user
) => {
  // Parse the week and year as numbers
  const weekNumber = parseInt(week, 10);
  const yearNumber = parseInt(year, 10);

  // Validate week number
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    throw new Error(
      "Invalid week number. Please provide a number between 1 and 53.",
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

  // const startDate = moment().year(yearNumber).week(weekNumber).startOf("isoWeek").subtract(1, 'days').toDate();

  const startDate = moment()
    .year(yearNumber)
    .isoWeek(weekNumber)
    .startOf("isoWeek")
    .toDate();

  const endDate = moment(startDate).endOf("isoWeek").toDate();

  // Fetch tasks from the database
  // const tasks = await Task.find({
  //   dueDate: {
  //     $gte: startDate,
  //     $lt: endDate,
  //   },
  //   ...(assigned ? { assigned } : {}), // Filter by assigned user if provided
  // });

  // return tasks;

  const tasks = await Task.find({
    dueDate: {
      $gte: startDate,
      $lt: endDate,
    },

    status: "pending",
    ...(assigned && { assigned }), // Filter by assigned user if provided
  })
    .populate("author", "name") // Populate only the name field from the author
    .populate("assigned", "name");
  return tasks;
};

const getTasksForPlannerByDay = async (
  date: string,
  assigned?: string, // Optional parameter for filtering by user
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
  messageId: string,
) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // ✅ Handles both populated object and raw ObjectId
  const toId = (field: any): string => {
    if (!field) return '';
    return typeof field === 'object' && field._id
      ? field._id.toString()
      : field.toString();
  };

  const isAuthor = toId(task.author) === userId;
  const isAssigned = toId((task as any).assigned) === userId;

  if (!isAuthor && !isAssigned) {
    throw new AppError(httpStatus.FORBIDDEN, "User is not related to this task");
  }

  // Upsert lastSeen
  const isMember = task.lastSeen?.find((t) => t.userId?.toString() === userId);

  if (isMember) {
    task.lastSeen = task.lastSeen?.map((member) => {
      if (member.userId?.toString() === userId) {
        member.lastSeenId = new mongoose.Types.ObjectId(messageId);
      }
      return member;
    });
  } else {
    if (!task.lastSeen) task.lastSeen = [];
    task.lastSeen.push({
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      lastSeenId: new mongoose.Types.ObjectId(messageId),
    });
  }

  const result = await task.save();
  return result;
};

export const TaskServices = {
  getAllTaskFromDB,
  getSingleTaskFromDB,
  updateTaskIntoDB,
  createTaskIntoDB,
  getTasksBoth,
  getTasksForPlannerByDay,
  getTasksForPlannerByWeek,
  getTasksForPlannerByMonth,
  updateReadComment,
  getDueTasksByUser,
  getUpcommingTaskByUser,
  getTodaysTaskByUser,
  getAllTaskForUserFromDB,
  reassignTaskFromDB,
  getNeedToFinishTasksBoth,
  getcompleteTasksBoth,
  getAssignedTaskByUser,
  getNeedToFinishTasks,
  getImportantTaskByUser,
};
