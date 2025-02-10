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
      default:''
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    tags :[ {
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    favorite: {
      type: Boolean,
      default: false,
    },
    isArchive:{
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

export const Note = model<TNote>("notes", noteSchema);
