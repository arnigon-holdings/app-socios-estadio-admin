# `admin/` — Panel de Administración

SPA React 19 + Vite 6 + Tailwind v4 + shadcn/ui + TanStack Query. Lo usan los admins del club para gestionar socios, equipos, puntos y buscar caras.

> **Contexto completo**: leé [`/README.md`](../../README.md), [`/AGENTS.md`](../../AGENTS.md), [`/SPEC.md`](https://github.com/arnigon-holdings/app-socios-estadio-docs/blob/main/SPEC.md) (en el docs repo).

## Para agentes / LLMs

Ruta de documentación para una IA que aterriza en este repo:

1. **`README.md`** (este archivo) — qué es, quickstart, estructura, rutas, endpoints, decisiones.
2. **[`CLAUDE.md`](./CLAUDE.md)** — reglas de comportamiento: cómo trabajar aquí, comandos, boundaries, gotchas.
3. **[`SPEC.md`](./SPEC.md)** — contrato funcional completo (rutas, modelo UI, contratos API, errores, reglas UX).

Documentación transversal del proyecto (polyrepo completo):
[`arnigon-holdings/app-socios-estadio-docs`](https://github.com/arnigon-holdings/app-socios-estadio-docs) — fuente de verdad de arquitectura, spec global, checklist, infrastructure y entorno.

## Quickstart

**Opcion A — Docker (recomendada)**:

Desde la raiz del workspace:
```bash
docker compose up -d admin
# admin disponible en http://localhost:5175
```

**Opcion B — Local (requiere backend corriendo)**:

```bash
npm install
cp .env.example .env.local   # editar con dev tokens (gitignored)
npm run dev          # http://localhost:5175
```

El admin espera que Rails Backend este en `http://localhost:3001` (configurable via `VITE_API_BASE_URL`).

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
```

## Env vars

Toda configuración viene de variables de entorno `VITE_*` (expuestas al bundle en build time). **No hay secretos hardcodeados en código**.

### Archivos de configuración

| Archivo | Estado | Propósito |
|---|---|---|
| `admin/.env.example` | tracked | Template con todas las variables (placeholders) |
| `admin/.env.development` | tracked (sin secretos reales) | Defaults de dev — el dev server arranca con valores placeholder |
| `admin/.env.production` | gitignored | Build de prod con valores reales (deploy lo setea) |
| `admin/.env.local` | gitignored | Override local — Vite lo lee pero no lo commitea |

> **Vite solo lee `.env`, `.env.local`, `.env.development`, `.env.production`**. Las variables deben tener el prefijo `VITE_` para ser accesibles (`import.meta.env.VITE_*`).

### Tabla de variables

#### Backend API (Rails)

| Var | Requerida | Default dev | Para qué sirve |
|---|---|---|---|
| `VITE_API_BASE_URL` | sí | `http://localhost:3001` | URL del backend Rails. Llamadas fetch en `src/lib/api.ts`. |

#### Go face-search service

| Var | Requerida | Default dev | Para qué sirve |
|---|---|---|---|
| `VITE_FACE_SEARCH_URL` | sí | `http://localhost:8081` | URL del Go service (`/search-face` endpoint) |
| `VITE_FACE_SEARCH_TOKEN` | sí | — | Bearer token compartido con Go service. **Si está vacío, `/face-search` lanza error** (`admin/src/lib/api.ts:50`). |

> Leídos en `src/lib/api.ts` → `searchFaceRequest()`.

#### Credenciales admin dev (placeholder UI)

Estos valores se usan **solo como placeholder** en el form de login. La auth real la hace el backend contra la tabla `admins` (seed passwords desde `backend/.env.development`).

| Var | Requerida | Default dev | Para qué sirve |
|---|---|---|---|
| `VITE_ADMIN_EMAIL` | no | — | Email que aparece como placeholder en el input del login |
| `VITE_ADMIN_PASSWORD` | no | — | **No se usa en runtime** — solo el campo `VITE_ADMIN_EMAIL` es referenciado. El campo password no tiene placeholder para no sugerir nada. |

> Si querés un placeholder distinto en el input email, setear `VITE_ADMIN_EMAIL`. En producción, dejar vacío (el form se renderiza sin sugerencia).

### Dónde cambiar cada clave (resumen rápido)

- **Cambiar URL del backend**: `VITE_API_BASE_URL` en `.env.development` (dev) o `.env.production` (build). Requiere rebuild.
- **Cambiar URL del Go face-search**: `VITE_FACE_SEARCH_URL`. Rebuild.
- **Rotar token face-search**: `VITE_FACE_SEARCH_TOKEN` aquí + en `face-search-service/.env.development` (dev) o Secret Manager (prod). Mismo valor en ambos lados (token compartido).
- **Cambiar el email placeholder del login**: `VITE_ADMIN_EMAIL`. Rebuild (es build-time).

### Gotchas

- **`VITE_FACE_SEARCH_TOKEN` se expone al bundle**. Es un secret compartido Go ↔ admin. En prod rotar regularmente y considerar emisión server-side.
- **Cambiar cualquier `VITE_*` requiere restart del dev server** o rebuild para prod.
- **El `/face-search` requiere login**. Si redirige a `/login`, normal. La página nunca debe exponer resultados sin auth.

## Gotchas

- **El Vite proxy (`/api → localhost:3000`) solo aplica al backend Rails**. Para `/search-face` no hay proxy — el cliente llama directo a `VITE_FACE_SEARCH_URL`. Esto es por diseño (ver [`ARCHITECTURE.md`](https://github.com/arnigon-holdings/app-socios-estadio-docs/blob/main/ARCHITECTURE.md)).
- **CORS**: el Go service valida `CORS_ORIGINS` env. Para dev debe incluir `http://localhost:5174` (frontend) y `http://localhost:5175` (admin).
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
