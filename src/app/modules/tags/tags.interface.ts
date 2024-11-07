/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TTags {
  _id: Types.ObjectId;
  name: string;
  author: Types.ObjectId;
}
