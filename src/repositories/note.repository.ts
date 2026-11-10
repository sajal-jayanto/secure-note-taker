import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import { toSkip, type PaginatedResult } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";
import { Note, type INote, type NoteDocument } from "../models/note.model.js";

export type CreateNoteData = Pick<INote, "title" | "content"> & { userId: string };
export type UpdateNoteData = Partial<Pick<INote, "title" | "content">>;

export class NoteRepository {
  async create(data: CreateNoteData): Promise<NoteDocument> {
    try {
      return await Note.create(data);
    } catch (err) {
      throw new HttpError("Failed to create note", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findAllByUser(
    userId: string,
    pagination: PaginationQuery,
  ): Promise<PaginatedResult<NoteDocument>> {
    try {
      const [items, total] = await Promise.all([
        Note.find({ userId })
          .sort({ createdAt: -1 })
          .skip(toSkip(pagination))
          .limit(pagination.limit),
        Note.countDocuments({ userId }),
      ]);
      return { items, total };
    } catch (err) {
      throw new HttpError("Failed to list notes", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findAll(pagination: PaginationQuery): Promise<PaginatedResult<NoteDocument>> {
    try {
      const [items, total] = await Promise.all([
        Note.find()
          .sort({ createdAt: -1 })
          .skip(toSkip(pagination))
          .limit(pagination.limit)
          .populate("userId", "name email"),
        Note.countDocuments(),
      ]);
      return { items, total };
    } catch (err) {
      throw new HttpError("Failed to list notes", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async findById(noteId: string): Promise<NoteDocument | null> {
    try {
      return await Note.findById(noteId);
    } catch (err) {
      throw new HttpError("Failed to find note", StatusCodes.INTERNAL_SERVER_ERROR, { cause: err });
    }
  }

  async findByIdForUser(noteId: string, userId: string): Promise<NoteDocument | null> {
    try {
      return await Note.findOne({ _id: noteId, userId });
    } catch (err) {
      throw new HttpError("Failed to find note", StatusCodes.INTERNAL_SERVER_ERROR, { cause: err });
    }
  }

  async updateByIdForUser(
    noteId: string,
    userId: string,
    data: UpdateNoteData,
  ): Promise<NoteDocument | null> {
    try {
      return await Note.findOneAndUpdate({ _id: noteId, userId }, data, {
        new: true,
        runValidators: true,
      });
    } catch (err) {
      throw new HttpError("Failed to update note", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }

  async deleteByIdForUser(noteId: string, userId: string): Promise<NoteDocument | null> {
    try {
      return await Note.findOneAndDelete({ _id: noteId, userId });
    } catch (err) {
      throw new HttpError("Failed to delete note", StatusCodes.INTERNAL_SERVER_ERROR, {
        cause: err,
      });
    }
  }
}
