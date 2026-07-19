# `admin/` — Reglas del agente

> Lee primero `README.md` (este archivo en su raíz define qué es el panel).
> Este documento define **cómo debe comportarse un agente** al trabajar aquí.
>
> **Contexto cross-cutting**: este panel hereda reglas del polyrepo definidas en
> [`arnigon-holdings/app-socios-estadio-docs/AGENTS.md`](https://github.com/arnigon-holdings/app-socios-estadio-docs/blob/main/AGENTS.md)
> (calidad, seguridad, ocultar capa tecnológica, harness engineering, etc.).

## 1. Rol en el polyrepo

SPA React 19 usado por **admins y operadores del club** para gestionar el sistema de socios del estadio. Responsabilidades:

- **Login admin** contra el backend Rails (`/api/v1/admin/login`).
- **CRUD de socios** (list, detail, edit, delete) — consume `/api/v1/admin/users/*`.
- **CRUD de equipos, point actions** — resources secundarios del sistema.
- **Visualización de transacciones de puntos y audit logs** — solo lectura.
- **Face-search** (página flagship): upload de foto → llamada directa al Go service `/search-face` → grid de matches con thumbnails.

**Bypass del backend Rails para face-search**: el admin llama **directo** al Go service (`VITE_FACE_SEARCH_URL`) con un Bearer token compartido, **sin pasar por el backend Rails**. Razón: aislar la latencia de Rekognition (~200-500ms) del API principal y permitir escalar el face-search independientemente.

## 2. Stack y comandos

- **Lenguaje**: TypeScript 6.0 (devDep).
- **Framework**: React 19.2, Vite 8, React Router 7.
- **UI**: Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui 4.11 (radix-ui 1.6), `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`.
- **Data**: `@tanstack/react-query` 5.101.
- **Forms**: `react-hook-form` 7.80 + `@hookform/resolvers` 5.4 + `zod` 4.4.
- **Fonts**: `@fontsource-variable/ibm-plex-sans`, `@fontsource-variable/oxanium`.
- **Test**: `@playwright/test` 1.61.
- **Lint**: ESLint 10, `typescript-eslint` 8.59.

Comandos:

```bash
npm install           # Instalar deps
npm run dev           # Vite dev server (puerto 5174)
npm run build         # tsc -b && vite build → dist/
npm run preview       # Serve dist/
npm run lint          # ESLint
npm run lint          # ESLint
```

Dev port: **5175** (`vite.config.ts`). Proxy `/api` → `http://localhost:3001` (Rails dev, puerto 3001). El proxy **NO aplica** a `/search-face` (el cliente llama directo al Go service).

## 3. Variables de entorno

Documentadas en `.env.example` (todas con prefijo `VITE_`, build-time, expuestas al bundle).

| Var | Requerida | Default dev | Notas |
|---|---|---|---|
| `VITE_API_BASE_URL` | sí | `http://localhost:3001` | URL del backend Rails |
| `VITE_FACE_SEARCH_URL` | sí | `http://localhost:8081` | URL del Go service |
| `VITE_FACE_SEARCH_TOKEN` | sí | — | Bearer compartido con Go service. Si vacío → `/face-search` lanza error (`src/lib/api.ts:50`) |
| `VITE_ADMIN_EMAIL` | no | — | Placeholder del input email en login |
| `VITE_ADMIN_PASSWORD` | no | — | **NO se usa en runtime** — solo dev |

Archivos:

- `.env.example` (tracked) — template documentado.
- `.env.development` (tracked, sin secretos reales) — defaults dev.
- `.env.local` (gitignored) — override local.
- `.env.production` (gitignored) — build de prod (deploy lo setea).

Vite lee `.env`, `.env.local`, `.env.development`, `.env.production`. Las variables requieren prefijo `VITE_` para estar accesibles vía `import.meta.env.VITE_*`.

## 4. Convenciones de código

- **TypeScript estricto**, sin `any` innecesario.
- **React 19**: usar features modernas (Suspense, useTransition) cuando aporten.
- **Componentes funcionales con hooks**. Sin class components.
- **shadcn/ui primitives** para UI base (Button, Card, Table, Skeleton, etc.).
- **Tailwind v4**: utility-first; usar `cn()` de `src/lib/utils.ts` para merge de clases.
- **TanStack Query** para todos los fetches de lista/detalle. `useMutation` + `invalidateQueries` para mutaciones.
- **Forms** con `react-hook-form` + Zod schemas (`@hookform/resolvers`).
- **Sin emojis** en código, commits, ni UI.
- **Idioma de UI**: español (consistente con el resto del sistema).

## 5. Boundaries

**Hace este panel:**

- Login admin + JWT en cookie httpOnly.
- CRUD de socios, equipos, point actions.
- Visualización de point transactions y audit logs.
- Face-search con upload + grid de matches.

**NO hace este panel:**

- **No indexa caras** — lo hace el backend Rails.
- **No hace FaceLiveness** — vive en el frontend público.
- **No accede directamente a Postgres, S3 o Rekognition** — todo va por HTTP.
- **No tiene lógica de negocio pesada** — es capa de presentación.

## 6. Decisiones arquitectónicas cerradas

No reabrir sin discusión:

- **React Router v7 con rutas protegidas** (`ProtectedRoute`, `PublicRoute`).
- **TanStack Query** para server state. No usar Redux/Zustand para data de servidor.
- **Vite proxy `/api` → Rails dev** (puerto 3000). No aplica a `/search-face`.
- **`api.searchFace<T>(imageBase64)`** bypassa Rails y llama directo al Go service. **Decisión arquitectónica cerrada** — no revertir.
- **Cards de match** (no tablas) en `/face-search`. Decisión de UX basada en feedback explícito del usuario.
- **Banda de similitud + porcentaje**: 5 bandas (Muy alta ≥98%, Alta ≥95%, Media ≥85%, Baja ≥70%, Muy baja <70%) + porcentaje entero 0-100.
- **Skeletons** con componente `<Skeleton>` de shadcn. Estructura del skeleton imita la card real (face 128px + labels).

## 7. Reglas UX

Reglas **no negociables** heredadas del AGENTS.md canónico:

- **Ocultar la capa tecnológica** en strings user-facing. **NO decir** "AWS", "Rekognition", "S3", "Cloud Storage", "Lambda", "Vite", "React", "TanStack Query", "shadcn" en UI.
  - Ej correcto: "Buscando coincidencias…", "Sin caras indexadas".
  - Ej incorrecto: "Llamando a Rekognition…", "Error de AWS".
- Excepción: tipo interno `rekognition_face_id` (campo de DB, no se muestra en UI).
- Mensajes de error en español, tono neutro, accionable.
- Formato de RUT sin puntos ni guión en inputs (validación en backend).

## 8. Gotchas / "must not break"

- **`VITE_FACE_SEARCH_TOKEN` se expone al bundle**. Es un secret compartido Go ↔ admin. En prod rotar regularmente.
- **Cambiar cualquier `VITE_*` requiere restart del dev server** o rebuild para prod.
- **`/face-search` requiere login**. Si redirige a `/login`, normal. La página **nunca** debe exponer resultados sin auth.
- **El Vite proxy (`/api`) reenvía a `VITE_API_BASE_URL`**. Para `/search-face` no hay proxy — el cliente llama directo a `VITE_FACE_SEARCH_URL`.
- **CORS**: el Go service valida `CORS_ORIGINS` env. Para dev debe incluir `http://localhost:5174` (frontend) y `http://localhost:5175` (admin).
- **Las URLs presigned de S3 expiran en 1h**. Si el admin deja la página `/face-search` abierta, las imágenes se rompen al refrescar — la búsqueda las regenera al re-correr el query.
- **Si Rekognition no encuentra el face en la DB** (huérfano tras delete de user), `photo_url` viene vacío y se muestra placeholder "Sin imagen".
- **`VITE_ADMIN_PASSWORD`** es solo dev placeholder. En prod eliminar del `.env.local` (de hecho no se usa en runtime, solo `VITE_ADMIN_EMAIL` es referenciado).
- **`VITE_ADMIN_EMAIL`** se usa **solo como placeholder** en el form de login. La auth real la hace el backend contra la tabla `admins`.

## 9. Documentación del proyecto

Fuente de verdad transversal:
[`arnigon-holdings/app-socios-estadio-docs`](https://github.com/arnigon-holdings/app-socios-estadio-docs) — `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `CHECKLIST.md`, `INFRASTRUCTURE.md`, `ENVIRONMENT.md`.

Repos hermanos relevantes:

- [`arnigon-holdings/app-socios-estadio-backend`](https://github.com/arnigon-holdings/app-socios-estadio-backend) — provee `/api/v1/admin/*`.
- [`arnigon-holdings/app-socios-estadio-face-search`](https://github.com/arnigon-holdings/app-socios-estadio-face-search) — Go service al que este panel llama directo para face-search.
- [`arnigon-holdings/app-socios-estadio-frontend`](https://github.com/arnigon-holdings/app-socios-estadio-frontend) — hermano público (socios).
- [`arnigon-holdings/app-socios-estadio-infra`](https://github.com/arnigon-holdings/app-socios-estadio-infra) — Terraform + deploy.

## 10. Checklist pre-commit

- [ ] `npm run lint` exit 0.
- [ ] `npm run build` exit 0 (TypeScript + Vite).
- [ ] Si tocaste UI: verificar manualmente que no se filtra terminología AWS/Rekognition/S3 en strings user-facing.
- [ ] Si agregaste env vars: actualizar `.env.example` + `.env.development`.
- [ ] No hay secretos reales en el diff: `git grep -nE "AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}"` debe estar vacío.
- [ ] Si tocaste rutas: actualizar la tabla de rutas en `README.md` y `SPEC.md`.
- [ ] Si tocaste `src/lib/api.ts`: verificar que `searchFace` sigue funcionando (requiere `VITE_FACE_SEARCH_TOKEN`).

## 11. Tier de riesgo

**External-write (medio)** — escribe a `/api/v1/admin/*` del backend Rails (CRUD de socios, teams, etc.) y a `/search-face` del Go service.

Reglas:

- Cambios al cliente API (`src/lib/api.ts`): **breaking change potencial** para todas las páginas. Coordinar con backend si cambia el contrato.
- Cambios a `searchFace()`: requieren cambios coordinados en el Go service.
- Cambios a la estructura de UI de `/face-search`: comunicar al equipo de ops (es la página flagship para operadores de seguridad).
- Cambios a rutas o auth flow: requieren rebuild y posible cambio de infraestructura (cookies, CORS).
