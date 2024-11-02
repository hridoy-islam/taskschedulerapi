import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TaskServices } from "./task.service";

const createTask = catchAsync(async (req, res) => {
  const result = await TaskServices.createTaskIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is created successfully",
    data: result,
  });
});

const getAllTask: RequestHandler = catchAsync(async (req, res) => {
  const result = await TaskServices.getAllTaskFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks retrived succesfully",
    data: result,
  });
});
const getSingleTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.getSingleTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is retrieved succesfully",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.updateTaskIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is updated succesfully",
    data: result,
  });
});

const getTaskForUsers = catchAsync(async (req, res) => {
  const { authorId, assignedId } = req.params;
  const result = await TaskServices.getTasksBoth(authorId, assignedId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is Fetched succesfully",
    data: result,
  });
});

const getDueTasks = catchAsync(async (req, res) => {
  const { assignedId } = req.params;
  const result = await TaskServices.getDueTasksByUser(assignedId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Due Task is Fetched succesfully",
    data: result,
  });
});

const getUpcommingTask = catchAsync(async (req, res) => {
  const { assignedId } = req.params;
  const result = await TaskServices.getUpcommingTaskByUser(assignedId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upcomming Task is Fetched succesfully",
    data: result,
  });
});

const getAssignedTask = catchAsync(async (req, res) => {
  const { authorId } = req.params;
  const result = await TaskServices.getAssignedTaskByUser(authorId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Asssigned Task is Fetched succesfully",
    data: result,
  });
});

const getTodaysTasks = catchAsync(async (req, res) => {
  const { userid } = req.params;
  const result = await TaskServices.getTodaysTaskByUser(userid);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Today's Task is Fetched succesfully",
    data: result,
  });
});

const getPlannerTasks = catchAsync(async (req, res) => {
  const { year, month, assigned } = req.params;
  const result = await TaskServices.getTasksForPlannerByMonth(
    year,
    month,
    assigned
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planners Monthly Task is Fetched succesfully",
    data: result,
  });
});

const getPlannerTasksByWeek = catchAsync(async (req, res) => {
  const { year, week, assigned } = req.params;
  const result = await TaskServices.getTasksForPlannerByWeek(
    year,
    week,
    assigned
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planners Weekly Task is Fetched succesfully",
    data: result,
  });
});

const getPlannerTasksByDay = catchAsync(async (req, res) => {
  const { date, assigned } = req.params;
  const result = await TaskServices.getTasksForPlannerByDay(date, assigned);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planners Day Task is Fetched succesfully",
    data: result,
  });
});

export const TaskControllers = {
  getAllTask,
  getSingleTask,
  updateTask,
  createTask,
  getTaskForUsers,
  getDueTasks,
  getUpcommingTask,
  getTodaysTasks,
  getPlannerTasks,
  getPlannerTasksByWeek,
  getPlannerTasksByDay,
  getAssignedTask
};
