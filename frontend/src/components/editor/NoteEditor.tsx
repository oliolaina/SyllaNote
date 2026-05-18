import { HocuspocusProvider } from '@hocuspocus/provider';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode } from '@lexical/rich-text';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { Provider } from '@lexical/yjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import type { ApiRole } from '../../types/api';
import { countAwarenessUsers } from '../../utils/collaboration';
import { canEdit, canViewCollaboration } from '../../utils/permissions';
import { EditorToolbar } from './EditorToolbar';
import { editorTheme } from './editorTheme';
import styles from './NoteEditor.module.css';

function resolveWsUrl(raw: string | undefined): string {
  const value = raw ?? 'ws://localhost:8080';
  if (value.startsWith('https://')) return `wss://${value.slice(8)}`;
  if (value.startsWith('http://')) return `ws://${value.slice(7)}`;
  return value;
}

const WS_URL = resolveWsUrl(import.meta.env.VITE_WS_URL);

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

function InitialContentPlugin({ contentJson }: { contentJson: Record<string, unknown> }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (contentJson?.root) {
      try {
        const state = editor.parseEditorState(JSON.stringify(contentJson));
        editor.setEditorState(state);
      } catch {
        /* ignore invalid state */
      }
    }
  }, [editor, contentJson]);

  return null;
}

interface NoteEditorProps {
  noteId: string;
  contentJson: Record<string, unknown>;
  myRole: ApiRole;
  token: string | null;
  userName: string;
  onOnlineChange?: (count: number) => void;
}

export function NoteEditor({
  noteId,
  contentJson,
  myRole,
  token,
  userName,
  onOnlineChange,
}: NoteEditorProps) {
  const editable = canEdit(myRole);
  const useCollab = canViewCollaboration(myRole) && !!token;
  const hasYjsState = Boolean(contentJson?.yjsState);
  const hasLexicalRoot = Boolean(contentJson?.root);
  const [isSynced, setIsSynced] = useState(!useCollab);

  useEffect(() => {
    setIsSynced(!useCollab);
  }, [noteId, useCollab]);

  const collabInitialState = useMemo(() => {
    if (editable && !hasYjsState && hasLexicalRoot) {
      return JSON.stringify(contentJson);
    }
    return undefined;
  }, [contentJson, editable, hasLexicalRoot, hasYjsState]);

  const initialConfig = useMemo(
    () => ({
      namespace: 'SyllaNote',
      theme: editorTheme,
      editable,
      nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
      onError: (e: Error) => console.error(e),
    }),
    [editable],
  );

  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
      }

      const provider = new HocuspocusProvider({
        url: WS_URL,
        name: id,
        document: doc,
        token,
        connect: true,
        onSynced: ({ state }) => {
          if (state) setIsSynced(true);
        },
        onAwarenessUpdate: ({ states }) => {
          onOnlineChange?.(countAwarenessUsers(states));
        },
      });

      return provider as unknown as Provider;
    },
    [token, onOnlineChange],
  );

  const placeholder = useMemo(() => {
    if (!useCollab) {
      return <div className={styles.placeholder}>Начните писать конспект…</div>;
    }
    if (!isSynced) {
      return <div className={styles.placeholder}>Загрузка конспекта…</div>;
    }
    if (editable) {
      return <div className={styles.placeholder}>Начните писать конспект…</div>;
    }
    return null;
  }, [useCollab, isSynced, editable]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={[styles.wrapper, !editable ? styles.readOnly : ''].join(' ')}>
        {editable && <EditorToolbar disabled={!editable} />}
        <div className={styles.editorContainer}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.editor} />}
            placeholder={placeholder}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {!useCollab && <InitialContentPlugin contentJson={contentJson} />}
          {useCollab && providerFactory && (
            <CollaborationPlugin
              id={noteId}
              providerFactory={providerFactory}
              shouldBootstrap={!hasYjsState && editable}
              username={userName}
              initialEditorState={collabInitialState}
            />
          )}
          {!useCollab && <HistoryPlugin />}
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin
            matchers={[
              (text) => {
                const match = URL_MATCHER.exec(text);
                if (!match) return null;
                return {
                  index: match.index,
                  length: match[0].length,
                  text: match[0],
                  url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
                };
              },
            ]}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
