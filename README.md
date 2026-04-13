# Sunroom CRM — React Frontend

A full-featured customer relationship management application built with React 19, TypeScript, Tailwind CSS, and TanStack Query. This is the React frontend for [Sunroom CRM](https://sunroomcrm.net), backed by a .NET 8 REST API with SQL Server.

## About Sunroom CRM

Sunroom CRM is a multi-frontend CRM platform designed to demonstrate the same business requirements implemented across multiple modern frameworks — all sharing a single .NET 8 REST API and SQL Server database. The project showcases how different frontend ecosystems approach the same real-world problems: authentication, CRUD operations, real-time data visualization, drag-and-drop workflows, role-based access control, and AI-powered features.

### The Full Stack

| Repository | Technology | Description |
|------------|------------|-------------|
| [sunroom-crm-dotnet](https://github.com/rvnminers-A-and-N/sunroom-crm-dotnet) | .NET 8, EF Core, SQL Server | Shared REST API with JWT auth, AI endpoints, and Docker support |
| [sunroom-crm-angular](https://github.com/rvnminers-A-and-N/sunroom-crm-angular) | Angular 21, Material, Vitest | Angular frontend with 100% test coverage |
| **sunroom-crm-react** (this repo) | React 19, shadcn/ui, Vitest | React frontend with 100% test coverage |
| [sunroom-crm-vue](https://github.com/rvnminers-A-and-N/sunroom-crm-vue) | Vue 3, TypeScript | Vue frontend |
| [sunroom-crm-blazor](https://github.com/rvnminers-A-and-N/sunroom-crm-blazor) | Blazor, .NET 8 | Blazor WebAssembly frontend |
| [sunroom-crm-laravel](https://github.com/rvnminers-A-and-N/sunroom-crm-laravel) | Laravel, PHP | Laravel full-stack implementation |

## Tech Stack

| Layer         | Technology                                          |
|---------------|-----------------------------------------------------|
| Framework     | React 19 with Vite 6                                |
| UI            | shadcn/ui (Radix primitives) + Tailwind CSS 4       |
| Charts        | Recharts 3                                          |
| State         | TanStack Query 5 (server) + Zustand 5 (client)     |
| Forms         | React Hook Form 7 + Zod 3                           |
| Drag & Drop   | @dnd-kit (core + sortable)                          |
| Unit Tests    | Vitest 4 + Testing Library + MSW 2 + coverage-v8   |
| E2E Tests     | Playwright 1.59 (Chromium)                          |
| CI/CD         | GitHub Actions                                      |
| Language      | TypeScript 5.7                                      |

## Features

- **Authentication** — JWT-based login and registration with Zustand-persisted auth state and Axios interceptors
- **Contacts** — Full CRUD with search, tag filtering, pagination, and sorting
- **Companies** — Company management with associated contacts and deals
- **Deals** — List view and Kanban-style pipeline board with @dnd-kit drag-and-drop between stages
- **Activities** — Activity log with timeline view linked to contacts and deals
- **Dashboard** — Overview with Recharts visualizations for pipeline value, deals by stage, and recent activity
- **AI Features** — AI-powered natural language search, activity summarization, and deal insights
- **Admin Panel** — User management restricted to admin roles
- **Settings** — User profile editing and preferences
- **Responsive Layout** — Collapsible sidebar with mobile hamburger menu and adaptive navigation

## Getting Started

### Prerequisites

- Node.js 24+ (LTS)
- npm 11+
- The [.NET API](https://github.com/rvnminers-A-and-N/sunroom-crm-dotnet) running on `http://localhost:5236`

### Setup

```bash
git clone https://github.com/rvnminers-A-and-N/sunroom-crm-react.git
cd sunroom-crm-react
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and expects the API at the URL defined in `.env`.

### Running the API

The .NET API can be started via Docker Compose from the `sunroom-crm-dotnet` repo:

```bash
cd ../sunroom-crm-dotnet
cp .env.example .env   # Set SA_PASSWORD
docker compose up -d
```

## Available Scripts

| Command                  | Description                              |
|--------------------------|------------------------------------------|
| `npm run dev`            | Start the dev server on port 5173        |
| `npm run build`          | Production build to `dist/`              |
| `npm run preview`        | Preview the production build locally     |
| `npm test`               | Run unit tests once                      |
| `npm run test:watch`     | Run unit tests in watch mode             |
| `npm run test:coverage`  | Run unit tests with coverage report      |
| `npm run test:e2e`       | Run Playwright end-to-end tests          |
| `npm run format`         | Format code with Prettier                |

## Testing

### Unit Tests

460 tests across 68 test suites at **100% code coverage** (statements, branches, functions, and lines). Coverage thresholds are enforced in `vitest.config.ts` at 80% — the test run fails if any metric drops below the gate.

Tests use [Vitest](https://vitest.dev/) with jsdom, [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component rendering, [user-event](https://testing-library.com/docs/user-event/intro/) for interaction simulation, and [MSW](https://mswjs.io/) (Mock Service Worker) for API mocking.

```bash
npm run test:coverage
```

### End-to-End Tests

20 Playwright tests covering:

- **Authentication** — redirect guards, login success and failure, client-side validation, registration link, and logout
- **Contacts** — list rendering, detail navigation, empty state, and search filtering
- **Deals** — list view and pipeline Kanban board with stage columns
- **Dashboard** — KPI stats and recent activity
- **AI Panel** — natural language search and text summarization
- **Navigation** — sidebar navigation between sections, admin route visibility, role-based redirects, and unknown route handling

```bash
npm run test:e2e:install   # Install Chromium (first time)
npm run test:e2e           # Run tests
```

## CI/CD Pipeline

GitHub Actions runs four jobs on every push and pull request to `main`:

**Lint & Build** — Runs TypeScript type checking and Vite production build.

**Unit Tests** — Runs the full Vitest suite with coverage enforcement and uploads the coverage report as a build artifact.

**E2E Tests (mocked)** — Installs Playwright Chromium, builds the app, and runs all 20 E2E tests with API calls intercepted via `page.route()`.

**E2E Integration (Docker)** — Clones the .NET API repo, spins up SQL Server and the API via Docker Compose, then runs the full Playwright suite against the live stack. Gated behind the `RUN_E2E` repository variable.

## Architecture

```
src/
  core/                    # Singleton services, hooks, stores, and models
    api/                   # Axios client with JWT interceptor
    hooks/                 # TanStack Query hooks for all domain entities
    models/                # TypeScript interfaces for all domain entities
    stores/                # Zustand stores (auth with persist, UI state)
  features/                # Feature pages and dialogs
    activities/            # Activity log and timeline
    admin/                 # User management (admin-only)
    ai/                    # AI search, summaries, and deal insights
    auth/                  # Login and registration forms
    companies/             # Company CRUD and detail views
    contacts/              # Contact CRUD, search, tag sync, and detail views
    dashboard/             # Charts and recent activity overview
    deals/                 # Deal CRUD, list view, and pipeline Kanban board
    settings/              # User profile and preferences
  layout/                  # App shell with responsive sidebar and toolbar
  shared/                  # Reusable components and formatting utilities
  components/ui/           # 18 shadcn/ui primitives (Button, Dialog, Select, etc.)
  router/                  # React Router 7 route configuration
  lib/                     # General utilities (cn helper)
e2e/                       # Playwright end-to-end test specs and fixtures
tests/                     # Test infrastructure (MSW server, handlers, factories)
.github/workflows/         # CI pipeline configuration
```

### Key Patterns

- **TanStack Query** — All server state is managed through custom hooks (`useContacts`, `useDeals`, etc.) with query key invalidation on mutations
- **Zustand Persist** — Auth state (token, user, isAuthenticated) is persisted to localStorage and rehydrated on page load
- **Axios Interceptors** — Request interceptor injects the Bearer token; response interceptor handles 401 by clearing auth and redirecting to login
- **React Hook Form + Zod** — All forms use schema-based validation with type-safe resolvers
- **Lazy Loading** — Every feature route is lazy-loaded via `React.lazy()` for optimized bundle size
- **@dnd-kit** — The deals pipeline uses `@dnd-kit/sortable` for Kanban-style stage transitions with API persistence
- **MSW** — Unit tests mock the API layer through MSW request handlers rather than mocking axios directly, keeping tests close to real network behavior
- **Testing Library** — Component tests render through Testing Library for user-centric assertions rather than implementation-detail testing
- **Path Aliases** — `@core`, `@features`, `@shared`, `@layout` aliases simplify imports across the codebase

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
