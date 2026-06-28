/**
 * Автоматизированное фаззинг-тестирование API (упрощённая альтернатива Burp Intruder).
 * Запуск: npm run fuzz (из каталога backend, API должен быть доступен).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  deepNestedJson,
  invalidEmails,
  invalidJsonBodies,
  invalidNoteIds,
  invalidPasswords,
  longStrings,
  rbacScenarios,
  specialCharPayloads,
  sqlInjectionPayloads,
  xssPayloads,
} from './payloads.js';
import { printSection56ToConsole, writeMarkdownReport } from './report.js';

const BASE_URL = process.env.FUZZ_BASE_URL ?? 'http://localhost:3000';
const RESULTS_DIR = join(import.meta.dirname, 'results');
const SLOW_MS = Number(process.env.FUZZ_SLOW_MS ?? 2000);

type Category = 'validation' | 'injection' | 'rbac' | 'malformed';

interface FuzzCase {
  id: string;
  category: Category;
  method: string;
  path: string;
  description: string;
  headers?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  expectedStatus?: number | number[];
}

interface FuzzResult {
  id: string;
  category: Category;
  method: string;
  path: string;
  description: string;
  status: number;
  durationMs: number;
  responseLength: number;
  expectedStatus?: number | number[];
  passed: boolean;
  anomaly: boolean;
  anomalyReason?: string;
  bodyPreview: string;
}

const tokens: Record<'owner' | 'editor' | 'reader', string> = {
  owner: '',
  editor: '',
  reader: '',
};

const noteIds: Record<'owner' | 'editor' | 'reader', string[]> = {
  owner: [],
  editor: [],
  reader: [],
};

async function request(
  method: string,
  path: string,
  options: {
    token?: string;
    body?: unknown;
    rawBody?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; text: string; durationMs: number }> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.rawBody !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const start = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });
  const text = await res.text();
  const durationMs = Math.round(performance.now() - start);
  return { status: res.status, text, durationMs };
}

async function login(email: string, password: string): Promise<string> {
  const { status, text } = await request('POST', '/api/auth/login', {
    body: { email, password },
  });
  if (status !== 200) {
    throw new Error(`Login failed for ${email}: ${status} ${text}`);
  }
  const data = JSON.parse(text) as { token: string };
  return data.token;
}

async function loadNotes(role: 'owner' | 'editor' | 'reader'): Promise<void> {
  const { status, text } = await request('GET', '/api/notes', { token: tokens[role] });
  if (status !== 200) {
    throw new Error(`GET /api/notes failed for ${role}: ${status}`);
  }
  const notes = JSON.parse(text) as { id: string }[];
  noteIds[role] = notes.map((n) => n.id);
}

function buildRegisterCases(): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;

  for (const email of invalidEmails) {
    cases.push({
      id: `reg-email-${++n}`,
      category: 'validation',
      method: 'POST',
      path: '/api/auth/register',
      description: `register: некорректный email = ${String(email).slice(0, 40)}`,
      body: { email, password: 'password123', name: 'Fuzz' },
      expectedStatus: 400,
    });
  }

  for (const password of invalidPasswords) {
    cases.push({
      id: `reg-pass-${++n}`,
      category: 'validation',
      method: 'POST',
      path: '/api/auth/register',
      description: `register: некорректный password`,
      body: { email: `fuzz-${n}@syllanote.test`, password, name: 'Fuzz' },
      expectedStatus: 400,
    });
  }

  for (const payload of [...sqlInjectionPayloads, ...xssPayloads, ...specialCharPayloads]) {
    cases.push({
      id: `reg-inject-name-${++n}`,
      category: 'injection',
      method: 'POST',
      path: '/api/auth/register',
      description: `register: injection/XSS в name`,
      body: {
        email: `fuzz-inj-${n}@syllanote.test`,
        password: 'password123',
        name: payload,
      },
      expectedStatus: [400, 201],
    });
  }

  cases.push({
    id: 'reg-missing-fields',
    category: 'validation',
    method: 'POST',
    path: '/api/auth/register',
    description: 'register: пустое тело',
    body: {},
    expectedStatus: 400,
  });

  for (let i = 0; i < 40; i++) {
    cases.push({
      id: `reg-random-${i + 1}`,
      category: 'validation',
      method: 'POST',
      path: '/api/auth/register',
      description: `register: случайный набор полей #${i + 1}`,
      body: {
        email: i % 3 === 0 ? invalidEmails[i % invalidEmails.length] : `fuzz${i}@syllanote.test`,
        password: i % 5 === 0 ? invalidPasswords[i % invalidPasswords.length] : 'password123',
        name: specialCharPayloads[i % specialCharPayloads.length],
      },
      expectedStatus: [400, 201, 409],
    });
  }

  return cases;
}

function buildCreateNoteCases(): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;

  for (const title of ['', ' ', ...specialCharPayloads, longStrings.title300, longStrings.title10k]) {
    cases.push({
      id: `note-title-${++n}`,
      category: title.length > 200 ? 'validation' : 'injection',
      method: 'POST',
      path: '/api/notes',
      description: `create note: title (${title.length} chars)`,
      body: { title },
      expectedStatus: 400,
    });
  }

  for (const payload of [...xssPayloads, ...sqlInjectionPayloads]) {
    cases.push({
      id: `note-xss-title-${++n}`,
      category: 'injection',
      method: 'POST',
      path: '/api/notes',
      description: 'create note: XSS/SQL в title',
      body: { title: payload },
      expectedStatus: [400, 201],
    });
  }

  cases.push({
    id: 'note-wrong-type-title',
    category: 'validation',
    method: 'POST',
    path: '/api/notes',
    description: 'create note: title — число вместо строки',
    body: { title: 12345 },
    expectedStatus: 400,
  });

  cases.push({
    id: 'note-deep-json',
    category: 'validation',
    method: 'POST',
    path: '/api/notes',
    description: 'create note: глубокий contentJson',
    body: { title: 'Deep JSON', contentJson: JSON.parse(deepNestedJson(80)) },
    expectedStatus: [201, 400],
  });

  return cases;
}

function buildUpdateNoteCases(validNoteId: string): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;

  for (const id of invalidNoteIds) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    cases.push({
      id: `patch-id-${++n}`,
      category: 'injection',
      method: 'PATCH',
      path: `/api/notes/${encodeURIComponent(id)}`,
      description: `update note: некорректный id = ${id}`,
      body: { title: 'Fuzz' },
      expectedStatus: isUuid ? [400, 403, 404] : 400,
    });
  }

  for (const payload of [...xssPayloads, ...sqlInjectionPayloads]) {
    cases.push({
      id: `patch-title-inj-${++n}`,
      category: 'injection',
      method: 'PATCH',
      path: `/api/notes/${validNoteId}`,
      description: 'update note: injection в title',
      body: { title: payload },
      expectedStatus: [200, 400],
    });
  }

  cases.push({
    id: 'patch-empty-body',
    category: 'validation',
    method: 'PATCH',
    path: `/api/notes/${validNoteId}`,
    description: 'update note: пустое тело (нет полей)',
    body: {},
    expectedStatus: 400,
  });

  cases.push({
    id: 'patch-huge-title',
    category: 'validation',
    method: 'PATCH',
    path: `/api/notes/${validNoteId}`,
    description: 'update note: заголовок > 200 символов',
    body: { title: longStrings.title10k },
    expectedStatus: 400,
  });

  return cases;
}

function buildMalformedCases(validNoteId: string): FuzzCase[] {
  return invalidJsonBodies.map((raw, i) => ({
    id: `malformed-json-${i + 1}`,
    category: 'malformed' as const,
    method: 'POST',
    path: '/api/auth/register',
    description: `malformed JSON body #${i + 1}`,
    rawBody: raw,
    expectedStatus: 400,
  })).concat([
    {
      id: 'malformed-patch-json',
      category: 'malformed',
      method: 'PATCH',
      path: `/api/notes/${validNoteId}`,
      description: 'malformed JSON на PATCH /notes',
      rawBody: '{ "title": "broken", ',
      expectedStatus: 400,
    },
  ]);
}

function buildLoginCases(): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;
  for (const email of invalidEmails) {
    cases.push({
      id: `login-email-${++n}`,
      category: 'validation',
      method: 'POST',
      path: '/api/auth/login',
      description: 'login: некорректный email',
      body: { email, password: 'password123' },
      expectedStatus: 400,
    });
  }
  for (const payload of [...sqlInjectionPayloads, ...xssPayloads]) {
    cases.push({
      id: `login-inject-${++n}`,
      category: 'injection',
      method: 'POST',
      path: '/api/auth/login',
      description: 'login: injection в password',
      body: { email: 'owner@syllanote.test', password: payload },
      expectedStatus: [400, 401],
    });
  }
  cases.push({
    id: 'login-empty',
    category: 'validation',
    method: 'POST',
    path: '/api/auth/login',
    description: 'login: пустое тело',
    body: {},
    expectedStatus: 400,
  });
  return cases;
}

function buildInviteCases(validNoteId: string): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;
  for (const email of invalidEmails) {
    cases.push({
      id: `invite-email-${++n}`,
      category: 'validation',
      method: 'POST',
      path: '/api/access/invite',
      description: 'invite: некорректный email',
      body: { noteId: validNoteId, email, role: 'reader' },
      expectedStatus: 400,
    });
  }
  for (const role of ['owner', 'admin', '', 123, ...sqlInjectionPayloads]) {
    cases.push({
      id: `invite-role-${++n}`,
      category: 'validation',
      method: 'POST',
      path: '/api/access/invite',
      description: `invite: некорректная роль = ${String(role).slice(0, 30)}`,
      body: { noteId: validNoteId, email: 'fuzz@syllanote.test', role },
      expectedStatus: 400,
    });
  }
  for (const noteId of invalidNoteIds) {
    cases.push({
      id: `invite-noteid-${++n}`,
      category: 'injection',
      method: 'POST',
      path: '/api/access/invite',
      description: `invite: noteId = ${noteId}`,
      body: { noteId, email: 'fuzz@syllanote.test', role: 'reader' },
      expectedStatus: 400,
    });
  }
  return cases;
}

function buildCommentCases(validNoteId: string, blockId: string): FuzzCase[] {
  const cases: FuzzCase[] = [];
  let n = 0;
  for (const text of ['', ...xssPayloads, ...sqlInjectionPayloads, longStrings.password1k]) {
    cases.push({
      id: `comment-text-${++n}`,
      category: text.length > 5000 ? 'validation' : 'injection',
      method: 'POST',
      path: '/api/comments',
      description: `comment: text (${text.length} chars)`,
      body: { noteId: validNoteId, blockId, text },
      expectedStatus: text.length >= 1 && text.length <= 5000 ? [201, 400] : 400,
    });
  }
  return cases;
}

function buildRbacCases(): FuzzCase[] {
  const cases: FuzzCase[] = [];

  for (const scenario of rbacScenarios) {
    const role = scenario.role;
    const noteId =
      noteIds[role][scenario.noteIndex ?? 0] ?? noteIds[role][0];
    if (!noteId) continue;

    let body = scenario.body;
    if (scenario.dynamicNoteId && body && typeof body === 'object') {
      body = { ...body, noteId };
    }

    cases.push({
      id: scenario.id,
      category: 'rbac',
      method: scenario.method,
      path:
        typeof scenario.path === 'function'
          ? scenario.path(noteId)
          : scenario.path,
      description: scenario.description,
      body,
      expectedStatus: scenario.expectedStatus,
    });
  }

  return cases;
}

function statusMatches(actual: number, expected?: number | number[]): boolean {
  if (expected === undefined) return actual < 500;
  const list = Array.isArray(expected) ? expected : [expected];
  return list.includes(actual);
}

async function runCase(
  fuzzCase: FuzzCase,
  token?: string,
): Promise<FuzzResult> {
  const { status, text, durationMs } = await request(fuzzCase.method, fuzzCase.path, {
    token,
    body: fuzzCase.body,
    rawBody: fuzzCase.rawBody,
    headers: fuzzCase.headers,
  });

  const passed = statusMatches(status, fuzzCase.expectedStatus);
  let anomaly = false;
  let anomalyReason: string | undefined;

  if (status >= 500) {
    anomaly = true;
    anomalyReason = `HTTP ${status} (внутренняя ошибка сервера)`;
  } else if (durationMs >= SLOW_MS) {
    anomaly = true;
    anomalyReason = `Медленный ответ: ${durationMs} ms`;
  } else if (fuzzCase.category === 'rbac' && status >= 200 && status < 300) {
    anomaly = true;
    anomalyReason = 'RBAC: операция разрешена, ожидался отказ (403)';
  }

  return {
    id: fuzzCase.id,
    category: fuzzCase.category,
    method: fuzzCase.method,
    path: fuzzCase.path,
    description: fuzzCase.description,
    status,
    durationMs,
    responseLength: text.length,
    expectedStatus: fuzzCase.expectedStatus,
    passed,
    anomaly,
    anomalyReason,
    bodyPreview: text.slice(0, 200),
  };
}

async function main(): Promise<void> {
  console.log(`Fuzz target: ${BASE_URL}`);

  const health = await request('GET', '/health');
  if (health.status !== 200) {
    console.error('API недоступен. Запустите backend (npm run dev или docker compose up).');
    process.exit(1);
  }

  tokens.owner = await login('owner@syllanote.test', 'password123');
  tokens.editor = await login('editor@syllanote.test', 'password123');
  tokens.reader = await login('reader@syllanote.test', 'password123');

  await Promise.all([
    loadNotes('owner'),
    loadNotes('editor'),
    loadNotes('reader'),
  ]);

  const validNoteId = noteIds.owner[0];
  if (!validNoteId) {
    throw new Error('Нет конспектов у owner — выполните npm run db:seed');
  }

  const noteDetailRes = await request('GET', `/api/notes/${validNoteId}`, {
    token: tokens.owner,
  });
  const noteDetail = JSON.parse(noteDetailRes.text) as {
    blocks?: { id: string }[];
  };
  const blockId = noteDetail.blocks?.[0]?.id ?? validNoteId;

  const unauthCases: FuzzCase[] = [
    {
      id: 'notes-no-token',
      category: 'validation',
      method: 'GET',
      path: '/api/notes',
      description: 'GET /notes без JWT',
      expectedStatus: 401,
    },
    {
      id: 'update-no-token',
      category: 'validation',
      method: 'PATCH',
      path: `/api/notes/${validNoteId}`,
      description: 'PATCH /notes без JWT',
      body: { title: 'Hack' },
      expectedStatus: 401,
    },
  ];

  const allCases: { case: FuzzCase; token?: string }[] = [
    ...unauthCases.map((c) => ({ case: c })),
    ...buildRegisterCases().map((c) => ({ case: c })),
    ...buildLoginCases().map((c) => ({ case: c })),
    ...buildCreateNoteCases().map((c) => ({ case: c, token: tokens.owner })),
    ...buildUpdateNoteCases(validNoteId).map((c) => ({ case: c, token: tokens.owner })),
    ...buildInviteCases(validNoteId).map((c) => ({ case: c, token: tokens.owner })),
    ...buildCommentCases(validNoteId, blockId).map((c) => ({
      case: c,
      token: tokens.editor,
    })),
    ...buildMalformedCases(validNoteId).map((c) => ({ case: c })),
    ...buildRbacCases().map((c) => {
      const scenario = rbacScenarios.find((s) => s.id === c.id);
      const role = scenario?.role ?? 'reader';
      return { case: c, token: tokens[role] };
    }),
  ];

  console.log(`Отправка ${allCases.length} запросов…`);

  const results: FuzzResult[] = [];
  for (const { case: fuzzCase, token } of allCases) {
    results.push(await runCase(fuzzCase, token));
  }

  const unexpected = results.filter((r) => !r.passed && !r.anomaly);

  const summary = {
    runAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    unexpectedCount: unexpected.length,
    anomalies: results.filter((r) => r.anomaly),
    byStatus: Object.groupBy(results, (r) => String(r.status)),
    byCategory: Object.groupBy(results, (r) => r.category),
  };

  await mkdir(RESULTS_DIR, { recursive: true });
  const jsonPath = join(RESULTS_DIR, 'latest.json');
  const mdPath = join(RESULTS_DIR, 'latest.md');
  const stamped = join(RESULTS_DIR, `run-${Date.now()}.json`);

  await writeFile(jsonPath, JSON.stringify({ summary, results }, null, 2), 'utf8');
  await writeFile(stamped, JSON.stringify({ summary, results }, null, 2), 'utf8');
  await writeFile(mdPath, writeMarkdownReport(summary, results), 'utf8');

  const anomalyCount = summary.anomalies.length;
  console.log(`\nГотово: ${results.length} запросов, критичных аномалий: ${anomalyCount}`);
  printSection56ToConsole(summary, results);
  console.log(`Отчёт: ${mdPath}`);
  console.log(`JSON:  ${jsonPath}`);

  if (anomalyCount > 0) {
    console.log('\nАномалии:');
    for (const a of summary.anomalies.slice(0, 15)) {
      console.log(`  - [${a.id}] ${a.status} ${a.anomalyReason}`);
    }
    if (anomalyCount > 15) console.log(`  … и ещё ${anomalyCount - 15}`);
  }

  process.exit(anomalyCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
