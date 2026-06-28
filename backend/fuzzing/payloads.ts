/** Наборы payload для имитации Burp Intruder (Sniper / Cluster bomb). */

export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "1; DROP TABLE users--",
  "' UNION SELECT NULL--",
  "admin'--",
];

export const xssPayloads = [
  "<script>alert('xss')</script>",
  '"><img src=x onerror=alert(1)>',
  "javascript:alert(1)",
];

export const specialCharPayloads = [
  '',
  ' ',
  '\x00',
  '\n\r\t',
  '{}[]',
  '../../etc/passwd',
  '%00',
  '🙂🔥',
  String.fromCharCode(0x202e) + 'evil',
];

export const longStrings = {
  password1k: 'a'.repeat(1000),
  title300: 'T'.repeat(300),
  title10k: 'X'.repeat(10_000),
};

export const invalidEmails = [
  'not-an-email',
  '@missing-local.com',
  'user@',
  'user@.com',
  12345 as unknown as string,
  '',
  'a@b',
  `${'x'.repeat(200)}@test.com`,
];

export const invalidPasswords = [
  '',
  'short',
  '1234567',
  longStrings.password1k,
  null as unknown as string,
  12345678 as unknown as string,
];

export const invalidNoteIds = [
  'not-a-uuid',
  '00000000-0000-0000-0000-000000000000',
  '-1',
  '1',
  "' OR '1'='1",
  '../notes',
  '',
];

export const invalidJsonBodies = [
  '{ broken json',
  '{"title":}',
  '{"title": "ok", "extra": '.repeat(5) + '}',
];

/** Глубоко вложенный JSON (проверка лимита парсера). */
export function deepNestedJson(depth: number): string {
  let inner = '"leaf":true';
  for (let i = 0; i < depth; i++) {
    inner = `"l${i}":{${inner}}`;
  }
  return `{${inner}}`;
}

export const rbacScenarios = [
  {
    id: 'reader-update-note',
    role: 'reader' as const,
    method: 'PATCH' as const,
    path: (noteId: string) => `/api/notes/${noteId}`,
    body: { title: 'Попытка редактирования' },
    expectedStatus: 403,
    description: 'Читатель пытается изменить конспект',
  },
  {
    id: 'reader-delete-note',
    role: 'reader' as const,
    method: 'DELETE' as const,
    path: (noteId: string) => `/api/notes/${noteId}`,
    expectedStatus: 403,
    description: 'Читатель пытается удалить конспект',
  },
  {
    id: 'commentator-delete-note',
    role: 'editor' as const,
    noteIndex: 1,
    method: 'DELETE' as const,
    path: (noteId: string) => `/api/notes/${noteId}`,
    expectedStatus: 403,
    description: 'Комментатор (editor на 2-м конспекте) пытается удалить конспект',
  },
  {
    id: 'editor-delete-note',
    role: 'editor' as const,
    noteIndex: 0,
    method: 'DELETE' as const,
    path: (noteId: string) => `/api/notes/${noteId}`,
    expectedStatus: 403,
    description: 'Редактор пытается удалить чужой конспект (нет права delete)',
  },
  {
    id: 'reader-invite',
    role: 'reader' as const,
    method: 'POST' as const,
    path: () => '/api/access/invite',
    body: { noteId: '', email: 'new@syllanote.test', role: 'reader' },
    expectedStatus: 403,
    description: 'Читатель пытается пригласить пользователя',
    dynamicNoteId: true,
  },
  {
    id: 'commentator-invite',
    role: 'editor' as const,
    noteIndex: 1,
    method: 'POST' as const,
    path: () => '/api/access/invite',
    body: { noteId: '', email: 'new@syllanote.test', role: 'editor' },
    expectedStatus: 403,
    description: 'Комментатор пытается пригласить пользователя',
    dynamicNoteId: true,
  },
];
