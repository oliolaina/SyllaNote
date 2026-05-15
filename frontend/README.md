# SyllaNote Frontend

SPA на React + Vite для совместных конспектов.

## Запуск (разработка)

```bash
# Backend и PostgreSQL должны быть запущены
cd frontend
cp .env.example .env
npm install
npm run dev
```

Откройте http://localhost:5173

API проксируется на `http://localhost:3000` через Vite.

## Сборка

```bash
npm run build
npm run preview
```

## Docker

Из корня репозитория:

```bash
docker compose up --build
```

Фронтенд: http://localhost:5173

## Тестовый вход

`owner@syllanote.test` / `password123` (после `npm run db:seed` в backend)
