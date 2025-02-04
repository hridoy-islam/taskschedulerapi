
import { Schema, model } from "mongoose";
import { TGroup, TGroupMember } from "./group.interface";

const membersSchema = new Schema<TGroupMember>({
  _id: {
    type: Schema.Types.ObjectId,
    ref: "User", // Assuming there's a User model
    required: true,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
    required: true,
  },
  acceptInvitation: {
    type: Boolean,
    default: false,
    required: true,
  },
  lastMessageReadId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
});
const groupSchema = new Schema<TGroup>(
  {
    
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User", // Assuming there's a User model
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming tasks are assigned to users
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    members: [membersSchema],
    isArchived:{
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);


groupSchema.methods.getFormattedDates = function () {
  return {
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const Group = model<TGroup>("group", groupSchema);
