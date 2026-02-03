--migration 018: fix

CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM sales WHERE id = NEW.sale_id;
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, v_user_id, NEW.sale_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'log_stock_change_on_sale';