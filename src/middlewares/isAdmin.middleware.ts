import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "./error.middleware.js";

export const isAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new HttpError("Authentication required", StatusCodes.UNAUTHORIZED));
  }
  if (req.user.role !== "admin") {
    return next(new HttpError("Admin access required", StatusCodes.FORBIDDEN));
  }
  next();
};
