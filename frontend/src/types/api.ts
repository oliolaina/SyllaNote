export type ApiRole = 'owner' | 'editor' | 'commentator' | 'reader';

export type AssignableRole = 'editor' | 'commentator' | 'reader';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  myRole: ApiRole | null;
}

export interface Block {
  id: string;
  noteId: string;
  type: string;
  content: unknown;
  order: number;
}

export interface NoteDetail {
  id: string;
  title: string;
  contentJson: Record<string, unknown>;
  ownerId: string;
  owner: Pick<User, 'id' | 'email' | 'name'>;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  myRole: ApiRole;
}

export interface AccessMember {
  userId: string;
  email: string;
  name: string | null;
  role: ApiRole;
}

export interface Comment {
  id: string;
  text: string;
  noteId: string;
  blockId: string | null;
  createdAt: string;
  author: Pick<User, 'id' | 'email' | 'name'>;
}
