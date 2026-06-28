# AutoColor System — Mapa do Projeto

## Visão Geral

Sistema de PDV (Ponto de Venda) desenvolvido em React + TypeScript com backend Supabase. Voltado para uma loja de tintas automotivas (AutoColor), com funcionalidades de vendas, gestão de produtos, clientes, financeiro e relatórios.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Ícones | Iconify + React Icons |
| Roteamento | React Router DOM v6 |
| PDF | jsPDF + jsPDF-AutoTable |
| Código de barras | @zxing/library |
| Impressão | Servidor local via fetch |

---

## Estrutura de Arquivos

```
src/
├── contexts/
│   ├── AuthContext.tsx         # Autenticação Supabase
│   └── ProductsContext.tsx     # Cache global de produtos (realtime)
├── components/
│   ├── Login.tsx
│   ├── Header.tsx              # Alertas de estoque (via ProductsContext)
│   ├── MobileMenu.tsx
│   ├── Dashboard.tsx
│   ├── PDV.tsx                 # Ponto de venda (via ProductsContext)
│   ├── ProductsTable.tsx       # CRUD de produtos (via ProductsContext)
│   ├── ProductForm.tsx         # Formulário de produto (via ProductsContext)
│   ├── SalesHistory.tsx        # Histórico + edição de vendas
│   ├── Customers.tsx           # Gestão de clientes
│   ├── Financial.tsx           # Módulo financeiro mensal
│   ├── CreditSales.tsx         # Vendas a prazo
│   ├── BarcodeScanner.tsx      # Leitor de código de barras
│   └── Reports.tsx             # Relatórios PDF por cliente
├── AppRoutes.tsx               # Roteamento + providers (Auth > Products > Router)
├── supabase.ts                 # Cliente Supabase
└── main.tsx

mind/                           # Sistema AutoDocs
├── generate-docs.py            # Script chamado pelo hook git
├── setup-autodocs.sh           # Reinstala o hook ao clonar o repo
├── CHANGELOG.md                # Histórico técnico por commit
├── learning-log.md             # Aprendizados genuínos
├── architecture.md             # Decisões arquiteturais
├── linkedin-ideas.md           # Rascunhos de posts
└── project-map.md              # Este arquivo — mapa do projeto
```

---

## Arquitetura de Dados

### Contextos

#### AuthContext
- Gerencia sessão do usuário via Supabase Auth
- Expõe: `user`, `loading`
- Instanciado na raiz da aplicação

#### ProductsContext *(adicionado em 28/06/2026)*
- Cache global da tabela `products` com subscription realtime
- Uma única query ao Supabase, compartilhada por todos os componentes
- Expõe:
  - `products[]` — lista completa de produtos ativos
  - `lowStockProducts[]` — produtos com estoque ≤ threshold (derivado)
  - `categories[]` — categorias únicas (derivado)
  - `brands[]` — marcas únicas (derivado)
  - `loading` — estado de carregamento
  - `refetch()` — força re-busca manual
- Hierarquia: `AuthProvider > ProductsProvider > BrowserRouter`

### Regra arquitetural
Todo componente que precisar de dados da tabela `products` deve consumir `useProducts()`. Queries diretas ao Supabase para a tabela `products` fora do contexto são consideradas um smell arquitetural.

---

## Fluxo Principal

```
Login → Dashboard → PDV → [Seleciona Produtos] → [Seleciona Cliente] → Finaliza Venda → Imprime Recibo
                        ↓
              Histórico de Vendas → Imprime por Venda / Edita Venda
```

---

## Funcionalidades

### Implementadas

- [x] Login com autenticação Supabase
- [x] PDV com carrinho de compras
- [x] Seleção de cliente no PDV
- [x] Leitor de código de barras
- [x] Histórico de vendas com edição
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
- [x] Guard de recursão via mensagem do commit
- [x] Script de setup `mind/setup-autodocs.sh` para reinstalação do hook após clone
- [x] Cache global de produtos via ProductsContext (elimina N+1 entre componentes)
- [x] Queries paralelas no histórico de vendas (3 queries fixas vs. N+1 por venda)

---

## AutoDocs — Sistema de Documentação Automática

### Como funciona

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
- **Ao clonar o repositório:** executar `bash mind/setup-autodocs.sh` para reinstalar o hook

### Guard de Recursão

O hook verifica a **mensagem do commit atual** para detectar ciclos. Commits automáticos do AutoDocs incluem `[skip ci]` ou `auto-update documentation`, o que dispara o guard e interrompe a execução.

---

## Tabelas Supabase

| Tabela | Descrição |
|---|---|
| `products` | Produtos com soft delete (`deleted_at`) |
| `sales` | Cabeçalho das vendas |
| `sale_items` | Itens de cada venda |
| `customers` | Clientes (CPF/CNPJ, endereço, telefone) |
| `users` | Usuários do sistema |
| `financial_entries` | Lançamentos financeiros mensais |

---

## Performance

### Antes (28/06/2026)
- 5 componentes faziam queries independentes à tabela `products` a cada navegação
- SalesHistory fazia 1 query por venda para buscar usuário e cliente (N+1)

### Depois
- 1 query global de produtos no boot, compartilhada via Context + Realtime
- SalesHistory: 3 queries paralelas fixas, independente do volume de vendas
