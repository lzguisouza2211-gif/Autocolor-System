# ADR-003 — Crédito e contas a receber na tabela `sales`

## Status
Aceito

## Contexto
O sistema precisava suportar vendas a prazo e abatimentos sem criar módulo financeiro separado.

## Decisão
Modelar crédito diretamente em `sales` com:
- `payment_status`
- `paid_amount`
- `marked_at`
- `paid_at`
- vínculo opcional com `customer_id`

## Consequências

- Fluxo de crédito simples e integrado ao histórico de vendas.
- Edição/baixa depende de consistência em `sales` e `sale_items`.
- Relatórios financeiros avançados exigirão evolução de modelo no futuro.
