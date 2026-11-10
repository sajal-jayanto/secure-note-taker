import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { PostService } from "../services/post.service.js";
import { getPagination } from "../utils/pagination.js";
import type { CreatePostBody } from "../validators/post.validator.js";
import type { UserIdParams } from "../validators/user.validator.js";

type BodyRequest<T> = Request<Record<string, string>, unknown, T>;

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new HttpError("Authentication required", StatusCodes.UNAUTHORIZED);
  }
  return req.user;
};

export class PostController {
  constructor(private readonly postService: PostService) {}

  create = async (req: BodyRequest<CreatePostBody>, res: Response) => {
    const { id: userId } = requireUser(req);
    const post = await this.postService.createPost(userId, req.body);
    res.status(StatusCodes.CREATED).json({ post });
  };

  listByUser = async (req: Request<UserIdParams>, res: Response) => {
    const result = await this.postService.getPostsByUser(req.params.id, getPagination(req));
    res.status(StatusCodes.OK).json(result);
  };
}
