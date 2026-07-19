# `admin/` — Arquitectura

> Lee [`CLAUDE.md`](./CLAUDE.md) para reglas del agente.
> Este documento describe la arquitectura técnica del panel admin.

## 1. Stack

```
React 19.2 + Vite 8 + TypeScript 6
├── UI:        Tailwind CSS v4 (@tailwindcss/vite), shadcn/ui 4.11, radix-ui 1.6
├── Routing:   React Router 7 (client-side SPA)
├── Data:      TanStack Query 5.101 (server state), react-hook-form 7.80 + Zod 4.4 (forms)
├── Auth:      Cookie JWT httpOnly (server-set por Rails, client-side check via query)
├── Fonts:     IBM Plex Sans (variable), Oxanium (variable)
└── Tests:     Playwright 1.61
```

**Puertos dev**: 5175. Proxy `/api` → `http://localhost:3001` (Rails).

## 2. Estructura de archivos

```
src/
├── lib/
│   ├── api.ts              ← fetch wrapper + searchFace() (bypass Rails)
│   └── utils.ts            ← cn() helper para Tailwind
├── components/
│   ├── layout.tsx          ← Shell con sidebar + ProtectedRoute / PublicRoute
│   └── ui/                 ← shadcn primitives (Button, Card, Table, Skeleton…)
├── pages/
│   ├── login.tsx           ← Público
│   ├── dashboard.tsx
│   ├── users.tsx + users-detail.tsx
│   ├── teams.tsx
│   ├── point-actions.tsx
│   ├── transactions.tsx
│   ├── audit-logs.tsx
│   └── face-search.tsx     ← Flagship: upload + grid matches
└── types/
    └── index.ts             ← Shared TS types (User, Team, FaceSearchMatch…)
```

## 3. Arquitectura de datos

### Server state (TanStack Query)

Todas las mutaciones usan `useMutation` + `invalidateQueries`. No hay global state manager para data de servidor.

```typescript
// Reads
useQuery({ queryKey: ['admin-users', page, rut], queryFn: () => fetchApi(`/admin/users?...`) })

// Writes
useMutation({ mutationFn: (payload) => patchApi(`/admin/users/${id}`, payload),
             onSuccess: () => invalidateQueries({ queryKey: ['admin-users'] }) })
```

### API layer (`src/lib/api.ts`)

Un solo `fetchApi()` wrapper que:
- Adjunta `credentials: 'include'` (cookie JWT)
- Mapea status codes → errores/redirects
- Lanza `ZodError` en 422

`searchFace()` es standalone — no usa `fetchApi` (Bearer token en header, no cookie).

## 4. Flujo de autenticación

```
Login → POST /api/v1/admin/login (body: {email, password})
       ← 200 + Set-Cookie: jwt_admin=...; HttpOnly; SameSite=Lax; Path=/
       → cookie guardada por el browser automáticamente

Logout → DELETE /api/v1/admin/logout
        ← 204 + Expires cookie

Auth check → useQuery(['admin-me']) en layout.tsx
            401 → redirect /login
            200 → render children
```

**Cookie**: `jwt_admin`, httpOnly, 24h expiry. Sin refresh token en la UI (re-login manual).

## 5. Face-search: bypass de Rails

```
Admin photo upload
    ↓
POST /search-face (Bearer token, image base64)
    ↓
Go service → Rekognition → S3 presigned URL
    ↓
{matches: [...], query_time_ms: N}
    ↓
Grid de cards (128×128 face, RUT, %, badge, phone)
```

**Por qué bypass**: latencia de Rekognition (~200-500ms) aislada del API principal. Scaling independiente.

**Token**: `VITE_FACE_SEARCH_TOKEN` compartido con Go service. Expuesto al bundle — no es secreto de alta gamma pero debe rotarse.

## 6. Variables de entorno (build-time)

| Var | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend Rails URL (dev: localhost:3001) |
| `VITE_FACE_SEARCH_URL` | Go service URL (dev: localhost:8081) |
| `VITE_FACE_SEARCH_TOKEN` | Bearer token compartido |
| `VITE_ADMIN_EMAIL` | Placeholder input login |
| `VITE_ADMIN_PASSWORD` | Dev-only placeholder (NO usado en runtime) |

Todas requieren prefijo `VITE_` + restart del dev server para tomar efecto.

## 7. Contratos con servicios externos

| Servicio | Protocolo | Rol |
|---|---|---|
| Backend Rails | HTTP REST (cookie JWT) | Auth, CRUD socios, teams, puntos, audit |
| Go face-search | HTTP REST (Bearer token) | Búsqueda facial + presigned S3 |
| S3 | Presigned URLs (1h) | Thumbnails de socios en face-search |

**Este panel no llama directamente a**: Postgres, Rekognition, S3 (solo URLs presigned), ni al frontend público.

## 8. Deployment

- Dev: `npm run dev` (Vite hot reload, proxy Rails)
- Staging/Prod: `npm run build` → `dist/` served por Nginx/Cloud Run
- Prod: `.env.production` inyectado como build args (GCP Secret Manager)
