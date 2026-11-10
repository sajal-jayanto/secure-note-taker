import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { HttpError } from "../middlewares/error.middleware.js";
import type { NoteService } from "../services/note.service.js";
import { getPagination } from "../utils/pagination.js";
import type { CreateNoteBody, NoteIdParams, UpdateNoteBody } from "../validators/note.validator.js";
import type { UserIdParams } from "../validators/user.validator.js";

type BodyRequest<T> = Request<Record<string, string>, unknown, T>;

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new HttpError("Authentication required", StatusCodes.UNAUTHORIZED);
  }
  return req.user;
};

export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  list = async (req: Request, res: Response) => {
    const { id: userId } = requireUser(req);
    const { items, pagination } = await this.noteService.listNotes(userId, getPagination(req));
    res.status(StatusCodes.OK).json({ notes: items, pagination });
  };

  getOne = async (req: Request<NoteIdParams>, res: Response) => {
    const { id: userId } = requireUser(req);
    const note = await this.noteService.getNote(userId, req.params.id);
    res.status(StatusCodes.OK).json({ note });
  };

  create = async (req: BodyRequest<CreateNoteBody>, res: Response) => {
    const { id: userId } = requireUser(req);
    const note = await this.noteService.createNote(userId, req.body);
    res.status(StatusCodes.CREATED).json({ note });
  };

  update = async (req: Request<NoteIdParams, unknown, UpdateNoteBody>, res: Response) => {
    const { id: userId } = requireUser(req);
    const note = await this.noteService.updateNote(userId, req.params.id, req.body);
    res.status(StatusCodes.OK).json({ note });
  };

  remove = async (req: Request<NoteIdParams>, res: Response) => {
    const { id: userId } = requireUser(req);
    await this.noteService.deleteNote(userId, req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  };

  listAll = async (req: Request, res: Response) => {
    const { items, pagination } = await this.noteService.listAllNotes(getPagination(req));
    res.status(StatusCodes.OK).json({ notes: items, pagination });
  };

  listByUser = async (req: Request<UserIdParams>, res: Response) => {
    const { items, pagination } = await this.noteService.listNotesOfUser(
      req.params.id,
      getPagination(req),
    );
    res.status(StatusCodes.OK).json({ notes: items, pagination });
  };
}
