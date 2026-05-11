# AutoColor System

Sistema web de gestão para operação de loja com foco em:
- cadastro e controle de produtos;
- PDV com vendas à vista e a prazo;
- histórico de vendas com edição e soft delete;
- módulo de clientes e contas a receber;
- integração com servidor local de impressão térmica.

## Stack atual

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Banco/Auth: Supabase (PostgreSQL + Auth + RLS)
- Impressão local: Node.js + Express (`print-server.cjs`)
- Deploy frontend: Vercel (SPA rewrite para `index.html`)

## Módulos existentes

- `Dashboard`: métricas de produtos, vendas do mês, estoque crítico e vendas a prazo
- `Produtos`: CRUD, soft delete e reabastecimento via leitura de código de barras
- `Vendas (PDV)`: carrinho, descontos, venda à vista/a prazo, cliente obrigatório no prazo, impressão
- `Histórico de Vendas` (admin): detalhamento, edição de itens, troca de cliente, soft delete
- `Vendas a Prazo` (admin): visão por cliente, abatimentos parciais, quitação individual e total
- `Clientes` (admin): CRUD, consulta de CEP, resumo financeiro, relatório PDF administrativo
- `Autenticação`: login por e-mail/senha via Supabase Auth + proteção de rotas

## Requisitos

- Node.js 18+
- Projeto Supabase com migrations aplicadas

## Setup local

1. Instalar dependências:
	```bash
	npm install
	```
2. Criar `.env` (ou usar script `setup-env.sh`) com:
	- `VITE_PUBLIC_SUPABASE_URL`
	- `VITE_PUBLIC_SUPABASE_ANON_KEY`
3. Rodar frontend:
	```bash
	npm run dev
	```
4. (Opcional) Rodar servidor de impressão local:
	```bash
	node print-server.cjs
	```

## Scripts disponíveis

- `npm run dev` — ambiente de desenvolvimento Vite
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run lint` — lint da base TypeScript/React
- `npm run preview` — preview do build

## Estrutura principal

- `src/components` — módulos de tela (PDV, histórico, produtos, clientes etc.)
- `src/contexts` — contexto de autenticação
- `migrations` — evolução do banco (schema, políticas RLS, triggers)
- `print-server.cjs` — API local `POST /api/print`
- `start-printer.bat` — bootstrap do servidor de impressão no Windows

## Documentação técnica

Toda a documentação operacional e técnica está em `docs/`.
Comece por: [`docs/README.md`](docs/README.md)