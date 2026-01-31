-- migration 005: create relationship between sales and sale_items for Supabase UI

-- Este comando é apenas informativo, pois a foreign key já existe.
-- No Supabase, o relacionamento (relationship) é criado via interface gráfica, mas você pode garantir a FK assim:

ALTER TABLE sale_items
ADD CONSTRAINT fk_sale_items_sale_id
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- DICA: Após rodar esta migration, vá na interface do Supabase,
-- acesse a tabela sales > aba Definition > Relationships > New Relationship
-- e crie um relacionamento do tipo "One to Many" de sales.id para sale_items.sale_id
-- Nomeie o relacionamento como sale_items.


--adicionar coluna venda (preço de venda) e soft delete em products
ALTER TABLE products
ADD COLUMN venda DECIMAL(10,2);

ALTER TABLE products
ADD COLUMN deleted_at TIMESTAMP;

-- Opcional: para filtrar apenas produtos ativos, use WHERE deleted_at IS NULL
