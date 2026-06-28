#!/bin/bash
# AutoDocs — hook post-commit
# Gera documentação automática após cada commit relevante.

PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Garante que o PATH inclui o diretório do claude CLI (NVM, etc.)
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$HOME/.local/bin:/usr/local/bin:$PATH"

# ── Guard de recursão ──────────────────────────────────────────────────────
# Pula se o commit foi gerado pelo próprio AutoDocs (evita loop infinito).
COMMIT_MSG="$(git log -1 --pretty=%B)"
if echo "$COMMIT_MSG" | grep -qF "docs: auto-update documentation"; then
    exit 0
fi

# ── Gera documentação ──────────────────────────────────────────────────────
python3 "$PROJECT_ROOT/mind/generate-docs.py"
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "[AutoDocs] Script encerrou com erro $STATUS — commit salvo normalmente."
    exit 0
fi

# ── Commita as atualizações da pasta mind/ ─────────────────────────────────
MIND_CHANGES="$(git status --porcelain "$PROJECT_ROOT/mind/" 2>/dev/null)"
if [ -n "$MIND_CHANGES" ]; then
    git add "$PROJECT_ROOT/mind/"
    git commit -m "docs: auto-update documentation [skip ci]"
    echo "[AutoDocs] Documentação comitada automaticamente."
fi
