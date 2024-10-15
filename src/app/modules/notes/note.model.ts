/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TNote } from "./note.interface";

const noteSchema = new Schema<TNote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
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

export const Note = model<TNote>("notes", noteSchema);
