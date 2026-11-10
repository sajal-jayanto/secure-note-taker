import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  content: z
    .string({ error: "Content is required" })
    .min(1, "Content is required")
    .max(50_000, "Content cannot exceed 50,000 characters"),
});

export type CreatePostBody = z.infer<typeof createPostSchema>;
