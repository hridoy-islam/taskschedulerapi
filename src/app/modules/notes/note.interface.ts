/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TNote {
  _id: Types.ObjectId;
  title: string;
  content: string;
  author: Types.ObjectId;
}
