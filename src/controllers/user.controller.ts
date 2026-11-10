import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { UserService } from "../services/user.service.js";
import { getPagination } from "../utils/pagination.js";
import type { CreateUserBody, UpdateUserBody, UserIdParams } from "../validators/user.validator.js";

type BodyRequest<T> = Request<Record<string, string>, unknown, T>;

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new HttpError("Authentication required", StatusCodes.UNAUTHORIZED);
  }
  return req.user;
};

export class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = async (req: Request, res: Response) => {
    const { id: user_id } = requireUser(req);
    const user = await this.userService.getProfile(user_id);
    res.status(StatusCodes.OK).json({ user });
  };

  groupByinterests = async (req: Request, res: Response) => {
    const { id: user_id } = requireUser(req);
    const interests = await this.userService.groupUsersByMyInterests(user_id);
    res.status(StatusCodes.OK).json({ interests });
  };

  listNames = async (_req: Request, res: Response) => {
    const users = await this.userService.listUserNames();
    res.status(StatusCodes.OK).json({ users });
  };

  list = async (req: Request, res: Response) => {
    const { items, pagination } = await this.userService.listUsers(getPagination(req));
    res.status(StatusCodes.OK).json({ users: items, pagination });
  };

  create = async (req: BodyRequest<CreateUserBody>, res: Response) => {
    const user = await this.userService.createUser(req.body);
    res.status(StatusCodes.CREATED).json({ user });
  };

  update = async (req: Request<UserIdParams, unknown, UpdateUserBody>, res: Response) => {
    const { id: adminId } = requireUser(req);
    const user = await this.userService.updateUser(adminId, req.params.id, req.body);
    res.status(StatusCodes.OK).json({ user });
  };

  remove = async (req: Request<UserIdParams>, res: Response) => {
    const { id: adminId } = requireUser(req);
    await this.userService.deleteUser(adminId, req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  };
}
