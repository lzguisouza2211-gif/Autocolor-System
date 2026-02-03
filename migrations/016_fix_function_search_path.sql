-- Migration 016: Fix function search_path security warnings
-- This fixes the "function_search_path_mutable" warnings by explicitly setting search_path

-- Fix: handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'operator'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Fix: update_stock function
CREATE OR REPLACE FUNCTION update_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

-- Fix: warn_low_stock function
CREATE OR REPLACE FUNCTION warn_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock INTO current_stock FROM products WHERE id = NEW.product_id;
    
    IF current_stock - NEW.quantity < 5 THEN
        RAISE NOTICE 'Warning: Product ID % is low on stock (Current stock: %)', NEW.product_id, current_stock - NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$;

-- Fix: log_stock_change_on_sale function
CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
    VALUES (NEW.product_id, 'sale', -NEW.quantity, NEW.user_id, NEW.sale_id);
    RETURN NEW;
END;
$$;

-- Fix: log_stock_change_on_adjustment function
CREATE OR REPLACE FUNCTION log_stock_change_on_adjustment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id)
    VALUES (NEW.product_id, 'adjustment', NEW.quantity_changed, NEW.user_id);
    RETURN NEW;
END;
$$;
