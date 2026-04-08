-- Migration 026: Fix stock audit adjustment trigger after migration 016 overwrite
-- Symptom fixed: "record NEW has no field product_id" when finalizing a sale

-- Recreate log function for stock changes on products with correct fields.
CREATE OR REPLACE FUNCTION public.log_stock_change_on_adjustment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- products table rows do not have product_id/quantity_changed columns
    -- so we must use NEW.id and stock delta.
    IF NEW.stock IS DISTINCT FROM OLD.stock THEN
        INSERT INTO public.stock_audit (product_id, change_type, quantity_changed, user_id)
        VALUES (NEW.id, 'adjustment', NEW.stock - OLD.stock, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

-- Ensure trigger points to the corrected function.
DROP TRIGGER IF EXISTS trg_log_stock_change_on_adjustment ON public.products;
CREATE TRIGGER trg_log_stock_change_on_adjustment
AFTER UPDATE OF stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.log_stock_change_on_adjustment();

-- Keep sale audit function consistent and independent from nonexistent NEW.user_id in sale_items
CREATE OR REPLACE FUNCTION public.log_stock_change_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.sales
    WHERE id = NEW.sale_id;

    INSERT INTO public.stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, v_user_id, NEW.sale_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_stock_change_on_sale ON public.sale_items;
CREATE TRIGGER trg_log_stock_change_on_sale
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.log_stock_change_on_sale();
