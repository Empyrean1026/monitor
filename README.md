# E-commerce Analytics & Real-time Monitoring Dashboard

面向电商运营人员的数据分析后台。当前版本仅完成工程初始化：前端使用 Vue 3，后端使用 Express，PostgreSQL 通过 Docker Compose 启动。

## Prerequisites

- Node.js 20+
- Docker Desktop（本地数据库）

## Start the database

```bash
docker compose up -d postgres
```

PostgreSQL will listen on `localhost:5432`. The initial development credentials are defined in `docker-compose.yml`; change them before any shared or production use.

## Configure environment variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Set a strong development `JWT_SECRET` in `server/.env` before starting the API.

## Start the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Start the backend

```bash
cd server
npm install
npm run dev
```

The API runs at `http://localhost:3000`; its health check is available at `GET /api/health`.

## Initialize the database

Start PostgreSQL first, then create the database schema and load the deterministic development dataset:

```bash
cd server
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run prisma:seed
```

The seed is safe to rerun in development: it clears and recreates its own records. It produces one administrator (`admin@example.com` / `Admin123!`), 1,000 customers, 8 categories, 100 products, 5,000 orders and their line items, plus 180 daily traffic records. Change the administrator password before any shared deployment.

## Verify production builds

```bash
cd client && npm run build
cd ../server && npm run build
```

## Run tests

Backend integration tests use the seeded development database for read-only API
checks, so start PostgreSQL and run the database initialization steps first.

```bash
cd server
npm test

cd ../client
npm test
```

For interactive development, use `npm run test:watch` in either package.

## Project layout

- `client/`: Vue UI, routing, state, shared components, and charts.
- `server/`: Express API, validation, services, middleware, and WebSocket modules.
- `prisma/`: Prisma schema and later database migrations and seed data.
- `docker-compose.yml`: local PostgreSQL service.
