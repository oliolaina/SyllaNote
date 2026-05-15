import type { Request, Response } from 'express';
import { commentService } from '../services/comment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const commentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const comments = await commentService.list(req.userId!, req.params.noteId);
    res.json(comments);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.create(req.userId!, req.body);
    res.status(201).json(comment);
  }),
};
