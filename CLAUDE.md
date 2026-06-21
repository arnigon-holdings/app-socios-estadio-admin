# CLAUDE.md — admin_panel

## Project Overview

React frontend para panel de administración de App Socios Estadio.
- **Stack**: React 19, Vite 6, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Router v7
- **Puerto dev**: 5174 (ver `vite.config.ts`)
- **Proxy API**: `/api` → `http://localhost:3000`

## Environment Variables

| Variable | Dev | Production (GCP) |
|----------|-----|------------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | `https://api.appservicios.cl` |

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
POST /api/admin/login
DELETE /api/admin/logout
GET  /api/admin/dashboard
```

### Users
```
GET  /api/admin/users
GET  /api/admin/users/:id
PATCH /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Teams
```
GET    /api/admin/teams
POST   /api/admin/teams
PATCH  /api/admin/teams/:id
DELETE /api/admin/teams/:id
```

### Point Actions
```
GET    /api/admin/point_actions
POST   /api/admin/point_actions
PATCH  /api/admin/point_actions/:id
DELETE /api/admin/point_actions/:id
```

### Transactions
```
GET /api/admin/point_transactions
```

### Audit Logs
```
GET /api/admin/audit_logs
```

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
│   └── audit-logs.tsx
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

## Credenciales Admin (desarrollo)

```
Email: admin@appperfil.cl
Password: Admin123!
```
