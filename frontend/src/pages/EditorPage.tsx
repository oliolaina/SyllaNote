import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AccessModal } from '../components/access/AccessModal';
import { CommentsPanel } from '../components/comments/CommentsPanel';
import { NoteEditor } from '../components/editor/NoteEditor';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { commentsService } from '../services/comments.service';
import { notesService } from '../services/notes.service';
import { useAuthStore } from '../store/authStore';
import type { Comment, NoteDetail } from '../types/api';
import { canManageAccess, roleLabel } from '../utils/permissions';
import styles from './EditorPage.module.css';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessOpen, setAccessOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [noteRes, commentsRes] = await Promise.all([
        notesService.get(id),
        commentsService.list(id),
      ]);
      setNote(noteRes.data);
      setComments(commentsRes.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddComment = async (text: string, blockId?: string) => {
    if (!id) return;
    const { data } = await commentsService.create({ noteId: id, blockId, text });
    setComments((prev) => [...prev, data]);
  };

  if (loading || !note || !id) {
    return <Spinner />;
  }

  const userName = user?.name || user?.email || 'User';

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <Link to="/notes" className={styles.back}>
            ← Назад
          </Link>
          <div>
            <h1 className={styles.title}>{note.title}</h1>
            <p className={styles.meta}>
              <Badge>{roleLabel(note.myRole)}</Badge>
              {onlineCount > 0 && (
                <span> · {onlineCount} в документе</span>
              )}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          {canManageAccess(note.myRole) && (
            <Button variant="secondary" onClick={() => setAccessOpen(true)}>
              Доступ
            </Button>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        <NoteEditor
          noteId={id}
          contentJson={note.contentJson as Record<string, unknown>}
          myRole={note.myRole}
          token={token}
          userName={userName}
          onOnlineChange={setOnlineCount}
        />
        <CommentsPanel
          blocks={note.blocks}
          comments={comments}
          myRole={note.myRole}
          onAdd={handleAddComment}
        />
      </div>

      <AccessModal noteId={id} open={accessOpen} onClose={() => setAccessOpen(false)} />
    </>
  );
}
