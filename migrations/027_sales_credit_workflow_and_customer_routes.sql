-- Migration 027: vendas a prazo para pagamento posterior + rotas RPC de cliente

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'paid';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS marked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_payment_status_check'
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_payment_status_check
        CHECK (payment_status IN ('paid', 'pending'));
    END IF;
END;
$$;

UPDATE sales
SET payment_status = 'paid'
WHERE payment_status IS NULL;

UPDATE sales
SET paid_at = COALESCE(paid_at, created_at)
WHERE payment_status = 'paid'
AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_customer_payment_status ON sales(customer_id, payment_status);

CREATE OR REPLACE FUNCTION public.get_customer_account_overview(p_customer_id INT)
RETURNS TABLE (
    customer_id INT,
    total_sales NUMERIC,
    total_paid NUMERIC,
    total_pending NUMERIC,
    pending_sales_count BIGINT,
    last_sale_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'operator')
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT
        p_customer_id,
        COALESCE(SUM(s.total), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN s.payment_status = 'paid' THEN s.total ELSE 0 END), 0) AS total_paid,
        COALESCE(SUM(CASE WHEN s.payment_status = 'pending' THEN s.total ELSE 0 END), 0) AS total_pending,
        COALESCE(COUNT(*) FILTER (WHERE s.payment_status = 'pending'), 0) AS pending_sales_count,
        MAX(s.created_at) AS last_sale_at
    FROM sales s
    WHERE s.customer_id = p_customer_id
      AND s.deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_sales_history(p_customer_id INT)
RETURNS TABLE (
    sale_id INT,
    created_at TIMESTAMP WITH TIME ZONE,
    total NUMERIC,
    payment_status VARCHAR,
    paid_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'operator')
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT
        s.id AS sale_id,
        s.created_at,
        s.total,
        s.payment_status,
        s.paid_at
    FROM sales s
    WHERE s.customer_id = p_customer_id
      AND s.deleted_at IS NULL
    ORDER BY s.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marked_sales_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'operator')
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT COUNT(*)
    INTO v_count
    FROM sales s
    WHERE s.payment_status = 'pending'
      AND s.deleted_at IS NULL;

    RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_marked_sale(p_sale_id INT)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale sales%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'operator')
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE sales
    SET
        payment_status = 'paid',
        paid_at = NOW()
    WHERE id = p_sale_id
      AND deleted_at IS NULL
      AND payment_status = 'pending'
    RETURNING * INTO v_sale;

    IF v_sale.id IS NULL THEN
        RAISE EXCEPTION 'Sale not found or already settled';
    END IF;

    RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_account_overview(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_sales_history(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marked_sales_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_marked_sale(INT) TO authenticated;
