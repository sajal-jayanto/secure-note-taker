import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { PostDocument } from "../models/post.model.js";
import type { PostRepository, UserPostsResult } from "../repositories/post.repository.js";
import { buildPagination, type PaginationMeta } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";
import type { CreatePostBody } from "../validators/post.validator.js";

export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async createPost(
    userId: string,
    requestBody: CreatePostBody,
  ): Promise<ReturnType<PostDocument["toJSON"]>> {
    const { title, content } = requestBody;
    const post = await this.postRepository.create({ userId, title, content });
    return post.toJSON();
  }

  async getPostsByUser(
    userId: string,
    pagination: PaginationQuery,
  ): Promise<Omit<UserPostsResult, "total"> & { pagination: PaginationMeta }> {
    const result = await this.postRepository.findUserWithPosts(userId, pagination);
    if (!result) {
      throw new HttpError("User not found", StatusCodes.NOT_FOUND);
    }

    const { user, posts, total } = result;
    return { user, posts, pagination: buildPagination(pagination, total) };
  }
}
