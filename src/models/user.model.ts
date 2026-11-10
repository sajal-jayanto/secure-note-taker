import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, object, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name cannot be empty"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [EMAIL_PATTERN, "Email is invalid"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: { values: USER_ROLES, message: "Role must be one of: user, admin" },
      default: "user",
    },
    interests: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      transform: (_doc, ret) => {
        const {
          password: _password,
          __v: _version,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...safe
        } = ret;
        return safe;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const { password: _password, ...safe } = ret;
        return safe;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: 1 });
userSchema.index({ interests: 1 });

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    throw new Error("Password hash not loaded. Query the user with .select('+password') first.");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, UserModel>("User", userSchema);
