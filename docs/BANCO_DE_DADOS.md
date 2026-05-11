# Banco de Dados e Regras de Negócio

## Fontes de verdade

- Migrations SQL em `migrations/`.
- Uso real das tabelas no frontend (`src/components/*`).

## Tabelas ativas

### `products`

Campos relevantes:
- `id`, `name`, `category`, `mark`, `barcode`
- `price`, `price_sale`
- `stock`
- `is_customizable`
- `deleted_at` (soft delete)

### `sales`

Campos relevantes:
- `id`, `created_at`, `total`
- `user_id` (UUID em `users.id`)
- `customer_id` (FK para `customers.id`)
- `payment_status` (`paid` | `pending`)
- `marked_at`, `paid_at`, `paid_amount`
- `deleted_at` (soft delete)

### `sale_items`

Campos relevantes:
- `id`, `sale_id`, `product_id`
- `quantity`, `price`, `original_price`, `discount`
- `custom_name`
- `deleted_at` (soft delete)

### `users`

Campos relevantes:
- `id` UUID
- `name`, `email`
- `role` (`admin` / `operator`)
- `created_at`

### `stock_audit`

Campos relevantes:
- `product_id`, `change_type`, `quantity_changed`
- `user_id`, `sale_id`, `created_at`
- `deleted_at` (soft delete)

### `customers`

Campos relevantes:
- `full_name`
- `cpf` (opcional)
- `cnpj` (opcional)
- `phone`, `birth_date`
- `zip_code`, `street`, `address_number`, `address_complement`, `neighborhood`, `city`, `state`
- `created_at`, `updated_at`

## Funções e RPCs relevantes

- `get_marked_sales_count()`
- `get_customer_account_overview(p_customer_id)`
- `get_customer_sales_history(p_customer_id)`
- `settle_marked_sale(p_sale_id)`

Observação: o frontend atual usa somente `get_marked_sales_count`; os demais fluxos de cliente/abatimento são executados por queries diretas em `sales`.

## Triggers de estoque

- Inserção em `sale_items` reduz estoque e registra auditoria.
- Atualização em `sale_items` ajusta diferença de estoque.
- Exclusão em `sale_items` devolve estoque.
- Alteração de `products.stock` registra ajuste em `stock_audit`.

## Regras de negócio implementadas hoje

- Venda a prazo exige cliente vinculado no frontend.
- `paid_amount` não pode ser negativo (constraint).
- Venda pendente pode virar paga por quitação total/parcial.
- Consultas operacionais filtram `deleted_at IS NULL`.

## Segurança (RLS)

- RLS habilitado para tabelas de domínio.
- Policies por papel (`admin`/`operator`) via tabela `users` + `auth.uid()`.

## Inconsistências observadas na camada de banco

- Histórico de migrations contém scripts com sobreposição/redefinição de funções (ex.: 016 reescreve funções de forma incompatível, depois corrigidas por 018/026).
- Existe salto de numeração de migrations (008 e 020 ausentes).
- Código referencia `embalagem_nome_historico`, mas não há migration dessa tabela no repositório.
