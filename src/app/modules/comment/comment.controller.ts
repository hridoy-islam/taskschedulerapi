import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CommentServices } from "./comment.service";

const createComment = catchAsync(async (req, res) => {
  const result = await CommentServices.createCommentIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment is created successfully",
    data: result,
  });
});

const getComments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CommentServices.getCommentsFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments is retrieved succesfully",
    data: result,
  });
});



export const CommentControllers = {
  createComment,
  getComments
};
