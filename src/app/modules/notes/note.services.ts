import QueryBuilder from "../../builder/QueryBuilder";
import { Note } from "./note.model";
import { TNote } from "./note.interface";
import { NoteSearchableFields } from "./note.constant";
import { User } from "../user/user.model";
import mongoose from "mongoose";



const createNoteIntoDB = async (payload: { title: string, assignId: string }) => {
  const { title, assignId } = payload;

  // Find user by ID
  const user = await User.findById(assignId);
  if (!user) {
    return null; // If the user doesn't exist, return null
  }

  // Create the note payload
  const notePayload = {
    title,
    assignId,
    content: '',  // Assuming an empty content initially
    tagId: [],     // Empty array for tags initially, you can add logic later to populate it
  };

  // Create the note in the database
  const data = await Note.create(notePayload);

  // Prepare the result with additional data
  const result = {
    ...data.toObject(),
    assignName: user.name, // Get the name of the assigned user
    noteTitle: data.title, // The title of the note
  };

  return result;
};




const getAllNoteFromDB = async (query: Record<string, unknown>) => {
  const noteQuery = new QueryBuilder(Note.find().populate("author tagId"), query)
    .search(NoteSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await noteQuery.countTotal();
  const result = await noteQuery.modelQuery;

  return {
    meta,
    result,
  };
};




const getNoteByIdFromDB = async (id: string) => {
  const result = await Note.findById(id);
  return result;
};

const updateNoteIntoDB = async (id: string, payload: Partial<TNote>) => {
  const result = await Note.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};

const deleteNoteFromDB = async (id: any) => {
  const result = await Note.findOneAndDelete(id);
  return result;
};

export const NoteServices = {
  getAllNoteFromDB,
  getNoteByIdFromDB,
  updateNoteIntoDB,
  createNoteIntoDB,
  deleteNoteFromDB,
};
