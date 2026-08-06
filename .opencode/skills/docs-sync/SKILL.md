---
name: docs-sync
description: >
  Mantiene la documentación del repo al día después de commits. Se activa tras
  cada commit de código (git hook post-commit) o cuando se pide actualizar docs.
  Revisa el diff del commit y actualiza la documentación si quedó desactualizada.
  Solo documentar lo que realmente cambió; sin inventar features, endpoints o
  decisiones que no existen en el código.
---

# Docs Sync — Admin Panel

## Cuándo usar

- Después de un commit que tocó código fuente (no solo `.md`): el hook
  `post-commit` corre `opencode run` con esta skill automáticamente.
- Cuando un humano pide "actualiza la documentación" o "documenta este cambio".

## Qué actualizar (en orden)

1. **`README.md`** — quickstart Docker, estructura, rutas.
2. **`ARCHITECTURE.md`** / **`SPEC.md`** (raíz) — estructura, flujos auth y face-search.
3. **`AGENTS.md`** — secciones que referencian el código (env vars, decisiones cerradas).
4. **`docs/API_ENDPOINTS.md`** y **`docs/ARCHITECTURE.md`** — endpoints que consume y detalle.

## Cómo

1. `git show --stat HEAD` y `git diff HEAD^ HEAD` para ver exactamente qué cambió.
2. Comparar contra la doc actual; actualizar **solo** lo que el diff toca.
3. Mantener estilo existente (tablas, títulos, español neutro, sin emojis).
4. No borrar secciones con decisiones históricas; marcarlas "obsoleto" si aplica.
5. Verificar: no romper links internos (README ↔ ARCHITECTURE ↔ AGENTS).

## Reglas

- Documentar lo que existe, no lo planeado.
- No refactorizar docs por gusto: solo lo que el diff toca.
- Los cambios de docs NO se commitean automáticamente: quedan en el working tree
  para que el humano los revise y commitee.
