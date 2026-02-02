-- migration 012: combine RLS policy fix + sale_items trigger fix

-- RLS policies for INSERT
DROP POLICY IF EXISTS "Vendas: inserção para autenticados" ON sales;
DROP POLICY IF EXISTS "Itens de venda: inserção para autenticados" ON sale_items;

CREATE POLICY "Vendas: inserção para autenticados"
ON sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Itens de venda: inserção para autenticados"
ON sale_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix log_stock_change_on_sale trigger (remove NEW.user_id)
DROP TRIGGER IF EXISTS trg_log_stock_change_on_sale ON sale_items;
DROP FUNCTION IF EXISTS log_stock_change_on_sale();

CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, NEW.sale_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_change_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_sale();
