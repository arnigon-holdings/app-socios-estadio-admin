# `admin/` — Especificación funcional

> Lee primero [`CLAUDE.md`](./CLAUDE.md) — define cómo trabajar en este repo (reglas del agente, comandos, gotchas).
> Este documento define **qué debe cumplir** este panel: contrato funcional completo.

Documentación canónica transversal del proyecto: [`arnigon-holdings/app-socios-estadio-docs`](https://github.com/arnigon-holdings/app-socios-estadio-docs). Este SPEC es **autocontenido** y refleja el contrato actual del panel.

## 1. Propósito y usuarios

SPA React 19 usado por el **personal administrativo y de operaciones del club** para gestionar el sistema de socios del estadio.

**Usuarios humanos:**

- **Admins** (superadmin / admin / operator / support) del club. Roles definidos en el backend Rails.
- **Operadores de seguridad** del estadio que usan `/face-search` para identificar socios a partir de fotos in-situ.

**Usuarios sistema:**

- Backend Rails (`app-socios-estadio-backend`) — `/api/v1/admin/*`.
- Go face-search service (`app-socios-estadio-face-search`) — `/search-face` (bypass de Rails).

## 2. Alcance

**Dentro del alcance:**

- Login + logout admin (cookie JWT httpOnly).
- CRUD de socios, equipos, point actions.
- Lectura de point transactions y audit logs.
- Face-search con upload de foto + grid de matches con thumbnails (presigned S3, 1h).
- Dashboard con stats generales.

**Fuera del alcance:**

- Indexing facial (lo hace el backend Rails).
- FaceLiveness (lo hace el frontend público).
- Acceso directo a Postgres, S3 o Rekognition.
- Lógica de negocio pesada (todo es delegación HTTP).
- Auto-registro de socios (eso es el frontend público).

## 3. Modelo de datos (vista UI)

El panel **no es dueño** del schema. Consume tipos desde el backend. Los tipos clave que este panel entiende:

### `User` (socio)

```typescript
type User = {
  id: number;
  rut: string;              // sin formato, solo dígitos
  phone: string;            // E.164
  password_digest?: string; // NUNCA se lee del backend
  birth_month: number;
  birth_year: number;
  photo_url: string;
  teams_ids: number[];
  consents: Record<string, boolean>;
  metadata: Record<string, unknown>;
  referral_code?: string;
  referred_by?: string;
  phone_verified: boolean;
  registration_status: 'pending' | 'verified' | 'indexed' | 'failed';
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
};
```

### `Team`

```typescript
type Team = {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  active: boolean;
};
```

### `PointAction`

```typescript
type PointAction = {
  id: number;
  action_key: string;       // ej: 'match_attended'
  description: string;
  points: number;
  active: boolean;
};
```

### `PointTransaction`

```typescript
type PointTransaction = {
  id: number;
  user_id: number;
  point_action_id: number;
  amount: number;           // puede ser negativo
  reference_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
```

### `AuditLog`

```typescript
type AuditLog = {
  id: number;
  admin_id: number | null;
  action: string;           // 'create' | 'update' | 'destroy' | 'login' | etc.
  resource_type: string;    // 'User' | 'Team' | etc.
  resource_id: number | null;
  metadata: Record<string, unknown>;
  ip?: string;
  created_at: string;
};
```

### `FaceRecord`

```typescript
type FaceRecord = {
  id: number;
  rekognition_face_id: string;  // tipo interno, NO mostrar al usuario
  s3_bucket: string;
  s3_key: string;
  indexed_at: string;
  created_at: string;
};
```

### `FaceSearchMatch` (del Go service)

```typescript
type FaceSearchMatch = {
  user_id: string;
  rut: string;
  phone: string;
  confidence: number;          // 0-100
  face_id?: string;            // tipo interno, NO mostrar al usuario
  photo_url?: string;          // presigned S3 URL, 1h expiry
};
```

## 4. Rutas y páginas

| Path | Página | Auth | Descripción |
|---|---|---|---|
| `/login` | `pages/login.tsx` | público | Form con email + password |
| `/dashboard` | `pages/dashboard.tsx` | protegido | Stats agregadas (cards + contadores) |
| `/users` | `pages/users.tsx` | protegido | Tabla con paginación + filtro RUT |
| `/users/:id` | (modal o detalle inline) | protegido | Edición + ver face_records |
| `/teams` | `pages/teams.tsx` | protegido | CRUD equipos |
| `/point-actions` | `pages/point-actions.tsx` | protegido | CRUD acciones de puntos |
| `/transactions` | `pages/transactions.tsx` | protegido | Ledger paginado |
| `/audit-logs` | `pages/audit-logs.tsx` | protegido | Histórico paginado |
| `/face-search` | `pages/face-search.tsx` | protegido | Upload + grid de matches |

**Layout**: `components/layout.tsx` con sidebar de navegación. Protegido por `ProtectedRoute`; `/login` por `PublicRoute` (redirige a `/dashboard` si ya autenticado).

## 5. Contratos API consumidos

### Backend Rails (vía `VITE_API_BASE_URL`)

Cliente en `src/lib/api.ts`. Todas las llamadas usan `credentials: 'include'` para enviar la cookie JWT.

#### Auth

- `POST /api/v1/admin/login` — body `{ email, password }`. Setea cookie httpOnly `jwt_admin`.
- `DELETE /api/v1/admin/logout` — limpia cookie.

#### Dashboard

- `GET /api/v1/admin/dashboard` → `{ users_count, indexed_users_count, pending_face_indexing, recent_registrations }`.

#### Users

- `GET /api/v1/admin/users?page=&per_page=&rut=` → `{ users, pagination }`.
- `GET /api/v1/admin/users/:id` → `{ user }`.
- `PATCH /api/v1/admin/users/:id` → `{ user }`.
- `DELETE /api/v1/admin/users/:id` → 204.

#### Face Records

- `GET /api/v1/admin/users/:id/face_records` → `FaceRecord[]`.
- `POST /api/v1/admin/users/:id/reindex-face` — body `{ reference_photo_base64 }`. (Pendiente M5)

#### Teams

- `GET /api/v1/admin/teams`, `POST`, `PATCH /:id`, `DELETE /:id`.

#### Point Actions

- `GET /api/v1/admin/point_actions`, `POST`, `PATCH /:id`, `DELETE /:id`.

#### Point Transactions

- `GET /api/v1/admin/point_transactions` (paginated, filtros por `user_id`, `point_action_id`, `date_range`).

#### Audit Logs

- `GET /api/v1/admin/audit_logs` (paginated, filtros por `admin_id`, `action`, `resource_type`, `date_range`).

### Go face-search service (vía `VITE_FACE_SEARCH_URL`, **bypass Rails**)

Cliente en `src/lib/api.ts` → `searchFaceRequest()`.

- `POST /search-face`
- Headers: `Authorization: Bearer ${VITE_FACE_SEARCH_TOKEN}`
- Body: `{ image: "data:image/jpeg;base64,..." }`
- Response: `{ matches: FaceSearchMatch[], query_time_ms: number }`

**Si `VITE_FACE_SEARCH_TOKEN` está vacío**, la request **falla al construir** (no al recibir response). Esto es intencional para evitar builds con token faltante.

## 6. Reglas de negocio (UI)

1. **Cards sobre tablas en `/face-search`**: layout 2 columnas (sticky upload + grid de resultados).
2. **Banda de similitud + porcentaje en cada match**:

   | Banda | Threshold | Color badge |
   |---|---|---|
   | Muy alta | ≥98% | verde fuerte |
   | Alta | ≥95% | verde claro |
   | Media | ≥85% | amarillo |
   | Baja | ≥70% | naranja |
   | Muy baja | <70% | rojo |

   El porcentaje se muestra como entero 0-100 (`Math.round(confidence)`).

3. **Cada match card muestra**: face 128×128 + RUT + Coincidencia% + Similitud (badge) + Teléfono.

4. **Si `photo_url` viene vacío** (face huérfano tras delete), mostrar placeholder "Sin imagen" con icono.

5. **Skeletons** durante carga con componente `<Skeleton>` de shadcn. Estructura del skeleton imita la card real (face 128px + labels).

6. **Login**: solo email + password. La cookie se setea server-side. No manejo de tokens en JS.

7. **Validaciones**: `VITE_ADMIN_EMAIL` se usa como placeholder del input email. **NO** pre-llenar el form.

8. **RUT en inputs**: sin formato (solo dígitos). Validación final en backend.

## 7. Estados y transiciones

### Auth state

```
[unauthenticated]
   │
   │ POST /api/v1/admin/login OK
   ▼
[authenticated]
   │
   │ DELETE /api/v1/admin/logout
   │ OR cookie expired
   ▼
[unauthenticated]
```

Cookie expiry: 24h (definido en backend). Refresh no implementado en UI (re-login manual).

### Face-search flow

```
[page load]
   │
   │ user sube foto
   ▼
[uploading]
   │
   │ fetch POST /search-face
   ▼
[searching]  (skeleton visible)
   │
   ├─► [success]  → render match cards
   │
   ├─► [error 401]  → redirect /login
   │
   ├─► [error 400]  → "No se detectó un rostro válido…"
   │
   ├─► [error 413]  → "Imagen demasiado grande (máx 5MB)"
   │
   └─► [error 5xx]  → "Error de búsqueda. Reintentar."
```

### CRUD lifecycle

Cada página de CRUD sigue el patrón:

```
[loading initial data] → [idle] → [mutating] → [revalidating] → [idle]
                                ↑                      │
                                └──── invalidateQueries ┘
```

`useMutation` para crear/editar/borrar. `invalidateQueries` para refrescar la lista afectada. Mensajes de éxito/error vía `useToast` (hook local).

## 8. Errores y modos de fallo

**Manejo de errores HTTP** (en `src/lib/api.ts` → `fetchApi`):

| Status | Comportamiento |
|---|---|
| 200/201/204 | Success |
| 401 | Redirigir a `/login` (cookie expirada o inválida) |
| 403 | Toast: "Sin permisos para esta acción" |
| 404 | Toast: "Recurso no encontrado" |
| 409 | Toast con mensaje del backend (ej. RUT duplicado) |
| 422 | Toast con errores de validación (Zod) |
| 5xx | Toast genérico: "Error del servidor. Reintentar." |
| Network error | Toast: "Sin conexión. Verificar red." |

**Face-search errores** (mensajes user-friendly en español, mapeados desde Go service):

| Go service status | Mensaje UI |
|---|---|
| 400 (InvalidParameter) | "No se detectó un rostro válido. Asegúrate de que la foto muestre una sola cara, bien iluminada y de frente." |
| 400 (InvalidImageFormat) | "Formato de imagen no soportado. Usa JPEG o PNG." |
| 401 | Redirigir a `/login` |
| 413 | "Imagen demasiado grande (máx 5MB)" |
| 500 (AccessDenied) | "Error de permisos. Contactar al administrador." |
| 500 (ResourceNotFound) | "Servicio de búsqueda no disponible. Contactar al administrador." |
| 503 | "Servicio saturado. Reintentar en unos segundos." |

## 9. Métricas, logs, auditoría

**Logs**: ninguno client-side en runtime (consola solo en dev). Para errores, el backend Rails escribe `audit_logs`.

**Métricas**: ninguna implementada. Si se requiere,建议 usar GA4 / PostHog con cuidado de no filtrar PII.

**Auditoría**: el backend Rails registra cada acción admin en `audit_logs` con `admin_id`, `action`, `resource_type`, `resource_id`, `metadata`, `ip`. Este panel solo dispara las acciones; no mantiene su propio audit trail.

## 10. Dependencias externas (contratos hacia otros servicios)

| Dependencia | Contrato | Falla |
|---|---|---|
| **Backend Rails** | `/api/v1/admin/*` (cookie JWT httpOnly) | 401 → redirect `/login`; 5xx → toast genérico |
| **Go face-search service** | `POST /search-face` (Bearer token en header) | Errores mapeados a mensajes user-friendly (ver §8) |
| **S3** (vía presigned URLs) | URLs presigned 1h para thumbnails | Si expira, búsqueda regenera al re-correr |
| **GCP Secret Manager** (prod build) | Inyecta `VITE_*` al build time | Build falla si falta variable requerida |

**Servicios que este panel NO debe llamar:**

- No llama directamente a AWS (S3/Rekognition) — todo es vía backend o Go service.
- No llama al frontend público.
- No llama a `camera-server`.

## 11. Anexo: trazabilidad al SPEC canónico

El SPEC canónico del proyecto vive en [`arnigon-holdings/app-socios-estadio-docs/SPEC.md`](https://github.com/arnigon-holdings/app-socios-estadio-docs/blob/main/SPEC.md).

**Deltas de este SPEC respecto al canónico:**

- Este SPEC **detalla exclusivamente** el contrato del panel admin (rutas, modelo UI, contratos API, errores, UX).
- El bypass de Rails para `/search-face` es **decisión local** de este panel (el canónico describe el sistema completo).
- Las 5 bandas de similitud (Muy alta ≥98% … Muy baja <70%) son **locales** — coordinadas con el Go service.
- Los mensajes user-friendly de errores del Go service son **locales** — replicados desde el Go service para mantener consistencia.
- La regla "ocultar capa tecnológica" es **heredada** del AGENTS.md canónico.
