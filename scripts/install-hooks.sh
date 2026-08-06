#!/usr/bin/env bash
# Instala los git hooks del repo (docs-sync post-commit).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git config core.hooksPath .githooks
chmod +x "$ROOT/.githooks/post-commit"

echo "[install-hooks] core.hooksPath -> .githooks (docs-sync activo)"
echo "[install-hooks] Deshabilitar por commit: DOCS_SYNC_DISABLED=1 git commit ..."
