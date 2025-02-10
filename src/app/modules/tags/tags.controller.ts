import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TagsServices } from "./tags.services";

const createTags = catchAsync(async (req, res) => {
  const result = await TagsServices.createTagsIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag is created successfully",
    data: result,
  });
});

const getAllTags: RequestHandler = catchAsync(async (req, res) => {

  const result = await TagsServices.getAllTagsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag retrived succesfully",
    data: result,
  });
});

const getAllForUserTags: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await TagsServices.getAllTagsForUserFromDB(id ,req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag retrived succesfully",
    data: result,
  });
});
const getSingleTags = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TagsServices.getSingleTagsFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag is retrieved succesfully",
    data: result,
  });
});

const updateTags = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TagsServices.updateTagsIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag is updated succesfully",
    data: result,
  });
});

const deleteTags = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TagsServices.deleteTagsFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tag is deleted succesfully",
    data: result,
  });
});

export const TagsControllers = {
  createTags,
  getAllTags,
  deleteTags,
  updateTags,
  getSingleTags,
  getAllForUserTags
};
