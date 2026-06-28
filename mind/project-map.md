# AutoColor System — Mapa do Projeto

> Última atualização: 28/06/2026

---

## Visão Geral

Sistema de PDV (Ponto de Venda) para a empresa AutoColor. Aplicação web React com back-end Supabase, voltada para gestão de vendas, clientes, produtos e controle financeiro.

---

## Estrutura de Diretórios

```
src/
├── components/        # Componentes principais da UI
│   ├── PDV.tsx        # Tela de ponto de venda
│   ├── ProductForm.tsx
│   ├── ProductsTable.tsx
│   ├── SalesHistory.tsx
│   ├── Header.tsx
│   └── ...
├── contexts/
│   └── ProductsContext.tsx  # Estado global de produtos
├── AppRoutes.tsx      # Definição de rotas
└── ...

mind/                  # Sistema AutoDocs
├── generate-docs.py   # Script principal (Python 3)
├── post-commit.sh     # Hook git versionado (backup)
├── setup-autodocs.sh  # Script de instalação do hook
├── CHANGELOG.md       # Histórico técnico por commit
├── learning-log.md    # Aprendizados genuínos
├── architecture.md    # Decisões arquiteturais
├── linkedin-ideas.md  # Rascunhos de posts
└── project-map.md     # Este arquivo — mapa do projeto
```

---

## Back-end / Infra

- **Supabase** — banco de dados PostgreSQL + autenticação + real-time
- **print-server.cjs** — servidor Express local para impressão térmica ESC/POS
- **Vercel** — deploy do front-end

---

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Roteamento | React Router v7 |
| Build | Vite |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| PDF | jsPDF |
| Impressão | ESC/POS + Express |
| Código de barras | QuaggaJS + ZXing |
| Ícones | Iconify + React Icons |
| Deploy | Vercel |

---

## Sistema AutoDocs

Pipeline de documentação automática ativado por hook `post-commit` do git.

### Estrutura

```
mind/
├── generate-docs.py   # Script principal (Python 3)
├── post-commit.sh     # Cópia versionada do hook git
├── setup-autodocs.sh  # Reinstala o hook ao clonar o repo
├── CHANGELOG.md       # Histórico técnico por commit
├── learning-log.md    # Aprendizados genuínos
├── architecture.md    # Decisões arquiteturais
├── linkedin-ideas.md  # Rascunhos de posts
└── project-map.md     # Este arquivo — mapa do projeto
```

### Fluxo

```
git commit
  → hook post-commit (.git/hooks/post-commit)
  → guard: lê mensagem do commit (git log -1 --format=%s)
      → se contém [skip ci] ou auto-update documentation → aborta (evita loop)
  → generate-docs.py
  → claude CLI via subprocess (JSON estruturado)
  → atualização seletiva dos 5 arquivos em mind/
  → git commit automático com [skip ci]
```

### Configuração e Instalação

- **Sem `ANTHROPIC_API_KEY`** — autenticação delegada ao Claude Code (CLI)
- `claude` CLI deve estar instalado e autenticado na máquina
- `find_claude()` busca o binário via `shutil.which()` e em candidatos fixos (NVM, `~/.local/bin`, `/usr/local/bin`)
- Falha silenciosa: sem o CLI, o commit prossegue normalmente
- **Ao clonar o repositório:** executar `bash mind/setup-autodocs.sh` para reinstalar o hook em `.git/hooks/post-commit`

### Guard de Recursão

O hook verifica a **mensagem do commit atual** (não a lista de arquivos) para detectar se está em um ciclo recursivo. Commits automáticos do AutoDocs incluem `[skip ci]` ou `auto-update documentation` na mensagem, o que dispara o guard e interrompe a execução.

---

## Funcionalidades

### Implementadas

- [x] Login com autenticação Supabase
- [x] PDV com carrinho de compras
- [x] Seleção de cliente no PDV
- [x] Leitor de código de barras
- [x] Histórico de vendas
- [x] Impressão de recibo via servidor local
- [x] Notificação de impressão enviada
- [x] Impressão por venda individual (vendas a prazo)
- [x] Gestão de produtos (CRUD)
- [x] Gestão de clientes
- [x] Relatório PDF por cliente (produtos por venda)
- [x] Módulo financeiro mensal
- [x] Dashboard com métricas
- [x] Controle de vendas a prazo
- [x] Layout responsivo com menu mobile
- [x] Documentação automática via AutoDocs (hook post-commit + Claude CLI)
- [x] Guard de recursão via mensagem do commit (fix: evita autobloqueio do hook)
- [x] Script de setup `mind/setup-autodocs.sh` para reinstalação do hook após clone

---

## Fluxo Principal

```
Login → Dashboard → PDV → [Seleciona Produtos] → [Seleciona Cliente] → Finaliza Venda → Imprime Recibo
                        ↓
              Histórico de Vendas → Imprime por Venda
```
