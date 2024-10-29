import { z } from "zod";

const commentValidationSchema = z.object({
  taskId : z.string(),
  authorId: z.string(),
  content: z.string()
});

export const CommentValidation = {
  commentValidationSchema,
};
