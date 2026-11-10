import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z, type ZodType } from "zod";

import { HttpError } from "./error.middleware.js";

export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(
        new HttpError("Validation failed", StatusCodes.BAD_REQUEST, {
          details: z.flattenError(result.error).fieldErrors,
        }),
      );
    }
    req.body = result.data;
    next();
  };

export const validateParams =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(
        new HttpError("Validation failed", StatusCodes.BAD_REQUEST, {
          details: z.flattenError(result.error).fieldErrors,
        }),
      );
    }
    next();
  };

export const validateQuery =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new HttpError("Validation failed", StatusCodes.BAD_REQUEST, {
          details: z.flattenError(result.error).fieldErrors,
        }),
      );
    }
    Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
    next();
  };
