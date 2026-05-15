import { FormEvent, useCallback, useEffect, useState } from 'react';
import { accessService } from '../../services/access.service';
import type { AccessMember, AssignableRole } from '../../types/api';
import { roleLabel } from '../../utils/permissions';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import styles from './AccessModal.module.css';

interface AccessModalProps {
  noteId: string;
  open: boolean;
  onClose: () => void;
}

const ROLES: AssignableRole[] = ['editor', 'commentator', 'reader'];

export function AccessModal({ noteId, open, onClose }: AccessModalProps) {
  const [members, setMembers] = useState<AccessMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableRole>('editor');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await accessService.list(noteId);
    setMembers(data);
  }, [noteId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await accessService.invite({ noteId, email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Не удалось пригласить';
      setError(msg);
    }
  };

  const handleRoleChange = async (userId: string, role: AssignableRole) => {
    await accessService.updateRole(noteId, userId, role);
    await load();
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Удалить участника?')) return;
    await accessService.remove(noteId, userId);
    await load();
  };

  return (
    <Modal title="Управление доступом" open={open} onClose={onClose} wide>
      <div className={styles.list}>
        {members.map((m) => (
          <div key={m.userId} className={styles.row}>
            <span className={styles.email}>{m.email}</span>
            {m.role === 'owner' ? (
              <span>{roleLabel(m.role)}</span>
            ) : (
              <>
                <select
                  className={styles.select}
                  value={m.role}
                  onChange={(e) =>
                    handleRoleChange(m.userId, e.target.value as AssignableRole)
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
                <Button variant="danger" size="small" onClick={() => handleRemove(m.userId)}>
                  Удалить
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <form className={styles.invite} onSubmit={handleInvite}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Пригласить</h3>
        {error && <p style={{ color: 'var(--color-danger)', margin: 0 }}>{error}</p>}
        <div className={styles.inviteRow}>
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <label className={styles.select}>
            <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: 4 }}>Роль</span>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AssignableRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" style={{ alignSelf: 'flex-end' }}>
            Пригласить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
