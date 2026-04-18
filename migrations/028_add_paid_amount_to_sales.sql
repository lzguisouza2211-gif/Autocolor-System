-- Migration 028: suporte a abatimento parcial em vendas a prazo

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_paid_amount_non_negative'
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_paid_amount_non_negative
        CHECK (paid_amount >= 0);
    END IF;
END;
$$;

UPDATE sales
SET paid_amount = CASE
    WHEN payment_status = 'paid' THEN total
    ELSE COALESCE(paid_amount, 0)
END;

UPDATE sales
SET payment_status = 'paid',
    paid_at = COALESCE(paid_at, NOW())
WHERE paid_amount >= total
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_payment_status_paid_amount
ON sales(payment_status, paid_amount);
