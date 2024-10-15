import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { NoteServices } from "./note.services";

const createNote = catchAsync(async (req, res) => {
  const result = await NoteServices.createNoteIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note is created successfully",
    data: result,
  });
});

const getAllNotes: RequestHandler = catchAsync(async (req, res) => {
  const result = await NoteServices.getAllNoteFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note retrived succesfully",
    data: result,
  });
});
const getSingleNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NoteServices.getSingleNoteFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note is retrieved succesfully",
    data: result,
  });
});

const updateNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NoteServices.updateNoteIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is updated succesfully",
    data: result,
  });
});

const deleteNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NoteServices.deleteNoteFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Note is deleted succesfully",
    data: result,
  });
});

export const NoteControllers = {
  getAllNotes,
  createNote,
  updateNote,
  getSingleNote,
  deleteNote,
};
