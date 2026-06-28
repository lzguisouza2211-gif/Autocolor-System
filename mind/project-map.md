# AutoColor System — Mapa do Projeto

## Visão Geral

Sistema de Ponto de Venda (PDV) para autopeças/tintas (AutoColor). Interface web React com back-end Supabase, suporte a impressão térmica local e geração de relatórios PDF.

---

## Front-end

### Páginas / Rotas

- `/login` — autenticação
- `/` — Dashboard com métricas
- `/pdv` — Ponto de Venda
- `/products` — Gestão de produtos
- `/clients` — Gestão de clientes
- `/sales-history` — Histórico de vendas
- `/financial` — Módulo financeiro mensal

### Componentes Principais

- `PDV.tsx` — carrinho, leitor de código de barras, seleção de cliente, finalização de venda
- `ProductsTable.tsx` — listagem e CRUD de produtos
- `ProductForm.tsx` — formulário de produto
- `SalesHistory.tsx` — histórico com impressão por venda individual
- `Header.tsx` + `Sidebar.tsx` + `MobileMenu.tsx` — layout

### Contextos

- `AuthContext.tsx` — autenticação de usuário
- `ProductsContext.tsx` — estado global de produtos

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
├── CHANGELOG.md       # Histórico técnico por commit
├── learning-log.md    # Aprendizados genuínos
├── architecture.md    # Decisões arquiteturais
├── linkedin-ideas.md  # Rascunhos de posts
└── project-map.md     # Este arquivo — mapa do projeto
```

### Fluxo

```
git commit
  → hook post-commit
  → generate-docs.py
  → claude CLI via subprocess (JSON estruturado)
  → atualização seletiva dos 5 arquivos em mind/
```

### Configuração

- **Sem `ANTHROPIC_API_KEY`** — autenticação delegada ao Claude Code (CLI)
- `claude` CLI deve estar instalado e autenticado na máquina
- `find_claude()` busca o binário via `shutil.which()` e em candidatos fixos (NVM, `~/.local/bin`, `/usr/local/bin`)
- Falha silenciosa: sem o CLI, o commit prossegue normalmente

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

---

## Fluxo Principal

```
Login → Dashboard → PDV → [Seleciona Produtos] → [Seleciona Cliente] → Finaliza Venda → Imprime Recibo
                        ↓
              Histórico de Vendas → Imprime por Venda
```
