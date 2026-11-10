import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface IPost {
  userId: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PostModel = Model<IPost>;
export type PostDocument = HydratedDocument<IPost>;

export const POST_COLLECTION = "posts";

const postSchema = new Schema<IPost, PostModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post author (userId) is required"],
      immutable: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
  },
  {
    timestamps: true,
    collection: POST_COLLECTION,
    toJSON: {
      transform: (_doc, ret) => {
        const { createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...safe } = ret;
        return safe;
      },
    },
  },
);

postSchema.index({ userId: 1, createdAt: -1 });

export const Post = model<IPost, PostModel>("Post", postSchema);
