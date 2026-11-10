import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import { env } from "../config/env.js";
import { HttpError } from "../middlewares/error.middleware.js";
import type { UserDocument } from "../models/user.model.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { LoginBody, RegisterBody } from "../validators/auth.validator.js";

export interface AuthResult {
  user: ReturnType<UserDocument["toJSON"]>;
  token: string;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(requestBody: RegisterBody): Promise<AuthResult> {
    const { name, email, interests, password } = requestBody;

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
    });

    return this.buildAuthResult(createdUser);
  }

  async login(requestBody: LoginBody): Promise<AuthResult> {
    const { email, password } = requestBody;

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new HttpError(`No user found with the email ${email}`, StatusCodes.NOT_FOUND);
    }

    const passwordMatche = await user.comparePassword(password);
    if (!passwordMatche) {
      throw new HttpError("Invalid password", StatusCodes.UNAUTHORIZED);
    }

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: UserDocument): AuthResult {
    return { user: user.toJSON(), token: this.signToken(user) };
  }

  private signToken(user: UserDocument): string {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
      algorithm: "HS256",
    });
  }
}
