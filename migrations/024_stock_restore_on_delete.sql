-- Trigger para devolver estoque ao remover ou atualizar sale_items

CREATE OR REPLACE FUNCTION restore_stock_on_sale_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_stock_on_sale_item_delete
AFTER DELETE ON sale_items
FOR EACH ROW EXECUTE FUNCTION restore_stock_on_sale_item_delete();

-- Para UPDATE: devolver diferença se quantidade for reduzida
CREATE OR REPLACE FUNCTION adjust_stock_on_sale_item_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity < OLD.quantity THEN
        UPDATE products
        SET stock = stock + (OLD.quantity - NEW.quantity)
        WHERE id = OLD.product_id;
    ELSIF NEW.quantity > OLD.quantity THEN
        UPDATE products
        SET stock = stock - (NEW.quantity - OLD.quantity)
        WHERE id = OLD.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_adjust_stock_on_sale_item_update
AFTER UPDATE ON sale_items
FOR EACH ROW EXECUTE FUNCTION adjust_stock_on_sale_item_update();
