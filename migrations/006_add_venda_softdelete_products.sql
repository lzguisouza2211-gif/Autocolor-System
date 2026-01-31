--adicionar coluna venda (preço de venda) e soft delete em products
ALTER TABLE products
ADD COLUMN price_sale DECIMAL(10,2);

ALTER TABLE products
ADD COLUMN deleted_at TIMESTAMP;

-- Opcional: para filtrar apenas produtos ativos, use WHERE deleted_at IS NULL
