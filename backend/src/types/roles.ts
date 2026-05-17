import type { Role } from '@prisma/client';

export type ApiRole = 'owner' | 'editor' | 'commentator' | 'reader';

export type AccessAction =
  | 'read'
  | 'edit'
  | 'delete'
  | 'manage_access'
  | 'comment'
  | 'websocket_edit';

export function roleToApi(role: Role): ApiRole {
  return role.toLowerCase() as ApiRole;
}

export function apiToRole(role: ApiRole): Role {
  return role.toUpperCase() as Role;
}
