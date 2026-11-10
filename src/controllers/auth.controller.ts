import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import type { AuthService } from "../services/auth.service.js";
import type { LoginBody, RegisterBody } from "../validators/auth.validator.js";

type BodyRequest<T> = Request<Record<string, string>, unknown, T>;

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: BodyRequest<RegisterBody>, res: Response) => {
    const { body } = req;
    const response = await this.authService.register(body);
    res.status(StatusCodes.CREATED).json(response);
  };

  login = async (req: BodyRequest<LoginBody>, res: Response) => {
    const { body } = req;
    const response = await this.authService.login(body);
    res.status(StatusCodes.OK).json(response);
  };
}
