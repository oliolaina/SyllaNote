import { FormEvent, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface CreateNoteModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export function CreateNoteModal({ open, onClose, onCreate }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title.trim());
      setTitle('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Новый конспект" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Создание…' : 'Создать'}
        </Button>
      </form>
    </Modal>
  );
}
