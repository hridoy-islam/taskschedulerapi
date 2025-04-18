import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UploadDocumentService } from "./documents.service";



const UploadDocument = catchAsync(async (req, res) => {

  const result = await UploadDocumentService.UploadDocumentToGCS(req.file, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upload document successfully",
    data: result,
  });
});




export const UploadDocumentController = {
  UploadDocument
};
