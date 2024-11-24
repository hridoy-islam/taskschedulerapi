// group.validation.ts
import { z } from "zod";
import mongoose from "mongoose";

// Define a preprocessor that converts string input to ObjectId if valid
const objectIdSchema = z.preprocess((val) => {
  if (typeof val === "string" && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  return val;
}, z.instanceof(mongoose.Types.ObjectId));

const GroupMemberSchema = z.object({
  userId: objectIdSchema, // Automatically convert to ObjectId
  role: z.enum(["member", "admin"]).default("member"),
  acceptInvitation: z.boolean().default(false),
  lastMessageReadId: objectIdSchema.nullable().optional(), // Nullable ObjectId
});

const GroupValidationSchema = z.object({
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  groupName: z.string().nonempty("Group name is required"),
  description: z.string().optional(),
  creator: objectIdSchema, // Automatically convert to ObjectId
  company: objectIdSchema.optional(), // Optional ObjectId
  status: z.enum(["active", "archived"]).default("active"),
  members: z.array(GroupMemberSchema),
});

export const GroupValidation = {
  GroupValidationSchema,
};
