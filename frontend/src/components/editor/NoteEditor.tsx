import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode } from '@lexical/rich-text';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useMemo } from 'react';
import type { Provider } from '@lexical/yjs';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import type { ApiRole } from '../../types/api';
import { canEdit, canUseCollaboration } from '../../utils/permissions';
import { EditorToolbar } from './EditorToolbar';
import { editorTheme } from './editorTheme';
import styles from './NoteEditor.module.css';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

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
  const useCollab = canUseCollaboration(myRole) && !!token;
  const hasYjsState = Boolean(contentJson?.yjsState);

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

  const providerFactory = useMemo(() => {
    if (!useCollab || !token) return undefined;
    return (id: string, yjsDocMap: Map<string, Y.Doc>) => {
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
      }
      const provider = new WebsocketProvider(WS_URL, id, doc, {
        connect: true,
        params: { token },
      });
      if (onOnlineChange) {
        const update = () => onOnlineChange(provider.awareness.getStates().size || 1);
        provider.awareness.on('change', update);
        update();
      }
      return provider as unknown as Provider;
    };
  }, [useCollab, token, onOnlineChange]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={[styles.wrapper, !editable ? styles.readOnly : ''].join(' ')}>
        {editable && <EditorToolbar disabled={!editable} />}
        <div className={styles.editorContainer}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.editor} />}
            placeholder={
              <div className={styles.placeholder}>Начните писать конспект…</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          {!useCollab && <InitialContentPlugin contentJson={contentJson} />}
          {useCollab && providerFactory && (
            <CollaborationPlugin
              id={noteId}
              providerFactory={providerFactory}
              shouldBootstrap={!hasYjsState}
              username={userName}
            />
          )}
          <HistoryPlugin />
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
