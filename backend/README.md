# SyllaNote Backend

REST API и WebSocket-сервер для совместных конспектов.

## Стек

- Node.js, Express, TypeScript
- PostgreSQL, Prisma
- JWT, bcrypt, Zod
- Hocuspocus + Yjs (совместное редактирование)

## Быстрый старт

```bash
# PostgreSQL
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

| Email | Пароль |
|-------|--------|
| owner@syllanote.test | password123 |
| editor@syllanote.test | password123 |
| reader@syllanote.test | password123 |

## API

- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь
- `GET/POST/PATCH/DELETE /api/notes` — конспекты
- `GET/POST/PATCH/DELETE /api/access` — права доступа
- `GET/POST /api/comments` — комментарии

## Docker (полный стек)

```bash
docker compose up --build
docker compose exec backend npm run db:seed
```
