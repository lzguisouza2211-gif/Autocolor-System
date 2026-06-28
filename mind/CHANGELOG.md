# Changelog — AutoColor System

Registro cronológico de todas as implementações, correções e melhorias do projeto.

---



## 28/06/2026

**Commit:** feat: sistema AutoDocs de documentação automática via Claude AI

**Implementações:**
- Criado `mind/generate-docs.py`: script Python executado pelo hook `post-commit` do git que analisa cada commit e atualiza automaticamente cinco arquivos de documentação (`CHANGELOG.md`, `learning-log.md`, `architecture.md`, `linkedin-ideas.md`, `project-map.md`) via API do Claude (Haiku por padrão)
- O script coleta hash, mensagem e diff do commit, limita o diff a 12.000 caracteres para controlar custo de tokens, e envia tudo ao modelo com um prompt estruturado que retorna JSON determinístico
- Cada seção possui um flag `should_update_*` para evitar atualizações desnecessárias quando não há conteúdo relevante
- Removido `.env` do rastreamento git; adicionado `.env.example` como template seguro com as variáveis necessárias
- `.gitignore` atualizado com regra `!.env.example` para permitir o template mesmo com o glob `*.env`

**Arquivos:**
- `mind/generate-docs.py` (novo)
- `mind/CHANGELOG.md` (novo)
- `mind/learning-log.md` (novo)
- `mind/architecture.md` (novo)
- `mind/linkedin-ideas.md` (novo)
- `mind/project-map.md` (novo)
- `.env` (removido do git)
- `.env.example` (novo)
- `.gitignore` (atualizado)
