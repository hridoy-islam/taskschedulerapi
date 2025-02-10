import QueryBuilder from "../../builder/QueryBuilder";
import { Tag } from "./tags.model";
import { TTags } from "./tags.interface";
import { TagsSearchableFields } from "./tags.constant";

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

const getAllTagsForUserFromDB = async (userId:string,query: Record<string, unknown>) => {
  const noteQuery = new QueryBuilder(Tag.find({ author: userId }), query)
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
