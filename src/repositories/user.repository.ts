import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import { toSkip, type PaginatedResult } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";
import { User, type IUser, type UserDocument, type UserRole } from "../models/user.model.js";

export type CreateUserData = Pick<IUser, "name" | "email" | "password" | "interests"> & {
  role?: UserRole;
};
export type UpdateUserData = Partial<
  Pick<IUser, "name" | "email" | "password" | "interests" | "role">
>;

export interface InterestGroup {
  interest: string;
  count: number;
  users: { _id: Types.ObjectId; name: string }[];
}

const USERS_PER_INTEREST = 50;

export class UserRepository {
  async create(data: CreateUserData): Promise<UserDocument> {
    try {
      return await User.create(data);
    } catch (err) {
      throw new HttpError("Failed to create user", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findAll(pagination: PaginationQuery): Promise<PaginatedResult<UserDocument>> {
    try {
      const [items, total] = await Promise.all([
        User.find().sort({ createdAt: -1 }).skip(toSkip(pagination)).limit(pagination.limit),
        User.countDocuments(),
      ]);
      return { items, total };
    } catch (err) {
      throw new HttpError("Failed to list users", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findUsersGroupedByInterests(
    interests: string[],
    excludeUserId: string,
  ): Promise<InterestGroup[]> {
    try {
      return await User.aggregate<InterestGroup>([
        {
          $match: {
            interests: { $in: interests },
            _id: { $ne: new Types.ObjectId(excludeUserId) },
          },
        },
        { $unwind: "$interests" },
        { $match: { interests: { $in: interests } } },
        { $sort: { name: 1 } },
        {
          $group: {
            _id: "$interests",
            count: { $sum: 1 },
            users: { $push: { _id: "$_id", name: "$name" } },
          },
        },
        {
          $project: {
            _id: 0,
            interest: "$_id",
            count: 1,
            users: { $slice: ["$users", USERS_PER_INTEREST] },
          },
        },
        { $sort: { interest: 1 } },
      ]);
    } catch (err) {
      throw new HttpError("Failed to group users by interests", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await User.findById(id);
    } catch (err) {
      throw new HttpError("Failed to find user", StatusCodes.INTERNAL_SERVER_ERROR, { cause: err });
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await User.findOne({ email });
    } catch (err) {
      throw new HttpError("Failed to find user", StatusCodes.INTERNAL_SERVER_ERROR, { cause: err });
    }
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    try {
      return await User.findOne({ email }, "+password");
    } catch (err) {
      throw new HttpError("Failed to find user", StatusCodes.INTERNAL_SERVER_ERROR, { cause: err });
    }
  }

  async updateById(id: string, data: UpdateUserData): Promise<UserDocument | null> {
    try {
      return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (err) {
      throw new HttpError("Failed to update user", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async deleteById(id: string): Promise<UserDocument | null> {
    try {
      return await User.findByIdAndDelete(id);
    } catch (err) {
      throw new HttpError("Failed to delete user", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }
}
