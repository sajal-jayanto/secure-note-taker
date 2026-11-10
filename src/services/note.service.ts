import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { NoteDocument } from "../models/note.model.js";
import type { NoteRepository } from "../repositories/note.repository.js";
import { buildPagination, type Paginated } from "../utils/pagination.js";
import type { PaginationQuery } from "../validators/pagination.validator.js";
import type { CreateNoteBody, UpdateNoteBody } from "../validators/note.validator.js";

type PublicNote = ReturnType<NoteDocument["toJSON"]>;

const noteNotFound = () => new HttpError("Note not found", StatusCodes.NOT_FOUND);

export class NoteService {
  constructor(private readonly noteRepository: NoteRepository) {}

  async listNotes(userId: string, pagination: PaginationQuery): Promise<Paginated<PublicNote>> {
    const { items, total } = await this.noteRepository.findAllByUser(userId, pagination);
    return {
      items: items.map((note) => note.toJSON()),
      pagination: buildPagination(pagination, total),
    };
  }

  async getNote(userId: string, noteId: string): Promise<PublicNote> {
    const note = await this.noteRepository.findByIdForUser(noteId, userId);
    if (!note) throw noteNotFound();
    return note.toJSON();
  }

  async createNote(userId: string, requestBody: CreateNoteBody): Promise<PublicNote> {
    const { title, content } = requestBody;
    const note = await this.noteRepository.create({ userId, title, content });
    return note.toJSON();
  }

  async updateNote(
    userId: string,
    noteId: string,
    requestBody: UpdateNoteBody,
  ): Promise<PublicNote> {
    const note = await this.noteRepository.updateByIdForUser(noteId, userId, requestBody);
    if (!note) throw noteNotFound();
    return note.toJSON();
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const note = await this.noteRepository.deleteByIdForUser(noteId, userId);
    if (!note) throw noteNotFound();
  }

  async listAllNotes(pagination: PaginationQuery): Promise<Paginated<PublicNote>> {
    const { items, total } = await this.noteRepository.findAll(pagination);
    return {
      items: items.map((note) => note.toJSON()),
      pagination: buildPagination(pagination, total),
    };
  }

  async listNotesOfUser(
    userId: string,
    pagination: PaginationQuery,
  ): Promise<Paginated<PublicNote>> {
    return this.listNotes(userId, pagination);
  }
}
