# AutoColor System — Mapa do Projeto

Visão geral atualizada do estado atual do projeto.

---

## Descrição

Sistema de PDV (Ponto de Venda) desenvolvido para controle de caixa, estoque, clientes e relatórios financeiros. Voltado para pequenos comércios.

---

## Front-end

### Módulos

- **PDV (Ponto de Venda)** — carrinho de compras, seleção de cliente, finalização de venda, leitor de código de barras
- **Histórico de Vendas** — listagem de vendas realizadas, impressão por venda, filtros
- **Produtos** — tabela de produtos, formulário de cadastro/edição
- **Clientes** — cadastro de clientes, relatório PDF por cliente, vendas a prazo
- **Financeiro** — página financeira mensal, resumo de receitas
- **Dashboard** — métricas e vendas recentes
- **Vendas Marcadas** — controle de vendas a prazo

### Componentes Principais

- `PDV.tsx` — ponto de venda com carrinho e seleção de clientes
- `SalesHistory.tsx` — histórico com impressão por venda
- `ProductsTable.tsx` + `ProductForm.tsx` — gestão de produtos
- `Customers.tsx` — gestão de clientes com relatório PDF
- `Financeiro.tsx` — módulo financeiro
- `DashboardMetrics.tsx` + `RecentSalesTable.tsx` — dashboard
- `MarkedSales.tsx` — vendas a prazo
- `BarcodeScanner.tsx` — leitor de código de barras
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
|-----------|-----------|
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

---

## Fluxo Principal

```
Login → Dashboard → PDV → [Seleciona Produtos] → [Seleciona Cliente] → Finaliza Venda → Imprime Recibo
                        ↓
              Histórico de Vendas → Imprime por Venda
```
