# AGENTS.md — Admin Panel (`app-socios-estadio-admin`)

> Lee primero `README.md` (quickstart Docker :5175, estructura, endpoints que consume).
> Detalle profundo para sesiones de AI: `CLAUDE.md` (reglas, decisiones cerradas, gotchas, tier de riesgo).
> Contexto polyrepo: [`app-socios-estadio-docs/AGENTS.md`](https://github.com/arnigon-holdings/app-socios-estadio-docs/blob/main/AGENTS.md).

## Qué es este repo

SPA React 19 usado por **admins y operadores del club** para gestionar el sistema de socios del estadio. Panel hermano de `app-socios-estadio-frontend` (el registro público del socio); mismo backend Rails, clientes distintos.

## Responsabilidades

- **Login admin** contra backend Rails (`/api/v1/admin/login`, cookie httpOnly).
- **CRUD de socios** (`/api/v1/admin/users/*`), equipos, point actions.
- **Ledger de puntos y audit logs** (solo lectura).
- **Face-search** (página flagship): upload de foto → **llamada directa al Go service** `/search-face` (bypass Rails) → grid de matches con thumbnails.

## Stack y comandos

- React 19.2 + Vite 8 + React Router 7 · Tailwind v4 + shadcn/ui · TanStack Query 5 · react-hook-form + Zod · Playwright (E2E).
- `npm run dev` (:5175) · `npm run build` (tsc -b && vite build) · `npm run lint` (ESLint).
- Proxy `/api` → `http://localhost:3001` (Rails dev). El proxy **NO** aplica a `/search-face` (cliente llama directo al Go service).

## Env vars

`VITE_API_BASE_URL` (sí), `VITE_FACE_SEARCH_URL` (sí, dev `http://localhost:8081`),
`VITE_FACE_SEARCH_TOKEN` (sí — si vacío, face-search falla), `VITE_ADMIN_EMAIL/PASSWORD` (solo dev, placeholders).

## Decisiones cerradas (ver CLAUDE.md para el detalle)

- Face-search **bypassa Rails** (latencia Rekognition aislada del API principal).
- Cards en vez de tablas para socios; 5 bandas de similitud en face-search.
- Regla UX: **ocultar la capa tecnológica** — el admin nunca ve "AWS/Rekognition" en la UI.

## Docs-sync

Al commitear código, corre la skill [`docs-sync`](.opencode/skills/docs-sync/SKILL.md).
Hook instalado vía `scripts/install-hooks.sh`.
