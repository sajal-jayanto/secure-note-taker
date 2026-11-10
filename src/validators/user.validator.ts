import { z } from "zod";

import { USER_ROLES } from "../models/user.model.js";
import { registerSchema } from "./auth.validator.js";

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/i, "Invalid user id"),
});

const roleField = z.enum(USER_ROLES, { error: "Role must be one of: user, admin" });

export const createUserSchema = registerSchema.extend({
  role: roleField.default("user"),
});

export const updateUserSchema = registerSchema
  .extend({
    interests: registerSchema.shape.interests.unwrap(),
    role: roleField,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export type UserIdParams = z.infer<typeof userIdParamSchema>;
export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
