import QueryBuilder from "../../builder/QueryBuilder";
import { Tags } from "./tags.model";
import { TTags } from "./tags.interface";
import { TagsSearchableFields } from "./tags.constant";

const createTagsIntoDB = async (payload: TTags) => {
  const result = await Tags.create(payload);
  return result;
};

const getAllTagsFromDB = async (query: Record<string, unknown>) => {
  const noteQuery = new QueryBuilder(Tags.find().populate("author"), query)
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
  const result = await Tags.findById(id);
  return result;
};

const updateTagsIntoDB = async (id: string, payload: Partial<TTags>) => {
  const result = await Tags.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    upsert: true,
  });

  return result;
};

const deleteTagsFromDB = async (id: any) => {
  const result = await Tags.findOneAndDelete(id);
  return result;
};

export const TagsServices = {
  createTagsIntoDB,
  getAllTagsFromDB,
  getSingleTagsFromDB,
  updateTagsIntoDB,
  deleteTagsFromDB
};
