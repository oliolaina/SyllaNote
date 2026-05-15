import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { CreateNoteModal } from '../components/notes/CreateNoteModal';
import { NoteCard } from '../components/notes/NoteCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { notesService } from '../services/notes.service';
import type { NoteListItem } from '../types/api';
import styles from './NotesPage.module.css';

export function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notesService.list();
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleCreate = async (title: string) => {
    const { data } = await notesService.create({ title });
    navigate(`/notes/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить конспект?')) return;
    await notesService.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <Header />
      <div className={styles.toolbar}>
        <h1>Мои конспекты</h1>
        <Button onClick={() => setModalOpen(true)}>Создать</Button>
      </div>
      {loading ? (
        <Spinner />
      ) : notes.length === 0 ? (
        <p className={styles.empty}>Пока нет конспектов. Создайте первый.</p>
      ) : (
        <div className={styles.grid}>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
      <CreateNoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
