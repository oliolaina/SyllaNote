# SyllaNote

Веб-сервис для создания интерактивных учебных конспектов с совместным доступом. Пользователи могут редактировать документы в реальном времени, приглашать участников с разными ролями (владелец, редактор, комментатор, читатель) и оставлять комментарии к блокам конспекта.

## Структура репозитория

```
SyllaNote/
  backend/     — REST API, WebSocket (Hocuspocus), PostgreSQL
  frontend/    — SPA (React + Vite)
  docker-compose.yml
```

Подробнее по модулям: [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md).

## Стек технологий


| Слой                          | Технологии                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| **Frontend**                  | React 18, TypeScript, Vite, React Router, Zustand, Axios, Lexical, Yjs, y-websocket |
| **Backend**                   | Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Zod                  |
| **Совместное редактирование** | Hocuspocus, Yjs (CRDT), WebSocket                                                   |
| **Инфраструктура**            | Docker, Docker Compose, nginx                                                       |


## Требования

- Node.js 20+
- npm
- Docker и Docker Compose (для PostgreSQL и полного развёртывания)

## Запуск для разработки

### 1. База данных

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

- REST API: [http://localhost:3000](http://localhost:3000)  
- WebSocket: ws://localhost:8080

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Приложение: [http://localhost:5173](http://localhost:5173) (запросы `/api` проксируются на backend через Vite).

## Запуск через Docker

Из корня проекта:

```bash
docker compose up --build
docker compose exec backend npm run db:seed
```

Если при сборке `npm ci` падает с `ECONNRESET` — это обрыв сети при скачивании пакетов. Повторите `docker compose build` (в Dockerfile есть повторные попытки). При нестабильном интернете сначала выполните `npm ci` локально в `backend/` и `frontend/`, затем собирайте снова.

- Frontend: [http://localhost:5173](http://localhost:5173)  
- Backend API: [http://localhost:3000](http://localhost:3000)

## Тестовые учётные записи

После `npm run db:seed` в каталоге `backend`:


| Email | Пароль |
|-------|--------|
| owner@syllanote.test | password123 |
| editor@syllanote.test | password123 |
| reader@syllanote.test | password123 |

Роль задаётся **отдельно для каждого конспекта**. В seed оба конспекта с пометкой «групповой доступ» видны всем троим в списке «Мои конспекты»:

| Конспект | owner | editor | reader |
|----------|-------|--------|--------|
| Лекция по архитектуре ПО (групповой доступ) | владелец | редактор | читатель |
| Совместный конспект группы (групповой доступ) | владелец | комментатор | читатель |

У `editor` на первом конспекте роль «редактор», на втором — «комментатор».


## Основные возможности

- Регистрация и вход (JWT)
- CRUD конспектов с проверкой прав на сервере
- Совместное редактирование (owner, editor) через Lexical + Yjs
- Приглашение пользователей по email и назначение ролей
- Комментарии к блокам конспекта

