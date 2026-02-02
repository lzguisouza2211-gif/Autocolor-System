-- migration 013: log user_id on stock adjustments

-- Update log_stock_change_on_adjustment to include auth.uid()
DROP TRIGGER IF EXISTS trg_log_stock_change_on_adjustment ON products;
DROP FUNCTION IF EXISTS log_stock_change_on_adjustment();

CREATE OR REPLACE FUNCTION log_stock_change_on_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock != OLD.stock THEN
        INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id)
        VALUES (NEW.id, 'adjustment', NEW.stock - OLD.stock, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_change_on_adjustment
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_adjustment();
