--migration 003' Constraints and Indices

CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_items_product_id ON sale_items(product_id);