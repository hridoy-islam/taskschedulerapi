import QueryBuilder from "../../builder/QueryBuilder";
import { Tag } from "./tags.model";
import { TTags } from "./tags.interface";
import { TagsSearchableFields } from "./tags.constant";
import mongoose from "mongoose";

const createTagsIntoDB = async (payload: TTags) => {
  const result = await Tag.create(payload);
  return result;
};

const getAllTagsFromDB = async (query: Record<string, unknown>) => {
  const noteQuery = new QueryBuilder(Tag.find().populate("author"), query)
    .search(TagsSearchableFields)
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

const getAllTagsForUserFromDB = async (userId: string, query: Record<string, unknown>) => {
  // First validate userId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const tagQuery = new QueryBuilder(
    Tag.find({ author: userId }).populate({
      path: 'author',
      select: 'name email' // Only select necessary fields
    }),
    query
  )
    .search(TagsSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await tagQuery.countTotal();
  const result = await tagQuery.modelQuery;

  return {
    meta,
    result // Removed the additional filter since we're already querying by author
  };
};

const getSingleTagsFromDB = async (id: string) => {
  const result = await Tag.findById(id);
  return result;
};

const updateTagsIntoDB = async (id: string, payload: Partial<TTags>) => {
  const result = await Tag.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};

const deleteTagsFromDB = async (id: any) => {
  const result = await Tag.findOneAndDelete({_id:id});
  return result;
};

export const TagsServices = {
  createTagsIntoDB,
  getAllTagsFromDB,
  getSingleTagsFromDB,
  updateTagsIntoDB,
  deleteTagsFromDB,
  getAllTagsForUserFromDB
};
