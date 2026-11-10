import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import { env } from "../config/env.js";
import { HttpError } from "./error.middleware.js";
import { USER_ROLES, type UserRole } from "../models/user.model.js";

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError("Authentication required", StatusCodes.UNAUTHORIZED));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret, { algorithms: ["HS256"] });
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return next(new HttpError("Invalid token", StatusCodes.UNAUTHORIZED));
    }

    const role: unknown = payload.role;
    if (!isUserRole(role)) {
      return next(new HttpError("Invalid token", StatusCodes.UNAUTHORIZED));
    }

    req.user = { id: payload.sub, role };
    next();
  } catch (err) {
    next(new HttpError("Invalid or expired token", StatusCodes.UNAUTHORIZED, { cause: err }));
  }
};
