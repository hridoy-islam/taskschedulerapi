import QueryBuilder from "../../builder/QueryBuilder";
import { Note } from "./note.model";
import { TNote } from "./note.interface";
import { NoteSearchableFields } from "./note.constant";

const createNoteIntoDB = async (payload: TNote) => {
  const result = await Note.create(payload);
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

const getSingleNoteFromDB = async (id: string) => {
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
  getSingleNoteFromDB,
  updateNoteIntoDB,
  createNoteIntoDB,
  deleteNoteFromDB,
};
