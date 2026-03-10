
-- Atualiza deleted_at para a venda e todos os registros relacionados
UPDATE sales SET deleted_at = NOW() WHERE id = :sale_id;
UPDATE sale_items SET deleted_at = NOW() WHERE sale_id = :sale_id;
UPDATE stock_audit SET deleted_at = NOW() WHERE sale_id = :sale_id;

-- Para consultas, lembre-se de filtrar WHERE deleted_at IS NULL
-- Exemplo: SELECT * FROM sales WHERE deleted_at IS NULL;