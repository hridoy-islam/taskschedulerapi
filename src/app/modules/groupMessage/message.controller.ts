import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CommentServices } from "./message.service";

const createMessages = catchAsync(async (req, res) => {
  const requester = req.user as { _id: string; role: string };

  const result = await CommentServices.createMessageIntoDB(req.body, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment is created successfully",
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const requester = req.user as { _id: string; role: string };

  const { id } = req.params;
  // get query params
  const { page, limit } = req.query;
  const pageNumber = page ? parseInt(page as string, 10) : undefined;
  const limitNumber = limit ? parseInt(limit as string, 10) : undefined;

  const result = await CommentServices.getMessagesFromDB(id, pageNumber ?? 1, limitNumber ?? 10, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments is retrieved succesfully",
    data: result,
  });
});


const updateMessage: RequestHandler = catchAsync(async (req, res) => {
  const requester = req.user?._id;

  const { id } = req.params;
  const updatedData = req.body;

  const result = await CommentServices.updateMessageFromDB(id, updatedData, requester);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
});



export const CommentControllers = {
  createMessages,
  getMessages,
  updateMessage
};
