# CLAUDE.md — admin_panel

> Antes de proponer cualquier cambio, **lee `/AGENTS.md` completo**. Define reglas cross-cutting (calidad, seguridad, capa tecnológica oculta, etc.) que aplican también a este panel.

## Project Overview

React frontend para panel de administración de App Socios Estadio.
- **Stack**: React 19, Vite 6, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Router v7
- **Puerto dev**: 5174 (ver `vite.config.ts`)
- **Proxy API**: `/api` → `http://localhost:3000`

## Environment Variables

| Variable | Dev | Production (GCP) |
|----------|-----|------------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | `https://api.appservicios.cl` |
| `VITE_FACE_SEARCH_URL` | `http://localhost:8081` | `https://face-search-run.hereiam.run` |
| `VITE_FACE_SEARCH_TOKEN` | `dev-face-search-token` | `<secret>` |
| `VITE_ADMIN_EMAIL` | `admin@appperfil.cl` | - |
| `VITE_ADMIN_PASSWORD` | `Admin123!` | - |

Crear `.env.local` para desarrollo y `.env.production` para producción.

## Commands

```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo (puerto 5174)
npm run build        # Build producción
npm run lint         # Lint
npm run preview      # Preview build
```

## API Endpoints Consumidos

### Auth (admin)
```
POST /api/v1/admin/login
DELETE /api/v1/admin/logout
GET  /api/v1/admin/dashboard
```

### Users
```
GET  /api/v1/admin/users
GET  /api/v1/admin/users/:id
PATCH /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
```

### Teams
```
GET    /api/v1/admin/teams
POST   /api/v1/admin/teams
PATCH  /api/v1/admin/teams/:id
DELETE /api/v1/admin/teams/:id
```

### Point Actions
```
GET    /api/v1/admin/point_actions
POST   /api/v1/admin/point_actions
PATCH  /api/v1/admin/point_actions/:id
DELETE /api/v1/admin/point_actions/:id
```

### Transactions
```
GET /api/v1/admin/point_transactions
```

### Audit Logs
```
GET /api/v1/admin/audit_logs
```

### Face Records
```
GET /api/v1/admin/users/:id/face-records
POST /api/v1/admin/users/:id/reindex-face
```

### Face Search (external Go Service)
```
POST http://localhost:8081/search-face
Headers: Authorization: Bearer <FACE_SEARCH_TOKEN>
Body: { "image": "data:image/jpeg;base64,..." }
```

**Auth:** Token compartido via `FACE_SEARCH_TOKEN` env var.

## Arquitectura

```
src/
├── components/
│   ├── ui/           # Componentes shadcn (Button, Card, Table, etc.)
│   └── layout.tsx    # Sidebar con navegación
├── hooks/
│   └── use-auth.tsx  # Context de autenticación JWT
├── lib/
│   ├── api.ts        # Cliente API con fetch
│   └── utils.ts      # cn() utility
├── pages/
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── users.tsx
│   ├── teams.tsx
│   ├── point-actions.tsx
│   ├── transactions.tsx
│   ├── audit-logs.tsx
│   └── face-search.tsx
├── routes/
│   └── index.tsx     # Router con rutas protegidas
└── types/
    └── index.ts      # Tipos TypeScript
```

## GCP Deployment

1. Build: `npm run build`
2. Output en `dist/`
3. Servir estático (Cloud Storage + CDN o Cloud Run)
4. Asegurar que `VITE_API_BASE_URL` apunte al backend en producción
5. El backend debe tener CORS configurado con el dominio del admin_panel

## Credenciales Admin

Configurables via variables de entorno `VITE_ADMIN_EMAIL` y `VITE_ADMIN_PASSWORD`.
