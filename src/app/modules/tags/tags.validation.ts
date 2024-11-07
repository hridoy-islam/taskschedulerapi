import { z } from "zod";

const tagsValidationSchema = z.object({
  author: z.string(),
  name : z.string(),
});

export const TagsValidation = {
  tagsValidationSchema,
};
