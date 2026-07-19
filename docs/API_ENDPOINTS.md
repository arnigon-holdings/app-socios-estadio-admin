# API Endpoints

## Base URLs

| Service | URL | Auth |
|---------|-----|------|
| Backend Rails | `VITE_API_BASE_URL` (default `http://localhost:3001`) | Cookie JWT httpOnly |
| Go face-search | `VITE_FACE_SEARCH_URL` (default `http://localhost:8081`) | Bearer token header |

All Rails calls use `credentials: 'include'` to send cookies.

## Authentication

**Rails**: `POST /api/v1/admin/login` → sets `access_token` (httpOnly cookie, JWT, 1h) and `refresh_token` (httpOnly cookie, 30d). All subsequent calls to `/api/v1/admin/*` include the cookie automatically.

**Go service**: `Authorization: Bearer ${VITE_FACE_SEARCH_TOKEN}` header on every request.

---

## Rails Backend — Admin API

### Auth

#### `POST /api/v1/admin/login`
- **Body**: `{ session: { email: string, password: string } }`
- **Response 200**: `{ admin: { id, email, role } }`
- **Response 401**: `{ error: "Credenciales inválidas" }`

#### `DELETE /api/v1/admin/logout`
- **Response 204**: No content

#### `GET /api/v1/admin/dashboard`
- **Response 200**: `{ users_total, users_today, users_this_week, teams_total, teams_active, point_actions_total, point_actions_active }`

---

### Users

#### `GET /api/v1/admin/users`
- **Query**: `page=1&per_page=20&rut=` (rut is optional filter)
- **Response 200**:
  ```json
  { "users": [User], "pagination": { "page", "per_page", "total", "pages" } }
  ```

#### `GET /api/v1/admin/users/:id`
- **Response 200**: `{ "user": User }`

#### `PATCH /api/v1/admin/users/:id`
- **Body**: `{ user: { registration_status: "verified" | "rejected" } }`
- **Response 200**: `{ "user": User }`

#### `DELETE /api/v1/admin/users/:id`
- **Response 204**: Deletes user, face_records, S3 photos, Rekognition faces, cascading point_transactions

#### `GET /api/v1/admin/users/:id/face_records`
- **Response 200**: `{ "face_records": FaceRecord[] }`

---

### Teams

#### `GET /api/v1/admin/teams`
- **Response 200**: `{ "teams": Team[] }`

#### `POST /api/v1/admin/teams`
- **Body**: `{ team: { name: string, short_name?: string } }`
- **Response 201**: `{ "team": Team }`

#### `PATCH /api/v1/admin/teams/:id`
- **Body**: `{ team: { name?: string, short_name?: string, active?: boolean } }`
- **Response 200**: `{ "team": Team }`

#### `DELETE /api/v1/admin/teams/:id`
- **Response 204**

---

### Point Actions

#### `GET /api/v1/admin/point_actions`
- **Response 200**: `{ "point_actions": PointAction[] }`

#### `POST /api/v1/admin/point_actions`
- **Body**: `{ point_action: { action_key: string, description: string, points: number } }`
- **Response 201**: `{ "point_action": PointAction }`

#### `PATCH /api/v1/admin/point_actions/:id`
- **Body**: `{ point_action: { description?: string, points?: number, active?: boolean } }`
- **Response 200**: `{ "point_action": PointAction }`

#### `DELETE /api/v1/admin/point_actions/:id`
- **Response 204**

---

### Point Transactions

#### `GET /api/v1/admin/point_transactions`
- **Query**: `page=1&per_page=20&user_id=&point_action_id=&start_date=&end_date=`
- **Response 200**:
  ```json
  { "point_transactions": [PointTransaction], "pagination": { "page", "per_page", "total", "pages" } }
  ```

---

### Audit Logs

#### `GET /api/v1/admin/audit_logs`
- **Query**: `page=1&per_page=20&admin_id=&action=&resource_type=&start_date=&end_date=`
- **Response 200**:
  ```json
  { "audit_logs": [AuditLog], "pagination": { "page", "per_page", "total", "pages" } }
  ```

---

## Go Face-Search Service

### `POST /search-face`
- **Auth**: `Authorization: Bearer ${VITE_FACE_SEARCH_TOKEN}`
- **Body**: `{ "image": "data:image/jpeg;base64,..." }`
- **Response 200**:
  ```json
  { "matches": [{ "user_id", "rut", "phone", "confidence", "face_id", "photo_url" }], "query_time_ms": number }
  ```
- **Errors**:
  - 400 (no face detected): user-friendly message shown
  - 400 (invalid format): user-friendly message shown
  - 401: redirect to login
  - 413: "Imagen demasiado grande (máx 5MB)"
  - 500: "Error de búsqueda. Reintentar."
  - 503: "Servicio saturado. Reintentar en unos segundos."

---

## Error Format

All Rails errors follow:
```json
{ "error": "string or string[]" }
```

Parsed in `src/lib/api.ts:fetchApi` → thrown as `Error` for TanStack Query catch.

---

## TypeScript Types

Defined in `src/types/index.ts`:

```typescript
User          { id, rut, phone, birth_month, birth_year, teams_ids, photo_url,
                referral_code, registration_status, created_at, consents?,
                metadata?, points_balance?, updated_at?, phone_verified?,
                biometric_status? }

Team          { id, name, short_name, logo_url?, active, created_at }

PointAction   { id, action_key, description, points, active, created_at }

PointTransaction { id, user_id, point_action_id, amount, reference_id?,
                  metadata, created_at, user?, point_action? }

AuditLog      { id, admin_id, action, resource_type, resource_id?,
                metadata, ip, created_at, admin? }

FaceRecord    { id, rekognition_face_id, s3_bucket, s3_key, face_type?,
                indexed_at, photo_url? }

FaceSearchMatch { user_id, rut, phone, confidence, face_id?, photo_url? }

DashboardStats { users_total, users_today, users_this_week, teams_total,
                 teams_active, point_actions_total, point_actions_active }

Pagination    { page, per_page, total, pages }
```
