import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { UserDocument } from "../models/user.model.js";
import type {
  InterestGroup,
  UpdateUserData,
  UserRepository,
  UserSummary,
} from "../repositories/user.repository.js";
import { buildPagination, type Paginated } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";
import type { CreateUserBody, UpdateUserBody } from "../validators/user.validator.js";

type PublicUser = ReturnType<UserDocument["toJSON"]>;

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpError("User not found", StatusCodes.NOT_FOUND);
    }
    return user.toJSON();
  }

  async groupUsersByMyInterests(userId: string): Promise<InterestGroup[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpError("User not found", StatusCodes.NOT_FOUND);
    }
    if (user.interests.length === 0) {
      return [];
    }

    const groups = await this.userRepository.findUsersGroupedByInterests(user.interests, userId);

    const byInterest = new Map(groups.map((group) => [group.interest, group]));
    const interest = [...user.interests]
      .sort()
      .map((interest) => byInterest.get(interest) ?? { interest, count: 0, users: [] });

    return interest;
  }

  async listUserNames(): Promise<UserSummary[]> {
    return this.userRepository.findAllNames();
  }

  async listUsers(pagination: PaginationQuery): Promise<Paginated<PublicUser>> {
    const { items, total } = await this.userRepository.findAll(pagination);
    return {
      items: items.map((user) => user.toJSON()),
      pagination: buildPagination(pagination, total),
    };
  }

  async createUser(requestBody: CreateUserBody): Promise<PublicUser> {
    const { name, email, password, interests, role } = requestBody;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpError("Email is already registered", StatusCodes.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await this.userRepository.create({
      name,
      email,
      password: passwordHash,
      interests,
      role,
    });

    return createdUser.toJSON();
  }

  async updateUser(
    adminId: string,
    userId: string,
    requestBody: UpdateUserBody,
  ): Promise<PublicUser> {
    if (adminId === userId && requestBody.role && requestBody.role !== "admin") {
      throw new HttpError("You cannot change your own role", StatusCodes.BAD_REQUEST);
    }

    if (requestBody.email) {
      const existingUser = await this.userRepository.findByEmail(requestBody.email);
      if (existingUser && existingUser.id !== userId) {
        throw new HttpError("Email is already registered", StatusCodes.CONFLICT);
      }
    }

    const { password, ...rest } = requestBody;
    const updateData: UpdateUserData = { ...rest };
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await this.userRepository.updateById(userId, updateData);
    if (!updatedUser) {
      throw new HttpError("User not found", StatusCodes.NOT_FOUND);
    }
    return updatedUser.toJSON();
  }

  async deleteUser(adminId: string, userId: string): Promise<void> {
    if (adminId === userId) {
      throw new HttpError("You cannot delete your own account", StatusCodes.BAD_REQUEST);
    }

    const deletedUser = await this.userRepository.deleteById(userId);
    if (!deletedUser) {
      throw new HttpError("User not found", StatusCodes.NOT_FOUND);
    }
  }
}
