# AutoColor System — Mapa do Projeto

## Visão Geral

Sistema PDV (Ponto de Venda) web desenvolvido em React + Supabase, voltado para o segmento de tintas automotivas. Inclui gestão de vendas, clientes, produtos, financeiro mensal e impressão de recibos.

---

## Funcionalidades Implementadas

- [x] Autenticação de usuários
- [x] Módulo de vendas (PDV)
- [x] Impressão de recibo via integração com impressora (solicitação de impressão enviada)
- [x] Impressão por venda individual (vendas a prazo)
- [x] Gestão de produtos (CRUD)
- [x] Gestão de clientes
- [x] Relatório PDF por cliente (produtos por venda)
- [x] Módulo financeiro mensal
- [x] Dashboard com métricas
- [x] Controle de vendas a prazo
- [x] Layout responsivo com menu mobile
- [x] Documentação automática via AutoDocs (hook post-commit + Claude CLI) — saída local, não versionada
- [x] Guard de recursão via mensagem do commit
- [x] Script de setup `mind/setup-autodocs.sh` para reinstalação do hook após clone
- [x] Cache global de produtos via ProductsContext (elimina N+1 entre componentes)
- [x] Queries paralelas no histórico de vendas (3 queries fixas vs. N+1 por venda)
- [x] Diretório `mind/` excluído do git (documentação AutoDocs é local, não versionada)

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
  → arquivos gravados apenas localmente (mind/ está no .gitignore)
```

### Configuração e Instalação

- **Sem `ANTHROPIC_API_KEY`** — autenticação delegada ao Claude Code (CLI)
- `claude` CLI deve estar instalado e autenticado na máquina
- `find_claude()` busca o binário via `shutil.which()` e em candidatos fixos (NVM, `~/.local/bin`, `/usr/local/bin`)
- Falha silenciosa: sem o CLI, o commit prossegue normalmente
- **Ao clonar o repositório:** executar `bash mind/setup-autodocs.sh` para reinstalar o hook
- **Saída local:** o diretório `mind/` está no `.gitignore` — a documentação existe apenas na máquina local

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

---

## Decisões Arquiteturais Relevantes

- **AutoDocs com saída local:** documentação gerada pelo AutoDocs não é versionada no git (`mind/` no `.gitignore`). Mantém o histórico limpo; adequado para projeto solo.
- **ProductsContext global:** cache centralizado de produtos com Supabase Realtime elimina N+1 entre componentes.
- **Guard de recursão por mensagem:** solução simples e robusta para evitar loops no hook post-commit.
