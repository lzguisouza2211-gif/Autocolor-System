--Esse é o plano B: se caso der erro ao enviar um pedido

--erro: 


-- Fix log_stock_change_on_adjustment function
CREATE OR REPLACE FUNCTION log_stock_change_on_adjustment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id)
    VALUES (NEW.id, 'adjustment', NEW.stock, auth.uid());
    RETURN NEW;
END;
$$;



-- Fix log_stock_change_on_sale to add search_path
CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id FROM sales WHERE id = NEW.sale_id;
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, v_user_id, NEW.sale_id);
    RETURN NEW;
END;
$$;