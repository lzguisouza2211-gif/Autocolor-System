-- migration 011: update stock_audit.user_id to UUID and log user from sales

-- Drop FK and column if needed
ALTER TABLE stock_audit
DROP CONSTRAINT IF EXISTS fk_audit_user;

-- Change user_id column to UUID
ALTER TABLE stock_audit
ALTER COLUMN user_id TYPE UUID USING NULL;

-- Add FK to auth.users
ALTER TABLE stock_audit
ADD CONSTRAINT fk_audit_user_auth
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update log_stock_change_on_sale to pull user_id from sales
DROP TRIGGER IF EXISTS trg_log_stock_change_on_sale ON sale_items;
DROP FUNCTION IF EXISTS log_stock_change_on_sale();

CREATE OR REPLACE FUNCTION log_stock_change_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  sale_user_id UUID;
BEGIN
  SELECT user_id INTO sale_user_id FROM sales WHERE id = NEW.sale_id;

  INSERT INTO stock_audit (product_id, change_type, quantity_changed, user_id, sale_id)
  VALUES (NEW.product_id, 'sale', -NEW.quantity, sale_user_id, NEW.sale_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_stock_change_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION log_stock_change_on_sale();
