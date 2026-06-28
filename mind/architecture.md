# Architecture — AutoColor System

Registro de decisões arquiteturais importantes tomadas durante o desenvolvimento.

---

## Stack Principal

**Decisão:** React 19 + TypeScript + Supabase como stack principal.

**Motivo:** Curva de aprendizado equilibrada, ecosistema maduro para front-end e backend-as-a-service que elimina a necessidade de gerenciar infraestrutura própria.

**Alternativas consideradas:**
- Next.js (descartado por adicionar complexidade desnecessária para um sistema local/web simples)
- Firebase (substituído pelo Supabase por ser open-source e SQL-based)

**Impacto:** Desenvolvimento ágil com banco de dados PostgreSQL robusto e autenticação pronta.

---

## Servidor de Impressão Local

**Decisão:** Express.js como print-server local (`print-server.cjs`) separado do front-end.

**Motivo:** Impressoras térmicas precisam de acesso nativo ao sistema operacional. O navegador não tem permissão para acessar dispositivos USB/serial diretamente.

**Alternativas consideradas:**
- Web Serial API (ainda experimental e com suporte limitado)
- Impressão via PDF (sem suporte a comandos ESC/POS)

**Impacto:** Sistema de dois processos — Vite dev server + print-server rodando em paralelo.

---



## AutoDocs — Pipeline de Documentação Automática (28/06/2026)

**Decisão:** Adotar um hook `post-commit` do git que invoca `mind/generate-docs.py` após cada commit para manter a documentação do projeto sincronizada com o código sem esforço manual.

**Modelo escolhido:** Claude Haiku (`claude-haiku-4-5-20251001`) via variável de ambiente `AUTODOCS_MODEL`. Haiku foi preferido por custo/velocidade — documentação não exige raciocínio profundo.

**Fluxo:**
```
git commit → post-commit hook → generate-docs.py
  → coleta git info (hash, mensagem, diff truncado em 12k chars)
  → lê tail do project-map.md (contexto)
  → envia prompt ao Claude
  → recebe JSON estruturado
  → atualiza seletivamente os 5 arquivos em mind/
```

**Arquivos gerenciados automaticamente:**
| Arquivo | Propósito |
|---|---|
| `CHANGELOG.md` | Histórico técnico por commit |
| `learning-log.md` | Aprendizados genuínos e não óbvios |
| `architecture.md` | Decisões arquiteturais relevantes |
| `linkedin-ideas.md` | Rascunhos de posts educativos |
| `project-map.md` | Mapa completo e atualizado do projeto |

**Segurança:** Script aborta silenciosamente se `ANTHROPIC_API_KEY` não estiver configurada, não bloqueando o fluxo normal de commits.



## 28/06/2026 — Integração Claude: SDK Python → CLI

**Decisão:** O AutoDocs passou a invocar o `claude` CLI via `subprocess` em vez de usar o SDK Python `anthropic` com `ANTHROPIC_API_KEY`.

**Motivação:** Eliminar o gerenciamento de segredo (`ANTHROPIC_API_KEY`) no ambiente de desenvolvimento local; o Claude Code já mantém autenticação ativa e o CLI a reutiliza de forma transparente.

**Consequências:**
- Dependência de runtime `anthropic` (pip) removida; nenhuma dependência externa nova
- Nova dependência implícita de ambiente: `claude` CLI instalado e autenticado
- Constante `AUTODOCS_MODEL` removida — modelo padrão do CLI é utilizado
- `find_claude()` necessário para resolver PATH restrito no contexto de hooks git
