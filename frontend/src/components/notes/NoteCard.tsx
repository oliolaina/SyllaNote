import { Link } from 'react-router-dom';
import type { NoteListItem } from '../../types/api';
import { formatDate } from '../../utils/formatDate';
import { roleLabel } from '../../utils/permissions';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import styles from './NoteCard.module.css';

interface NoteCardProps {
  note: NoteListItem;
  onDelete?: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const isOwner = note.myRole === 'owner';

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{note.title}</h3>
      <div className={styles.meta}>
        {note.myRole && <Badge>{roleLabel(note.myRole)}</Badge>}
        <span> · {formatDate(note.updatedAt)}</span>
      </div>
      <div className={styles.actions}>
        <Link to={`/notes/${note.id}`}>
          <Button variant="secondary" size="small">
            Открыть
          </Button>
        </Link>
        {isOwner && onDelete && (
          <Button variant="danger" size="small" onClick={() => onDelete(note.id)}>
            Удалить
          </Button>
        )}
      </div>
    </article>
  );
}
