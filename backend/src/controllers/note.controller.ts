import type { Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const noteController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.create(req.userId!, req.body);
    res.status(201).json(note);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const notes = await noteService.list(req.userId!);
    res.json(notes);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.getById(req.userId!, req.params.id);
    res.json(note);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.update(req.userId!, req.params.id, req.body);
    res.json(note);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await noteService.delete(req.userId!, req.params.id);
    res.status(204).send();
  }),
};
