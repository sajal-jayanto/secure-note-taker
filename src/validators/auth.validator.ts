import { z } from "zod";

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, "Email cannot exceed 254 characters")
  .pipe(z.email("Email is invalid"));

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  email: emailField,
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .refine((pw) => Buffer.byteLength(pw, "utf8") <= 72, "Password must be at most 72 bytes"),
  interests: z
    .array(z.string().trim().toLowerCase().min(1).max(50), {
      error: "Interests must be an array of strings",
    })
    .max(20, "At most 20 interests")
    .default([]),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
