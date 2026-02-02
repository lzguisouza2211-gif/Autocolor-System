-- migration 009: add discount tracking columns to sale_items

-- Add original_price column to track the catalog price at the time of sale
ALTER TABLE sale_items 
ADD COLUMN original_price DECIMAL(10, 2);

-- Add discount column to track the discount given per item
ALTER TABLE sale_items 
ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;

-- Add comment to explain the columns
COMMENT ON COLUMN sale_items.original_price IS 'Original catalog price at the time of sale';
COMMENT ON COLUMN sale_items.discount IS 'Discount amount per unit (original_price - price)';
