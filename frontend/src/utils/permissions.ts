import type { ApiRole } from '../types/api';

export function canEdit(role: ApiRole | null | undefined): boolean {
  return role === 'owner' || role === 'editor';
}

export function canComment(role: ApiRole | null | undefined): boolean {
  return role === 'owner' || role === 'editor' || role === 'commentator';
}

export function canManageAccess(role: ApiRole | null | undefined): boolean {
  return role === 'owner';
}

export function canUseCollaboration(role: ApiRole | null | undefined): boolean {
  return canEdit(role);
}

/** Подключение к Yjs/Hocuspocus для просмотра актуального текста (все роли с доступом к конспекту) */
export function canViewCollaboration(role: ApiRole | null | undefined): boolean {
  return (
    role === 'owner' ||
    role === 'editor' ||
    role === 'commentator' ||
    role === 'reader'
  );
}

export function roleLabel(role: ApiRole): string {
  const labels: Record<ApiRole, string> = {
    owner: 'Владелец',
    editor: 'Редактор',
    commentator: 'Комментатор',
    reader: 'Читатель',
  };
  return labels[role];
}
