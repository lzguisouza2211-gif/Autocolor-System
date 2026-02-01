-- migration 007: fix problematic triggers

-- Remover o trigger que está causando erro no UPDATE de products
DROP TRIGGER IF EXISTS trg_log_stock_change_on_adjustment ON products;
DROP FUNCTION IF EXISTS log_stock_change_on_adjustment();

-- Criar uma função corrigida que calcula a diferença de estoque
CREATE OR REPLACE FUNCTION log_stock_change_on_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock != OLD.stock THEN
        INSERT INTO stock_audit (product_id, change_type, quantity_changed)
        VALUES (NEW.id, 'adjustment', NEW.stock - OLD.stock);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger com a função corrigida
CREATE TRIGGER trg_log_stock_change_on_adjustment
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_adjustment();
