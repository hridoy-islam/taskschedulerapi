import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { ScheduleTaskSearchableFields } from "./scheduleTask.constant";
import { TScheduleTask } from "./scheduleTask.interface";
import { ScheduleTask } from "./scheduleTask.model";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import moment from "moment";
import mongoose from "mongoose";
import { Comment } from "../comment/comment.model";
import { NotificationService } from "../notification/notification.service";
import { getIO } from "../../../socket";
import { assign } from "nodemailer/lib/shared";






const createScheduleTaskIntoDB = async (payload: TScheduleTask) => {
  const author = await User.findById(payload.author);
  const assigned = await User.findById(payload.assigned);
 if (!author) {
    throw new AppError(httpStatus.NOT_FOUND, "Author not found");
  }

  if (!assigned) {
    throw new AppError(httpStatus.NOT_FOUND, "Assigned user not found");
  }

  const result = await ScheduleTask.create(payload);


  return result;
};

const getAllScheduleTaskFromDB = async (query: Record<string, unknown>) => {
  const ScheduleTaskQuery = new QueryBuilder(
    ScheduleTask.find().populate("author assigned company"),
    query,
  )
    .search(ScheduleTaskSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await ScheduleTaskQuery.countTotal();
  const result = await ScheduleTaskQuery.modelQuery;

  return {
    meta,
    result,
  };
};



const getSingleScheduleTaskFromDB = async (id: string) => {
  const result = await ScheduleTask.findById(id)
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

const updateScheduleTaskIntoDB = async (id: string, payload: Partial<TScheduleTask>) => {
   const existingScheduleTask = await ScheduleTask.findById(id);

  if (!existingScheduleTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }
  const result = await ScheduleTask.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};



const getPersonalScheduleTasks = async (
  authorId: string,
 
  queryParams: Record<string, any>,
) => {
  const [authorExists,] = await Promise.all([
    User.exists({ _id: authorId }),

  ]);

  if (!authorExists) {
    throw new AppError(404, "Author not found");
  }


  const query = {
    $or: [
      { author: authorId, assigned: authorId },
   
    ],
   
    ...queryParams,
  };

  const ScheduleTaskQuery = new QueryBuilder(
    ScheduleTask.find().populate("author assigned company"),
    query,
  )
    .search(["ScheduleTaskName"])
    .filter(query)
    .paginate()
    .sort()
    .fields();

  const meta = await ScheduleTaskQuery.countTotal();
  const data = await ScheduleTaskQuery.modelQuery;

  return {
    meta,
    result: data.map((task: any) => task.toObject()),
  };
};

const getAssignedScheduleTasks = async (
  authorId: string,
  assignedId: string,
  queryParams: Record<string, any>,
) => {
  // 1. Validate Users
  const [authorExists, assignedExists] = await Promise.all([
    User.exists({ _id: authorId }),
    User.exists({ _id: assignedId }),
  ]);

  if (!authorExists) throw new AppError(404, "Author not found");
  if (!assignedExists) throw new AppError(404, "Assigned user not found");

  // 2. Separate pagination/search/sort params from filter params
  const { searchTerm, page, limit, sortBy, sortOrder, fields, ...restQueryParams } = queryParams;

  // 3. Apply $and condition directly in find() — safe from queryParams overwriting
  const baseCondition = {
    $and: [
      {
        $or: [
          { author: authorId },
          // {  assigned: authorId },
        ],
      },
      {
        $expr: { $ne: ["$author", "$assigned"] },
      },
    ],
    isDeleted: false,
    ...restQueryParams, // safe: no author/assigned keys here
  };

  // 4. Pass only pagination/search/sort to QueryBuilder
  const builderParams = { searchTerm, page, limit, sortBy, sortOrder, fields };

  const ScheduleTaskQuery = new QueryBuilder(
    ScheduleTask.find(baseCondition).populate("author assigned company"),
    builderParams,
  )
    .search(["taskName"])
    .filter(queryParams)      // no argument — only uses builderParams, won't touch $and
    .paginate()
    .sort()
    .fields();

  const meta = await ScheduleTaskQuery.countTotal();
  const data = await ScheduleTaskQuery.modelQuery;

  return {
    meta,
    result: data.map((task: any) => task.toObject()),
  };
};
const deleteScheduleTask = async (id: string) => {
  const scheduleTask = await ScheduleTask.findById(id);

  if (!scheduleTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }


  const result = await ScheduleTask.findByIdAndDelete(id);

  return result;
};


export const ScheduleTaskServices = {
  getAllScheduleTaskFromDB,
  getSingleScheduleTaskFromDB,
  updateScheduleTaskIntoDB,
  createScheduleTaskIntoDB,
  getAssignedScheduleTasks,
  getPersonalScheduleTasks,
  deleteScheduleTask

};
