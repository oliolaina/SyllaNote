# Фаззинг API SyllaNote

Упрощённая воспроизводимая альтернатива сценарию из отчёта (Burp Suite Intruder).

## Запуск

1. Поднять API: `npm run dev` в `backend/` или `docker compose up -d backend`.
2. Выполнить seed: `npm run db:seed`.
3. Из каталога `backend`:

```bash
npm run fuzz
```

## Результаты

| Файл | Содержание |
|------|------------|
| `results/latest.md` | Сводка для отчёта (раздел 5.6): статусы, категории, аномалии |
| `фрагменты-для-отчёта.md` | Выдержки кода для вставки в пояснительную записку |
| `results/latest.json` | Полный лог каждого запроса |
| `results/run-<timestamp>.json` | Архивная копия прогона |

Переменные окружения: `FUZZ_BASE_URL` (по умолчанию `http://localhost:3000`).

После прогона в консоль выводятся ASCII-таблицы раздела **5.6** (сводка, HTTP-статусы, категории).

## Что проверяется

- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/notes`, `PUT /api/notes/:id`
- `POST /api/access/invite`, `POST /api/comments`
- RBAC: читатель/комментатор/редактор vs запрещённые операции

Словарь для ручного Burp: `wordlists/strings.txt`.
