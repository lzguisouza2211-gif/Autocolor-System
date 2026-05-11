# Visão Geral do Sistema

## Objetivo

O AutoColor System é um ERP leve para operação de loja com foco em vendas de balcão, controle de estoque, contas a receber e impressão de comprovantes.

## Tecnologias em uso

- Frontend SPA: React + TypeScript + Vite
- UI: Tailwind CSS
- Banco/Auth: Supabase (PostgreSQL + Auth + RLS)
- Impressão local: Express em `print-server.cjs` (porta `4000`)

## Fluxo principal

1. Usuário autentica via Supabase Auth.
2. Frontend consulta/escreve diretamente no Supabase (sem backend HTTP intermediário para regras de negócio).
3. Triggers e constraints no banco mantêm consistência de estoque e auditoria.
4. Em vendas, frontend chama API local de impressão (`POST /api/print`) para gerar/imprimir notinha.

## Módulos e responsabilidades

- `Dashboard`: KPIs operacionais e alertas de estoque crítico.
- `Produtos`: manutenção de catálogo, preços, estoque e soft delete.
- `PDV`: fechamento de vendas, cálculo de descontos, associação de cliente no crédito.
- `Histórico de Vendas` (admin): auditoria operacional, edição e exclusão lógica.
- `Vendas a Prazo` (admin): gestão de saldos pendentes por cliente.
- `Clientes` (admin): cadastro, dados cadastrais e situação financeira.

## Integrações existentes

- Supabase JS client (`src/supabase.ts`)
- ViaCEP (autopreenchimento de endereço em clientes)
- API local de impressão (`http://localhost:4000/api/print`)

## Limites atuais do sistema

- Não existe backend de domínio separado; validações de negócio dependem do frontend + banco.
- Servidor de impressão não está empacotado em serviço nativo do SO; roda como processo Node.
- `print-server.ts` existe no repositório, porém o fluxo operacional atual usa `print-server.cjs`.
