# Arquitetura e Módulos

## Arquitetura geral

- Aplicação SPA React.
- Roteamento protegido em `src/AppRoutes.tsx`.
- Persistência e auth via Supabase.
- API local independente para impressão térmica.

## Camadas

### 1) Apresentação (React)

- Entrada: `src/main.tsx`.
- Rotas: `src/AppRoutes.tsx`.
- Telas em `src/components/*`.

### 2) Contexto de autenticação

- `src/contexts/AuthContext.tsx` mantém `user` em memória e `localStorage` (`ac_user`).
- Usa `supabase.auth.getSession()` + `onAuthStateChange`.
- Faz `signOut` no `beforeunload`.

### 3) Acesso a dados

- Cliente Supabase central em `src/supabase.ts`.
- Não há API REST custom para produtos/vendas/clientes.

### 4) Banco de dados

- Schema evoluído por migrations em `migrations/`.
- RLS habilitado nas tabelas principais.
- Triggers de estoque e auditoria em `sale_items` e `products`.

### 5) Impressão

- `print-server.cjs` expõe `POST /api/print`.
- Linux: gera arquivo `recibo-teste-*.txt`.
- Windows: gera arquivo e envia via `copy ... COM7`.

## Rotas de interface

- `/login`
- `/visao-geral`
- `/produtos`
- `/vendas`
- `/historico-vendas` (admin)
- `/vendas-marcadas` (admin)
- `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar` (admin)

## Módulos críticos

### `PDV.tsx`

- Carrinho com persistência local (`pdv_cart`).
- Venda à vista e a prazo (`saleType: cash|credit`).
- Cliente obrigatório para venda a prazo.
- Suporte a preço manual, desconto por item e nome customizado.
- Grava em `sales` e `sale_items`.
- Dispara impressão local.

### `SalesHistory.tsx`

- Lista completa de vendas não deletadas.
- Detalhe de itens, vendedor e cliente.
- Edição de itens e cliente da venda.
- Soft delete de `sales`, `sale_items` e `stock_audit`.

### `Customers.tsx`

- CRUD de clientes (admin).
- Consulta CEP via ViaCEP.
- Cálculo de saldo pendente por cliente.
- Quitação total/parcial de contas.
- Geração de PDF administrativo por cliente.

### `MarkedSales.tsx`

- Agrupa vendas pendentes por cliente.
- Permite abatimento parcial, quitação por venda e quitação total.

## Componentes auxiliares relevantes

- `Header.tsx`: badge e lista de produtos em estoque crítico (<= 10).
- `DashboardMetrics.tsx`: usa RPC `get_marked_sales_count` + consultas agregadas.
- `ProductForm.tsx`: cadastro/edição e modo reabastecimento por código de barras.
- `BarcodeScanner.tsx`: wrapper de Quagga para leitura por câmera.
