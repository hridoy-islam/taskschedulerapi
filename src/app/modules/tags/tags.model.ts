/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TTags } from "./tags.interface";

const tagsSchema = new Schema<TTags>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Tags = model<TTags>("tags", tagsSchema);
