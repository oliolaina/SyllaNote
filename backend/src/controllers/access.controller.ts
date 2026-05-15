import type { Request, Response } from 'express';
import { accessManagementService } from '../services/access-management.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const accessController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const members = await accessManagementService.listMembers(
      req.userId!,
      req.params.noteId,
    );
    res.json(members);
  }),

  invite: asyncHandler(async (req: Request, res: Response) => {
    const member = await accessManagementService.invite(req.userId!, req.body);
    res.status(201).json(member);
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const member = await accessManagementService.updateRole(
      req.userId!,
      req.params.noteId,
      req.params.userId,
      req.body.role,
    );
    res.json(member);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await accessManagementService.removeMember(
      req.userId!,
      req.params.noteId,
      req.params.userId,
    );
    res.status(204).send();
  }),
};
