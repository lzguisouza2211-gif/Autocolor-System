--migration 002 trigger and logic


CREATE OR REPLACE FUNCTION update_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock();

CREATE OR REPLACE FUNCTION warn_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock INTO current_stock FROM products WHERE id = NEW.product_id;
    
    IF current_stock - NEW.quantity < 5 THEN
        RAISE NOTICE 'Warning: Product ID % is low on stock (Current stock: %)', NEW.product_id, current_stock - NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_warn_low_stock
BEFORE INSERT OR UPDATE ON sale_items
FOR EACH ROW EXECUTE FUNCTION warn_low_stock();

-- Trigger para registrar alterações no estoque ao realizar uma venda
CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, NEW.user_id, NEW.sale_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_change_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_sale();

-- Trigger para registrar alterações no estoque ao realizar ajustes manuais
CREATE OR REPLACE FUNCTION log_stock_change_on_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id)
    VALUES (NEW.product_id, 'adjustment', NEW.quantity_changed, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_change_on_adjustment
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_adjustment();
