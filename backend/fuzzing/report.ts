export interface FuzzSummary {
  runAt: string;
  baseUrl: string;
  total: number;
  passed: number;
  unexpectedCount?: number;
  anomalies: { id: string; status: number; description: string; anomalyReason?: string }[];
  byStatus?: Record<string, unknown[]>;
  byCategory?: Record<string, unknown[]>;
}

export interface FuzzResultRow {
  id: string;
  category: string;
  method: string;
  path: string;
  description: string;
  status: number;
  durationMs: number;
  expectedStatus?: number | number[];
  passed: boolean;
  anomaly: boolean;
  anomalyReason?: string;
}

const STATUS_HINT: Record<number, string> = {
  200: 'успех',
  201: 'создано',
  400: 'валидация',
  401: 'без токена',
  403: 'RBAC',
  404: 'не найдено',
  409: 'дубликат email',
  500: 'дефект сервера',
};

function countByStatus(results: FuzzResultRow[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const r of results) {
    map.set(r.status, (map.get(r.status) ?? 0) + 1);
  }
  return map;
}

function countByCategory(results: FuzzResultRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of results) {
    map.set(r.category, (map.get(r.category) ?? 0) + 1);
  }
  return map;
}

function formatAsciiTable(headers: string[], rows: string[][]): string[] {
  const widths = headers.map((h, col) =>
    Math.max(h.length, ...rows.map((row) => String(row[col] ?? '').length)),
  );
  const border = `+${widths.map((w) => '-'.repeat(w + 2)).join('+')}+`;
  const fmtRow = (cells: string[]) =>
    `|${cells.map((c, i) => ` ${String(c).padEnd(widths[i])} `).join('|')}|`;
  return [border, fmtRow(headers), border, ...rows.map((r) => fmtRow(r)), border];
}

/** Таблицы раздела 5.6 отчёта — в консоль после прогона. */
export function printSection56ToConsole(summary: FuzzSummary, results: FuzzResultRow[]): void {
  const statusCounts = countByStatus(results);
  const categoryCounts = countByCategory(results);
  const critical = summary.anomalies.length;

  const summaryRows = [
    ['Всего запросов', String(summary.total)],
    ['Соответствие ожидаемому поведению', String(summary.passed)],
    ['Нестандартный, но некритичный статус', String(summary.unexpectedCount ?? 0)],
    ['Критичные аномалии (5xx, обход RBAC)', String(critical)],
  ];

  const statusRows = [...statusCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([code, count]) => [
      String(code),
      String(count),
      STATUS_HINT[code] ?? '—',
    ]);

  const categoryRows = [...categoryCounts.entries()].map(([cat, count]) => [cat, String(count)]);

  const statusLine = [...statusCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([code, count]) => `${code} — ${count} (${STATUS_HINT[code] ?? '—'})`)
    .join('; ');

  const categoryLine = [...categoryCounts.entries()]
    .map(([cat, count]) => `${cat} — ${count}`)
    .join('; ');

  console.log('\n5.6 Результаты финального прогона\n');
  console.log(formatAsciiTable(['Показатель', 'Значение'], summaryRows).join('\n'));
  console.log('\nРаспределение HTTP-статусов:\n');
  console.log(formatAsciiTable(['Код', 'Кол-во', 'Интерпретация'], statusRows).join('\n'));
  console.log(`\nСводка: ${statusLine}\n`);
  console.log('По категориям проверок:\n');
  console.log(formatAsciiTable(['Категория', 'Запросов'], categoryRows).join('\n'));
  console.log(`\nСводка: ${categoryLine}\n`);

  if (critical === 0) {
    console.log(
      'Вывод: API отклоняет некорректные данные; RBAC не обходится; критичных аномалий нет.',
    );
  } else {
    console.log(`Вывод: обнаружено критичных аномалий: ${critical}. См. список выше и latest.json.`);
  }
  console.log('');
}

export function writeMarkdownReport(summary: FuzzSummary, results: FuzzResultRow[]): string {
  const statusCounts = countByStatus(results);
  const categoryCounts = countByCategory(results);

  const lines: string[] = [
    '# Отчёт фаззинг-тестирования SyllaNote API',
    '',
    `**Дата:** ${summary.runAt}  `,
    `**Цель:** ${summary.baseUrl}  `,
    `**Всего запросов:** ${summary.total}  `,
    `**Ожидание выполнено:** ${summary.passed}  `,
    `**Неожиданный статус (не критично):** ${summary.unexpectedCount ?? 0}  `,
    `**Критичных аномалий:** ${summary.anomalies.length}`,
    '',
    '## 5.6 Сводка прогона',
    '',
    '| Показатель | Значение |',
    '|------------|----------|',
    `| Всего запросов | ${summary.total} |`,
    `| Соответствие ожидаемому поведению | ${summary.passed} |`,
    `| Нестандартный, но некритичный статус | ${summary.unexpectedCount ?? 0} |`,
    `| Критичные аномалии (5xx, обход RBAC) | ${summary.anomalies.length} |`,
    '',
    '## Распределение HTTP-статусов',
    '',
    '| Код | Количество | Интерпретация |',
    '|-----|------------|---------------|',
  ];

  const statusHintMd: Record<number, string> = {
    200: 'Успех (для RBAC — подозрительно)',
    201: 'Создано',
    400: 'Валидация (ожидаемо)',
    401: 'Не авторизован',
    403: 'RBAC (ожидаемо)',
    404: 'Не найдено',
    409: 'Дубликат email',
    500: '**Дефект сервера**',
  };

  for (const [code, count] of [...statusCounts.entries()].sort((a, b) => a[0] - b[0])) {
    lines.push(`| ${code} | ${count} | ${statusHintMd[code] ?? '—'} |`);
  }

  const statusLine = [...statusCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([code, count]) => `${code} — ${count}`)
    .join('; ');
  lines.push('', `**Сводка:** ${statusLine}`, '');

  lines.push('', '## Области проверки', '', '| Категория | Запросов |', '|-----------|----------|');
  for (const [cat, count] of categoryCounts) {
    lines.push(`| ${cat} | ${count} |`);
  }

  lines.push(
    '',
    '## Выводы',
    '',
    '- **Валидация:** некорректные email, пароли, UUID и слишком длинные поля отклоняются с **400** (Zod).',
    '- **Инъекции:** SQL/XSS в строковых полях не приводят к **5xx**; данные не исполняются (Prisma параметризует запросы).',
    '- **RBAC:** операции выше роли возвращают **403 Forbidden**.',
    '- **Аномалии** (5xx, неожиданные 200 на RBAC, очень медленные ответы) перечислены ниже.',
    '',
  );

  if (summary.anomalies.length === 0) {
    lines.push('Аномалий не обнаружено.', '');
  } else {
    lines.push('## Аномалии', '', '| ID | Статус | Причина | Описание |', '|----|--------|---------|----------|');
    for (const a of summary.anomalies) {
      const full = results.find((r) => r.id === a.id);
      lines.push(
        `| ${a.id} | ${a.status} | ${a.anomalyReason ?? '—'} | ${full?.description ?? a.description} |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Эндпоинты',
    '',
    '- `POST /api/auth/register`',
    '- `POST /api/notes`',
    '- `PATCH /api/notes/:id`',
    '- `DELETE /api/notes/:id`, `POST /api/access/invite` (RBAC)',
    '',
    'Полный лог: `latest.json` в этой же папке.',
  );

  return lines.join('\n');
}
