import { FormEvent, useState } from 'react';
import type { Block, Comment } from '../../types/api';
import { formatDate } from '../../utils/formatDate';
import { canComment } from '../../utils/permissions';
import type { ApiRole } from '../../types/api';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import styles from './CommentsPanel.module.css';

interface CommentsPanelProps {
  blocks: Block[];
  comments: Comment[];
  myRole: ApiRole;
  onAdd: (text: string, blockId?: string) => Promise<void>;
}

export function CommentsPanel({ blocks, comments, myRole, onAdd }: CommentsPanelProps) {
  const [text, setText] = useState('');
  const [blockId, setBlockId] = useState(blocks[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const allowComment = canComment(myRole);

  const grouped = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    const key = c.blockId ?? 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const blockLabel = (id: string) => {
    if (id === 'general') return 'Общие';
    const block = blocks.find((b) => b.id === id);
    return block ? `Блок ${block.order + 1} (${block.type})` : 'Блок';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(text.trim(), blockId || undefined);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>Комментарии</div>
      <div className={styles.list}>
        {comments.length === 0 ? (
          <p className={styles.empty}>Комментариев пока нет</p>
        ) : (
          Object.entries(grouped).map(([id, items]) => (
            <div key={id} className={styles.group}>
              <div className={styles.groupTitle}>{blockLabel(id)}</div>
              {items.map((c) => (
                <article key={c.id} className={styles.comment}>
                  <div className={styles.commentMeta}>
                    {c.author.name || c.author.email} · {formatDate(c.createdAt)}
                  </div>
                  <p style={{ margin: 0 }}>{c.text}</p>
                </article>
              ))}
            </div>
          ))
        )}
      </div>
      {allowComment && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {blocks.length > 0 && (
            <label>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Привязать к блоку
              </span>
              <select
                className={styles.select}
                value={blockId}
                onChange={(e) => setBlockId(e.target.value)}
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    Блок {b.order + 1} ({b.type})
                  </option>
                ))}
              </select>
            </label>
          )}
          <Textarea
            label="Комментарий"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting} fullWidth>
            Отправить
          </Button>
        </form>
      )}
    </aside>
  );
}
