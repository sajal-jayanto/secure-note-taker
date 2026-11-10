import { z } from "zod";

export const noteIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, "Invalid note id"),
});

const titleField = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(200, "Title cannot exceed 200 characters");

const contentField = z
  .string({ error: "Content is required" })
  .min(1, "Content is required")
  .max(50_000, "Content cannot exceed 50,000 characters");

export const createNoteSchema = z.object({
  title: titleField,
  content: contentField,
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export type NoteIdParams = z.infer<typeof noteIdParamSchema>;
export type CreateNoteBody = z.infer<typeof createNoteSchema>;
export type UpdateNoteBody = z.infer<typeof updateNoteSchema>;
