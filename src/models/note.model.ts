import { Schema, model, type HydratedDocument, type Model, type Types } from "mongoose";

export interface INote {
  userId: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteModel = Model<INote>;
export type NoteDocument = HydratedDocument<INote>;

const noteSchema = new Schema<INote, NoteModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Note owner (userId) is required"],
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
    collection: "notes",
    toJSON: {
      transform: (_doc, ret) => {
        const { createdAt: _createdAt, updatedAt: _updatedAt, __v: _version, ...safe } = ret;
        return safe;
      },
    },
  },
);

noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ _id: 1, userId: 1 });
noteSchema.index({ createdAt: 1 });

export const Note = model<INote, NoteModel>("Note", noteSchema);
