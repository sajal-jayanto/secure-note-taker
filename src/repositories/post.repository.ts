import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import { Post, POST_COLLECTION, type IPost, type PostDocument } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { toSkip } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";

export type CreatePostData = Pick<IPost, "title" | "content"> & { userId: string };

export interface UserPostsResult {
  user: { _id: Types.ObjectId; name: string };
  posts: (Pick<IPost, "title" | "content"> & { _id: Types.ObjectId })[];
  total: number;
}

export class PostRepository {
  async create(data: CreatePostData): Promise<PostDocument> {
    try {
      return await Post.create(data);
    } catch (err) {
      throw new HttpError("Failed to create post", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findUserWithPosts(
    userId: string,
    pagination: PaginationQuery,
  ): Promise<UserPostsResult | null> {
    try {
      const [result] = await User.aggregate<UserPostsResult>([
        { $match: { _id: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: POST_COLLECTION,
            localField: "_id",
            foreignField: "userId",
            as: "posts",
            pipeline: [
              { $sort: { createdAt: -1 } },
              { $skip: toSkip(pagination) },
              { $limit: pagination.limit },
              { $project: { title: 1, content: 1 } },
            ],
          },
        },
        {
          $lookup: {
            from: POST_COLLECTION,
            localField: "_id",
            foreignField: "userId",
            as: "postCount",
            pipeline: [{ $count: "total" }],
          },
        },
        {
          $project: {
            _id: 0,
            user: { _id: "$_id", name: "$name" },
            posts: 1,
            total: { $ifNull: [{ $first: "$postCount.total" }, 0] },
          },
        },
      ]);
      return result ?? null;
    } catch (err) {
      throw new HttpError("Failed to get user posts", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }
}
