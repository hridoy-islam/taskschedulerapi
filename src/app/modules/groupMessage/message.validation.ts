import { z } from "zod";

const groupMessageValidationSchema = z.object({
  taskId : z.string(),
  authorId: z.string(),
  content: z.string()
});

export const CommentValidation = {
  groupMessageValidationSchema,
};
