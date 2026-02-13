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
const reassignTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.reassignTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task reassigned succesfully",
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
  const queryParams = req.query;
  const result = await TaskServices.getTasksBoth(authorId, assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is Fetched succesfully",
    data: result,
  });
});
const getNeedToFinishTaskForUsers = catchAsync(async (req, res) => {
  const { authorId, assignedId } = req.params;
  const queryParams = req.query;
  const result = await TaskServices.getNeedToFinishTasksBoth(authorId, assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is Finished succesfully",
    data: result,
  });
});
const getCompleteTaskForUsers = catchAsync(async (req, res) => {
  const { authorId, assignedId } = req.params;
  const queryParams = req.query;
  const result = await TaskServices.getcompleteTasksBoth(authorId, assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is completed succesfully",
    data: result,
  });
});

const getDueTasks = catchAsync(async (req, res) => {
  const { assignedId } = req.params;
  const queryParams = req.query;
  const result = await TaskServices.getDueTasksByUser(assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Due Task is Fetched succesfully",
    data: result,
  });
});

const getUpcommingTask = catchAsync(async (req, res) => {
  const { assignedId } = req.params;
  const queryParams = req.query; 
  const result = await TaskServices.getUpcommingTaskByUser(assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upcomming Task is Fetched succesfully",
    data: result,
  });
});
const getImportantTaskByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const queryParams = req.query; 
  const result = await TaskServices.getImportantTaskByUser(userId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upcomming Task is Fetched succesfully",
    data: result,
  });
});

const getAssignedTask = catchAsync(async (req, res) => {
  const { authorId } = req.params;
  const queryParams = req.query; 
  const result = await TaskServices.getAssignedTaskByUser(authorId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Asssigned Task is Fetched succesfully",
    data: result,
  });
});

const getNeedToFinishTask = catchAsync(async (req, res) => {
  const { authorId } = req.params;
  const queryParams = req.query; 
  const result = await TaskServices.getNeedToFinishTasks(authorId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Need To Finish Task is Fetched succesfully",
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

const updateReadComment = catchAsync(async (req, res) => {
  const { taskId, userId, messageId } = req.body;
  const result = await TaskServices.updateReadComment(taskId, userId, messageId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is updated succesfully",
    data: result,
  });
});


const getAllTaskForUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.getAllTaskForUserFromDB(id as string, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is retrieved succesfully",
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
  getAssignedTask,
  updateReadComment,
  getAllTaskForUser,
  reassignTask,
  getNeedToFinishTaskForUsers,
  getCompleteTaskForUsers,
  getNeedToFinishTask,
  getImportantTaskByUser
};
