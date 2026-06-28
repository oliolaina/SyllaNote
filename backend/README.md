# SyllaNote Backend

REST API и WebSocket-сервер для совместных конспектов.

## Стек

- Node.js, Express, TypeScript
- PostgreSQL, Prisma
- JWT, bcrypt, Zod
- Hocuspocus + Yjs (совместное редактирование)

## Быстрый старт

```bash
# из корня репозитория: cp .env.example .env (см. README в корне)
docker compose up -d postgres

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API: `http://localhost:3000`  
WebSocket: `ws://localhost:8080` (документ = UUID конспекта, `?token=<jwt>`)

## Тестовые пользователи (seed)


| Email                                                 | Пароль      |
| ----------------------------------------------------- | ----------- |
| [owner@syllanote.test](mailto:owner@syllanote.test)   | password123 |
| [editor@syllanote.test](mailto:editor@syllanote.test) | password123 |
| [reader@syllanote.test](mailto:reader@syllanote.test) | password123 |


Роли — **на каждый конспект отдельно**. Оба seed-конспекта с пометкой «групповой доступ» отображаются у всех трёх пользователей; у `editor` на первом конспекте роль `editor`, на втором — `commentator`.

## API

- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь
- `GET/POST/PATCH/DELETE /api/notes` — конспекты
- `GET/POST/PATCH/DELETE /api/access` — права доступа
- `GET/POST /api/comments` — комментарии

## Фаззинг-тестирование API

Автоматизированный сценарий (аналог Burp Intruder) в каталоге `fuzzing/`:

```bash
# API должен работать (npm run dev или docker compose up)
cd backend
npm run fuzz
```

Результаты:

- `fuzzing/results/latest.md` — краткий отчёт для отчёта/презентации
- `fuzzing/results/latest.json` — полный лог всех запросов

Переменные: `FUZZ_BASE_URL` (по умолчанию `http://localhost:3000`), `FUZZ_SLOW_MS` (порог «медленного» ответа, мс).

## Docker (полный стек)

Из корня репозитория:

```bash
cp .env.example .env
# задайте POSTGRES_PASSWORD и JWT_SECRET в .env
docker compose up --build
docker compose exec backend npm run db:seed
```

Если seed из контейнера недоступен, с хоста (подставьте пароль из корневого `.env`):

```bash
cd backend
DATABASE_URL=postgresql://sylla:<POSTGRES_PASSWORD>@localhost:5432/syllanote npm run db:seed
```

