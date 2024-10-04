import { z } from "zod";

const taskValidationSchema = z.object({
  taskName: z.string(),
  description: z.string().optional(),
  author: z.string(),
  assigned: z.string().optional(),
  status: z.enum(["pending", "completed"]),
  isDeleted: z.boolean().optional(),
  dueDate: z.string().optional(),
});

export const TaskValidation = {
  taskValidationSchema,
};
