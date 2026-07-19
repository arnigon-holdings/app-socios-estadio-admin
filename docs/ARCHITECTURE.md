# Architecture

## Overview

React 19 SPA admin panel for stadium member management. Used by club admins and security operators to manage users, teams, point transactions, audit logs, and perform face search via a dedicated Go service.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Browser | — |
| Framework | React | 19.2.6 |
| Bundler | Vite | 8.0.12 |
| Routing | React Router | 7.18.0 |
| Styling | Tailwind CSS v4 | 4.3.1 |
| UI Components | shadcn/ui + radix-ui | 4.11 / 1.6 |
| Data Fetching | TanStack Query | 5.101.0 |
| Forms | react-hook-form + Zod | 7.80 / 4.4.3 |
| Fonts | @fontsource-variable/ibm-plex-sans, oxanium | 5.2.8 |
| Icons | lucide-react | 1.21.0 |
| Testing | Playwright | 1.61.0 |
| Linting | ESLint + typescript-eslint | 10 / 8.59 |

## Directory Structure

```
src/
├── main.tsx                    # Entry point, AuthProvider wrapping
├── AppRouter.tsx              # (implicit in routes/index.tsx)
├── routes/index.tsx           # React Router v7 config, Protected/Public routes
├── components/
│   ├── layout.tsx             # Sidebar navigation
│   └── ui/                    # shadcn primitives (Button, Card, Table, Dialog, etc.)
├── hooks/
│   └── use-auth.tsx           # Auth context (admin, login, logout, checkAuth)
├── lib/
│   ├── api.ts                # fetchApi + api.searchFace (Go service bypass)
│   └── utils.ts              # cn() utility
├── pages/
│   ├── login.tsx             # Login form
│   ├── dashboard.tsx         # Stats overview
│   ├── users.tsx             # User list + detail modal + delete
│   ├── teams.tsx             # Team CRUD
│   ├── point-actions.tsx     # Point action CRUD
│   ├── transactions.tsx      # Point transaction ledger
│   ├── audit-logs.tsx        # Audit log viewer
│   └── face-search.tsx       # Photo upload + match grid
├── types/index.ts            # TypeScript interfaces (Admin, User, Team, etc.)
└── index.css                 # Tailwind imports + custom fonts
```

## Key Flows

### Admin Authentication

```
Browser → POST /api/v1/admin/login (email + password)
       ← Set-Cookie: access_token (httpOnly, JWT, 1h expiry)
       ← Set-Cookie: refresh_token (httpOnly, 30d expiry)

Subsequent requests → Cookie sent automatically (credentials: include)
                   ← GET /api/v1/admin/dashboard (validates session)
```

Session persistence across page reloads depends on the cookie `Max-Age` / `Expires` set by the backend (currently 1h for access_token).

### Face Search (Go Service Bypass)

```
Admin uploads photo → api.searchFace(imageBase64)
                   → POST https://VITE_FACE_SEARCH_URL/search-face
                   → Authorization: Bearer VITE_FACE_SEARCH_TOKEN
                   ← { matches: [...], query_time_ms }

Rationale: isolates Rekognition latency (~200-500ms) from Rails API.
```

### CRUD Pattern (TanStack Query)

```
useQuery → GET list/detail
useMutation → POST/PATCH/DELETE → queryClient.invalidateQueries({ queryKey: [...] })
```

## Configuration

**`vite.config.ts`**: Dev server on port **5175**, proxy `/api` → `http://localhost:3001`. Face-search bypasses proxy (direct to `VITE_FACE_SEARCH_URL`).

**Environment variables** (prefix `VITE_`, build-time):
- `VITE_API_BASE_URL` — Rails backend URL
- `VITE_FACE_SEARCH_URL` — Go service URL
- `VITE_FACE_SEARCH_TOKEN` — Bearer token for Go service
- `VITE_ADMIN_EMAIL` — Login placeholder

## Deployment

```bash
npm install
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve dist/
```

Dev: `npm run dev` (port 5175).
