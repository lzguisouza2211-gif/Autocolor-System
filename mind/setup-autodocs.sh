#!/bin/bash
# Instala o hook AutoDocs no repositório atual.
# Execute uma vez após clonar o projeto: bash mind/setup-autodocs.sh

HOOK_TARGET="$(git rev-parse --show-toplevel)/.git/hooks/post-commit"

cp "$(dirname "$0")/post-commit.sh" "$HOOK_TARGET"
chmod +x "$HOOK_TARGET"

echo "[AutoDocs] Hook instalado em $HOOK_TARGET"
echo "[AutoDocs] Pronto. A documentação será gerada automaticamente após cada commit."
