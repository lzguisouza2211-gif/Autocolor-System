#!/usr/bin/env python3
"""
AutoDocs — Gerador automático de documentação via Claude AI.
Executado pelo hook post-commit do git.
"""

import subprocess
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

MODEL = os.environ.get("AUTODOCS_MODEL", "claude-haiku-4-5-20251001")
MAX_DIFF_CHARS = 12000  # Limita tamanho do diff para controlar custo de tokens

MIND_DIR = Path(__file__).parent
PROJECT_ROOT = MIND_DIR.parent

FILES = {
    "changelog":   MIND_DIR / "CHANGELOG.md",
    "learning":    MIND_DIR / "learning-log.md",
    "architecture": MIND_DIR / "architecture.md",
    "linkedin":    MIND_DIR / "linkedin-ideas.md",
    "map":         MIND_DIR / "project-map.md",
}


# ---------------------------------------------------------------------------
# Helpers git
# ---------------------------------------------------------------------------

def run_git(*args: str, fallback: str = "") -> str:
    try:
        return subprocess.check_output(
            ["git", *args],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8").strip()
    except subprocess.CalledProcessError:
        return fallback


def is_first_commit() -> bool:
    return run_git("rev-parse", "--verify", "HEAD~1", fallback="") == ""


def get_git_info() -> dict:
    commit_hash = run_git("rev-parse", "--short", "HEAD")
    commit_message = run_git("log", "-1", "--pretty=%B")

    if is_first_commit():
        changed_files = run_git("show", "--name-only", "--format=", "HEAD")
        diff = run_git("show", "HEAD", "--",
                       "*.ts", "*.tsx", "*.js", "*.jsx", "*.py", "*.css")
    else:
        changed_files = run_git("diff", "--name-only", "HEAD~1", "HEAD")
        diff = run_git("diff", "HEAD~1", "HEAD", "--",
                       "*.ts", "*.tsx", "*.js", "*.jsx", "*.py", "*.css")

    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n...[diff truncado por ser muito grande]..."

    return {
        "hash": commit_hash,
        "message": commit_message,
        "files": changed_files,
        "diff": diff,
    }


# ---------------------------------------------------------------------------
# Helpers de arquivo
# ---------------------------------------------------------------------------

def read_tail(path: Path, max_chars: int = 2500) -> str:
    if not path.exists():
        return ""
    content = path.read_text(encoding="utf-8")
    if len(content) > max_chars:
        return "...[conteúdo anterior omitido]...\n" + content[-max_chars:]
    return content


def append_to_file(path: Path, new_content: str) -> None:
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    sep = "\n\n" if existing.strip() else ""
    path.write_text(existing.rstrip() + sep + "\n\n" + new_content.strip() + "\n",
                    encoding="utf-8")


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

def build_prompt(git_info: dict, current_map: str) -> str:
    today = datetime.now().strftime("%d/%m/%Y")

    return f"""Você é um assistente de documentação técnica. Analise o commit abaixo e gere documentação para um sistema de PDV chamado AutoColor System.

## Informações do Commit
- **Hash:** {git_info['hash']}
- **Data:** {today}
- **Mensagem:** {git_info['message']}

## Arquivos Alterados
{git_info['files'] or '(não identificados)'}

## Diff do Código
```
{git_info['diff'] or '(diff não disponível)'}
```

## Mapa Atual do Projeto (contexto)
{current_map or '(sem mapa atual)'}

---

Retorne APENAS um objeto JSON válido (sem texto antes ou depois, sem markdown), com estas chaves exatas:

{{
  "should_update_changelog": true,
  "changelog_entry": "## {today}\\n\\n**Commit:** mensagem\\n\\n**Implementações:**\\n- item\\n\\n**Arquivos:**\\n- arquivo",

  "should_update_learning": true,
  "learning_entry": "## {today}\\n\\n**Aprendizados:**\\n- aprendizado genuíno",

  "should_update_architecture": false,
  "architecture_entry": "",

  "should_update_linkedin": true,
  "linkedin_entry": "## Ideia — {today}\\n\\n**Título:** ...\\n\\n**O problema:** ...\\n\\n**Como resolvi:** ...\\n\\n**O aprendizado:** ...\\n\\n**Dica para outros devs:** ...",

  "project_map": "# AutoColor System — Mapa do Projeto\\n\\n(mapa completo atualizado)"
}}

**Regras obrigatórias:**
- Todo conteúdo em português do Brasil
- `changelog_entry`: descreva concretamente o que foi implementado com base no diff, não apenas repita a mensagem do commit
- `learning_entry`: apenas aprendizados genuínos e não óbvios. Se não houver nada novo para aprender, use `should_update_learning: false`
- `architecture_entry`: só preencha se houver uma decisão arquitetural real (nova biblioteca significativa, mudança de padrão, decisão de design). Caso contrário, `should_update_architecture: false`
- `linkedin_entry`: texto natural e educativo, sem marketing. Mostre o problema real e como foi resolvido
- `project_map`: retorne o mapa COMPLETO e atualizado do projeto, incorporando as novas funcionalidades encontradas no diff. Mantenha o formato Markdown com seções organizadas
- Seja conciso mas informativo. Evite texto desnecessário
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[AutoDocs] ANTHROPIC_API_KEY não configurada — pulando documentação.")
        sys.exit(0)

    try:
        import anthropic
    except ImportError:
        print("[AutoDocs] Pacote 'anthropic' não instalado. Execute: pip install anthropic")
        sys.exit(0)

    git_info = get_git_info()
    if not git_info["message"]:
        print("[AutoDocs] Não foi possível ler o commit — pulando.")
        sys.exit(0)

    print(f"[AutoDocs] Analisando commit {git_info['hash']}: {git_info['message'][:60]}...")

    current_map = read_tail(FILES["map"])
    prompt = build_prompt(git_info, current_map)

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=MODEL,
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
    except Exception as exc:
        print(f"[AutoDocs] Erro na API: {exc}")
        sys.exit(0)

    # Remove bloco markdown caso o modelo insista em colocar
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        docs = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"[AutoDocs] Resposta não é JSON válido: {exc}")
        sys.exit(0)

    updated: list[str] = []

    if docs.get("should_update_changelog") and docs.get("changelog_entry"):
        append_to_file(FILES["changelog"], docs["changelog_entry"])
        updated.append("CHANGELOG.md")

    if docs.get("should_update_learning") and docs.get("learning_entry"):
        append_to_file(FILES["learning"], docs["learning_entry"])
        updated.append("learning-log.md")

    if docs.get("should_update_architecture") and docs.get("architecture_entry"):
        append_to_file(FILES["architecture"], docs["architecture_entry"])
        updated.append("architecture.md")

    if docs.get("should_update_linkedin") and docs.get("linkedin_entry"):
        append_to_file(FILES["linkedin"], docs["linkedin_entry"])
        updated.append("linkedin-ideas.md")

    if docs.get("project_map"):
        FILES["map"].write_text(docs["project_map"].strip() + "\n", encoding="utf-8")
        updated.append("project-map.md")

    if updated:
        print(f"[AutoDocs] Documentação atualizada: {', '.join(updated)}")
    else:
        print("[AutoDocs] Nenhuma atualização necessária para este commit.")


if __name__ == "__main__":
    main()
