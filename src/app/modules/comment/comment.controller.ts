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
  const user = req.user;
  const result = await CommentServices.getCommentsFromDB(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments is retrieved succesfully",
    data: result,
  });
});


const updateComment: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params; 
  const updatedContent = req.body; 
  const requester = req.user._id; 

  const result = await CommentServices.updateCommentFromDB(id, updatedContent, requester);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});



export const CommentControllers = {
  createComment,
  getComments,
  updateComment
};
