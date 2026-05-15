import { Server } from '@hocuspocus/server';
import type { onAuthenticatePayload, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server';
import * as Y from 'yjs';
import { env } from './config/env.js';
import { noteRepository } from './repositories/note.repository.js';
import { accessService } from './services/access.service.js';
import { verifyToken } from './services/jwt.service.js';
import { AppError } from './types/errors.js';

type StoredContent = {
  yjsState?: string;
  [key: string]: unknown;
};

export function startWebSocketServer(): void {
  const server = Server.configure({
    port: env.WS_PORT,

    async onAuthenticate({ token, documentName }: onAuthenticatePayload) {
      if (!token) {
        throw new Error('Authentication token required');
      }

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        throw new Error('Invalid or expired token');
      }

      if (!documentName) {
        throw new Error('Document name (note id) required');
      }

      try {
        await accessService.requireAction(
          payload.userId,
          documentName,
          'websocket_edit',
        );
      } catch (err) {
        if (err instanceof AppError) {
          throw new Error(err.message);
        }
        throw err;
      }

      return { user: { id: payload.userId, email: payload.email } };
    },

    async onLoadDocument({ document, documentName }: onLoadDocumentPayload) {
      const note = await noteRepository.findById(documentName);
      if (!note) return;

      const content = note.contentJson as StoredContent;
      if (content?.yjsState) {
        const update = Buffer.from(content.yjsState, 'base64');
        Y.applyUpdate(document, update);
      }
    },

    async onStoreDocument({ document, documentName }: onStoreDocumentPayload) {
      const note = await noteRepository.findById(documentName);
      if (!note) return;

      const state = Y.encodeStateAsUpdate(document);
      const yjsState = Buffer.from(state).toString('base64');
      const existing = (note.contentJson as StoredContent) ?? {};

      await noteRepository.updateContentJson(documentName, {
        ...existing,
        yjsState,
      });
    },
  });

  server.listen();
  console.log(`WebSocket server listening on ws://localhost:${env.WS_PORT}`);
}
