# `admin/` — Panel de Administración

SPA React 19 + Vite 6 + Tailwind v4 + shadcn/ui + TanStack Query. Lo usan los admins del club para gestionar socios, equipos, puntos y buscar caras.

> **Contexto completo**: leé [`/README.md`](../../README.md), [`/AGENTS.md`](../../AGENTS.md), [`/SPEC.md`](../../SPEC.md).

## Quickstart

```bash
npm install
cp .env.example .env.local   # editar con dev tokens (gitignored)
npm run dev                  # http://localhost:5174
```

## Estructura

```
admin/
├── src/
│   ├── main.tsx                  ← entrypoint + AuthProvider
│   ├── routes/index.tsx         ← React Router con rutas protegidas
│   ├── components/
│   │   ├── layout.tsx            ← Sidebar con navegación
│   │   └── ui/                   ← shadcn primitives
│   ├── hooks/
│   │   └── use-auth.tsx          ← JWT context admin
│   ├── lib/
│   │   ├── api.ts                ← fetchApi + api.searchFace (presigned URL flow)
│   │   └── utils.ts
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   ├── users.tsx             ← CRUD + ver caras registradas
│   │   ├── teams.tsx
│   │   ├── point-actions.tsx
│   │   ├── transactions.tsx
│   │   ├── audit-logs.tsx
│   │   └── face-search.tsx       ← upload + grid de matches con thumbnails
│   ├── types/                    ← User, Team, FaceSearchMatch, etc
│   └── index.css
├── .env.example                  ← template tracked
└── .env.local                    ← (gitignored) dev tokens
```

## Rutas

| Path | Página | Auth |
|---|---|---|
| `/login` | Login | público |
| `/dashboard` | Stats generales | protegido |
| `/users` | Lista + crear/editar/eliminar socios | protegido |
| `/teams` | CRUD equipos | protegido |
| `/point-actions` | CRUD acciones (registro facial = X puntos) | protegido |
| `/transactions` | Ledger de puntos | protegido |
| `/audit-logs` | Historial de acciones admin | protegido |
| `/face-search` | Subir foto → buscar matches | protegido |

## Endpoints que consume

**Backend Rails** (`VITE_API_BASE_URL`):
- `POST /api/v1/admin/login` → JWT en cookie httpOnly.
- `DELETE /api/v1/admin/logout`
- `GET /api/v1/admin/dashboard` → stats.
- `GET /api/v1/admin/users?page=&per_page=&rut=`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id`
- `DELETE /api/v1/admin/users/:id`
- `GET /api/v1/admin/users/:id/face_records`
- `GET /api/v1/admin/teams`, `POST`, `PATCH`, `DELETE`
- `GET /api/v1/admin/point_actions`, `POST`, `PATCH`, `DELETE`
- `GET /api/v1/admin/point_transactions`
- `GET /api/v1/admin/audit_logs`

**Go face-search service** (`VITE_FACE_SEARCH_URL`, **bypasses Rails**):
- `POST /search-face` con `Authorization: Bearer ${VITE_FACE_SEARCH_TOKEN}`.
- Body: `{ "image": "data:image/jpeg;base64,..." }`.
- Response: `{ matches: [{ user_id, rut, phone, confidence, face_id, photo_url }], query_time_ms }`.

## Decisiones de UI

- **Tablas → cards en face-search**: el usuario pidió explícitamente que las fotos se vieran grandes al costado, no en filas de tabla. Layout 2 columnas (sticky upload + grid de resultados).
- **Banda de similitud + porcentaje**: 5 bandas (Muy alta ≥98%, Alta ≥95%, Media ≥85%, Baja ≥70%, Muy baja <70%) + porcentaje entero 0-100.
- **Cada match card muestra**: face 128×128 + RUT + Coincidencia% + Similitud (badge) + Teléfono.
- **Texto user-friendly, sin marcas**: "Buscando coincidencias…" (no "Rekognition"), "Sin caras indexadas" (no "Rekognition"). Regla en `/AGENTS.md`.

## Comandos

```bash
npm run dev          # vite dev :5174
npm run build        # tsc + vite build → dist/
npm run preview      # serve dist/
npm run lint         # eslint
npm run test         # playwright
```

## Env vars

`VITE_*`:

| Var | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL del backend Rails |
| `VITE_FACE_SEARCH_URL` | URL del servicio Go face-search |
| `VITE_FACE_SEARCH_TOKEN` | Bearer token compartido con Go service |
| `VITE_ADMIN_EMAIL` | Email del admin (default seed) |
| `VITE_ADMIN_PASSWORD` | Password del admin (solo dev) |

## Gotchas

- **El Vite proxy (`/api → localhost:3000`) solo aplica al backend Rails**. Para `/search-face` no hay proxy — el cliente llama directo a `VITE_FACE_SEARCH_URL`. Esto es por diseño (ver `ARCHITECTURE.md`).
- **CORS**: el Go service valida `CORS_ORIGINS` env. Para dev debe incluir `http://localhost:5174`.
- **Las URLs presigned de S3 expiran en 1h**. Si el admin deja la página abierta, las imágenes se rompen al refrescar — la búsqueda las regenera.
- **`VITE_FACE_SEARCH_TOKEN` se expone al bundle**. Es un secret compartido Go ↔ admin. En prod rotarlo regularmente y considerar emisión server-side.
- **`VITE_ADMIN_PASSWORD`** es solo dev. En prod, eliminar del `.env.local` y usar SSO/IdP si es posible.
- **`/face-search` requiere login**. Si redirige a `/login`, normal. La página nunca debe exponer resultados sin auth.

## Decisiones arquitectónicas

- **React Router v7 con rutas protegidas** (`ProtectedRoute`, `PublicRoute`).
- **TanStack Query** para todos los fetches de lista/detalle (cache + revalidación).
- **Mutaciones** con `useMutation` + `invalidateQueries` para refrescar la lista afectada.
- **`api.searchFace<T>(imageBase64)`** bypassa Rails y llama directo a Go service. Razón: latencia y separación de carga (Rekognition no satura el backend principal).
- **Cards de match** con `<img src={photo_url}>` presigned 1h. Si Rekognition no encuentra el face en la DB (huérfano), `photo_url` viene vacío y se muestra placeholder "Sin imagen".
- **Skeletons** durante carga con componente `<Skeleton>` de shadcn. Estructura del skeleton imita la card real (face 128px + labels).
