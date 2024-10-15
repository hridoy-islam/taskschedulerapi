import { z } from "zod";

const noteValidationSchema = z.object({
  title: z.string(),
  content: z.string(),
  author: z.string(),
});

export const NoteValidation = {
  noteValidationSchema,
};
