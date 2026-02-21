import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ScheduleTaskServices } from "./scheduleTask.service";

const createScheduleTask = catchAsync(async (req, res) => {
  const result = await ScheduleTaskServices.createScheduleTaskIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleTask is created successfully",
    data: result,
  });
});

const getAllScheduleTask: RequestHandler = catchAsync(async (req, res) => {
  const result = await ScheduleTaskServices.getAllScheduleTaskFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleTasks retrived succesfully",
    data: result,
  });
});
const getSingleScheduleTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleTaskServices.getSingleScheduleTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleTask is retrieved succesfully",
    data: result,
  });
});
const deleteScheduleTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleTaskServices.deleteScheduleTask(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleTask is deleted succesfully",
    data: result,
  });
});


const updateScheduleTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleTaskServices.updateScheduleTaskIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is updated succesfully",
    data: result,
  });
});






const getAssignedScheduleTask = catchAsync(async (req, res) => {
  const { authorId, assignedId } = req.params;
  const queryParams = req.query; 
  const result = await ScheduleTaskServices.getAssignedScheduleTasks(authorId,assignedId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Asssigned Task is Fetched succesfully",
    data: result,
  });
});


const getPersonalScheduleTasks = catchAsync(async (req, res) => {
  const { authorId} = req.params;
  const queryParams = req.query; 
  const result = await ScheduleTaskServices.getPersonalScheduleTasks(authorId, queryParams);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is Fetched succesfully",
    data: result,
  });
});



export const ScheduleTaskControllers = {
  getAllScheduleTask,
  getSingleScheduleTask,
  updateScheduleTask,
  getAssignedScheduleTask,
  createScheduleTask,
  getPersonalScheduleTasks,
  deleteScheduleTask

};
