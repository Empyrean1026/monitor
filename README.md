# E-commerce Analytics & Real-time Monitoring Dashboard

一个面向电商运营场景的全栈数据分析与实时监控平台。项目将订单、商品、客户和流量数据集中到可筛选的管理后台，提供销售分析、商品与用户洞察、订单查询、CSV 导出和 WebSocket 实时动态。

> **Live demo:** `https://<your-demo-domain-or-ip>`
> 当前部署示例请按实际服务器地址填写；生产环境建议绑定域名并启用 HTTPS。

## Screenshots

> 在下方替换为仓库内截图或图片托管地址，例如 `docs/screenshots/dashboard.png`。

| Dashboard | Real-time monitor |
| --- | --- |
| ![Dashboard screenshot placeholder](docs/screenshots/dashboard-placeholder.png) | ![Realtime monitor screenshot placeholder](docs/screenshots/realtime-placeholder.png) |

## Core Features

- 基于 JWT 的后台管理员登录、会话恢复和受保护路由。
- 支持日期、地区、分类、会员等级等维度的分析筛选。
- Dashboard 汇总指标、销售趋势、分类占比、热销商品及最近订单。
- 销售、商品、用户、订单分析页面，提供分页、排序、URL 查询条件同步与 CSV 导出。
- D3.js 可复用图表：双轴销售趋势、分类环形图、商品横向柱状图等。
- PostgreSQL + Prisma 数据模型与可重复执行的业务化演示数据 Seed。
- Express REST API，含 Zod 参数校验、统一响应格式、错误处理、请求日志和基础缓存预留。
- WebSocket 实时连接：订单模拟写入、订单/指标/在线人数推送、心跳检测与自动重连。
- 前后端 Vitest 测试，覆盖关键 API、认证、参数校验、核心状态与 WebSocket 消息。

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3, TypeScript, Vite, Vue Router, Pinia |
| UI & visualization | Element Plus, D3.js, Day.js |
| HTTP client | Axios |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Authentication | JWT, bcrypt |
| Database | PostgreSQL 17, Prisma ORM |
| Realtime | `ws` WebSocket server |
| Testing | Vitest, Supertest, Vue Test Utils, JSDOM |
| Tooling | ESLint, Prettier, Docker Compose, PM2, Nginx |

## System Architecture

```text
Browser (Vue 3 + D3)
  │  REST /api + WebSocket /ws
  ▼
Nginx (production reverse proxy)
  │
  ▼
Express API + WebSocket Server (PM2)
  │      │
  │      └── JWT / Zod / service layer / Prisma
  ▼
PostgreSQL
```

前端使用 Axios 访问 REST API，并通过 `useWebSocket` 管理实时连接与指数退避重连。后端按 Route → Controller → Service 分层，Prisma 负责 PostgreSQL 访问；Nginx 在生产环境中负责静态文件、API 反向代理和 WebSocket Upgrade。

## Repository Structure

```text
analytics-dashboard/
├── client/
│   ├── src/
│   │   ├── api/             # Axios API modules
│   │   ├── components/      # layout, dashboard and D3 chart components
│   │   ├── composables/     # reusable hooks, including useWebSocket
│   │   ├── router/          # route definitions and guards
│   │   ├── stores/          # Pinia authentication state
│   │   ├── types/           # shared frontend TypeScript contracts
│   │   └── views/           # login, dashboard and analysis pages
│   └── tests/               # frontend unit/component tests
├── server/
│   ├── src/
│   │   ├── config/          # environment and Prisma configuration
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── middlewares/     # auth, validation, logging, error handling
│   │   ├── realtime/        # WebSocket lifecycle and message definitions
│   │   ├── routes/          # route binding only
│   │   ├── services/        # business logic and data aggregation
│   │   ├── validators/      # Zod request schemas
│   │   └── utils/           # response, error and CSV utilities
│   ├── prisma.config.ts
│   └── test/                # API and WebSocket integration tests
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── deploy/nginx/            # example Nginx configuration
├── docker-compose.yml       # local PostgreSQL
├── ecosystem.config.cjs     # PM2 application definition
└── README.md
```

## Data Model

```text
Customer 1 ── * Order 1 ── * OrderItem * ── 1 Product * ── 1 Category

User                   # management console accounts
TrafficRecord          # daily traffic and conversion source data
```

- `User`: 后台账号，包含角色和密码哈希；密码哈希不会出现在 API 响应中。
- `Customer`: 消费者资料、地区、年龄、性别、会员等级和注册日期。
- `Category` / `Product`: 分类和商品；商品保存价格、成本、库存、预警库存和状态。
- `Order` / `OrderItem`: 订单与明细；金额使用 PostgreSQL `Decimal(12,2)`，而非浮点数。
- `TrafficRecord`: 按日存储 PV、UV、加购、结算和订单数量。

Prisma Schema 为常见筛选字段建立了索引，例如订单的 `createdAt`、`status + createdAt`、`region + createdAt`，以及客户的地区、会员等级和注册日期。订单删除会级联删除明细；商品、分类和客户在已有业务关联时使用限制删除，避免产生孤立业务数据。

## REST API

所有业务接口（健康检查与登录除外）需要 `Authorization: Bearer <accessToken>`。成功响应遵循：

```json
{ "success": true, "data": {}, "message": "success" }
```

失败响应遵循：

```json
{ "success": false, "message": "Error message", "errors": [] }
```

| Group | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Dashboard | `GET /api/dashboard/overview` |
| Analytics | `GET /api/analytics/sales-trend`, `category-distribution`, `top-products`, `order-status`, `payment-methods`, `customer-growth`, `customer-regions`, `customer-levels`, `inventory-alerts` |
| Orders | `GET /api/orders` |
| Products | `GET /api/products`, `GET /api/products/categories`, `GET /api/products/slow-moving` |
| Customers | `GET /api/customers`, `GET /api/customers/summary`, `GET /api/customers/high-value` |
| Export | `GET /api/exports/sales`, `products`, `customers`, `orders` |

分析接口支持的通用筛选条件包括 `startDate`、`endDate`、`region`、`categoryId` 和 `customerLevel`；不同接口还会定义 `granularity`、`limit`、分页与排序等参数。参数由 Zod 在服务端校验。

订单列表使用分页对象，而不是数组：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## WebSocket Messages

连接地址为 `/ws`。每个消息具有统一格式：

```json
{
  "type": "ORDER_CREATED",
  "timestamp": "2026-07-28T00:00:00.000Z",
  "data": {}
}
```

| Type | Direction | Purpose |
| --- | --- | --- |
| `CONNECTION_ESTABLISHED` | Server → Client | 确认连接成功 |
| `ORDER_CREATED` | Server → Client | 新模拟订单写入数据库后广播 |
| `METRICS_UPDATED` | Server → Client | 推送实时指标 |
| `ONLINE_COUNT_UPDATED` | Server → Client | 推送在线连接数 |
| `PING` / `PONG` | Both | 应用层和 WebSocket 心跳配合 |
| `ERROR` | Server → Client | 消息格式或服务端错误提示 |

前端会限制实时动态数量，并在断开连接后按指数退避策略重连。服务端定期检查心跳并清理失效连接。

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop / Docker Engine（用于本地 PostgreSQL）

### 1. Clone and install dependencies

```bash
git clone https://github.com/<your-account>/<your-repository>.git
cd analytics-dashboard

cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Configure environment variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

修改 `server/.env` 中的 `JWT_SECRET` 为足够长的随机值。不要提交 `.env` 文件。

| File | Variable | Description |
| --- | --- | --- |
| `server/.env` | `NODE_ENV` | Runtime mode, normally `development` or `production` |
| `server/.env` | `PORT` | API/WS server port; local default is `3000` |
| `server/.env` | `DATABASE_URL` | PostgreSQL connection URL |
| `server/.env` | `JWT_SECRET` | JWT signing secret; use a strong unique value |
| `server/.env` | `JWT_EXPIRES_IN_SECONDS` | Access-token lifetime in seconds |
| `server/.env` | `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `client/.env` | `VITE_API_BASE_URL` | REST API base URL, e.g. `http://localhost:3000/api` |
| `client/.env` | `VITE_WS_URL` | WebSocket server URL, e.g. `ws://localhost:3000` |

### 3. Start PostgreSQL with Docker Compose

```bash
docker compose up -d postgres
docker compose ps
```

The development Compose file publishes PostgreSQL at `localhost:5432`. Its sample credentials are for local development only; replace them before any shared environment.

### 4. Generate Prisma client, migrate, and seed

```bash
cd server
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

The seed script is designed for repeated local execution: it removes and recreates its own development dataset. It creates 1 administrator, 1,000 customers, 8 categories, 100 products, 5,000 orders and associated items, plus 180 daily traffic records. The initial seeded administrator is `admin@example.com` / `Admin123!`; change this password for any shared or production environment.

Optional database inspection:

```bash
npx prisma studio --config prisma.config.ts
```

### 5. Run the applications

Open two terminals:

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:3000/api/health`
- WebSocket: `ws://localhost:3000/ws`

## Testing and Quality Checks

Database-backed backend integration tests require PostgreSQL and the seeded data above.

```bash
# backend API and WebSocket integration tests
cd server
npm test
npm run lint
npm run build

# frontend component/composable tests and production build
cd ../client
npm test
npm run lint
npm run build
```

Use `npm run test:watch` in either workspace during development. The test suite focuses on authentication, protected access, date validation, analytics aggregation, pagination, WebSocket message shape, component loading/empty/error states, and WebSocket reconnect behavior.

## Production Deployment

The repository includes an example PM2 definition in [`ecosystem.config.cjs`](ecosystem.config.cjs) and an IP-based Nginx server example in [`deploy/nginx/analytics-dashboard-ip.conf`](deploy/nginx/analytics-dashboard-ip.conf).

High-level deployment process on Ubuntu with Node.js 20, PostgreSQL and Nginx:

1. Clone the repository into a dedicated directory, for example `/opt/analytics-dashboard`.
2. Create production-only `.env` files on the server with unique `DATABASE_URL` and `JWT_SECRET`; do not copy local credentials.
3. Start PostgreSQL without exposing it publicly (for example, bind Docker port `5432` to `127.0.0.1`).
4. Run `npm ci`, generate Prisma Client, and apply committed migrations:

   ```bash
   cd /opt/analytics-dashboard/server
   npm ci
   npm run prisma:generate
   npx prisma migrate deploy --config prisma.config.ts
   npm run build

   cd ../client
   npm ci
   npm run build
   ```

5. Start the API with PM2:

   ```bash
   cd /opt/analytics-dashboard
   pm2 start ecosystem.config.cjs --env production
   pm2 save
   pm2 startup
   ```

6. Install an Nginx site that serves `client/dist`, proxies `/api/` to the local API, and preserves WebSocket Upgrade headers for `/ws`.
7. Validate then reload Nginx: `sudo nginx -t && sudo systemctl reload nginx`.

For a domain-based deployment, terminate TLS at Nginx and set the frontend WebSocket URL to `wss://<domain>`. Do not expose the Node API or PostgreSQL port directly to the internet.

## Engineering Challenges and Decisions

### Money and aggregation accuracy

Order and product monetary values use PostgreSQL decimal columns (`Decimal(12,2)`) rather than binary floating point. API output formats monetary values to two decimal places, and ratio calculations guard against zero denominators.

### Analytics query shape

The service layer uses Prisma aggregation and parameterized raw SQL only where it helps with grouped time-series calculations. Input validation and indexed date/filter columns keep query inputs constrained; route files do not query the database directly.

### Realtime lifecycle management

The backend creates the WebSocket server from the same HTTP server as Express. It sends connection acknowledgements, uses heartbeat checks to remove stale clients, records connection lifecycle events, and broadcasts persisted simulated orders and metrics. The frontend owns reconnect behavior in a composable to avoid duplicate connections.

### Frontend state and visualization

Shared request types, reusable D3 components, lazy-loaded routes, pagination, and URL-synchronized filters keep pages focused. D3 work remains inside chart components, which respond to data and container-size changes and clean up listeners on unmount.

## Roadmap

- [ ] Add role-specific authorization policies and audit logs.
- [ ] Add refresh-token rotation and server-side logout/session invalidation.
- [ ] Add database-backed or Redis-backed analytics cache with explicit invalidation.
- [ ] Add scheduled ingestion from real commerce data sources.
- [ ] Add observability: structured logs, metrics, alerts and error tracking.
- [ ] Expand end-to-end browser coverage and CI automation.
- [ ] Add a domain, HTTPS, and production `wss://` configuration.

## Author

**Author:** `<your name>`
**GitHub:** `https://github.com/<your-account>`

---

If you use this project as a starting point, review all environment variables, seeded credentials, CORS settings, and infrastructure configuration before exposing it to users.
