-- Migration 025: create customers table and link customers to sales

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    phone VARCHAR(16),
    birth_date DATE,
    zip_code VARCHAR(9),
    street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(120),
    neighborhood VARCHAR(120),
    city VARCHAR(120),
    state CHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_zip_code ON customers(zip_code);

CREATE OR REPLACE FUNCTION public.set_customers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION public.set_customers_updated_at();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers: select for admin and operator" ON customers;
DROP POLICY IF EXISTS "Customers: insert for admin" ON customers;
DROP POLICY IF EXISTS "Customers: update for admin" ON customers;
DROP POLICY IF EXISTS "Customers: delete for admin" ON customers;

CREATE POLICY "Customers: select for admin and operator"
ON customers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'operator')
    )
);

CREATE POLICY "Customers: insert for admin"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

CREATE POLICY "Customers: update for admin"
ON customers
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

CREATE POLICY "Customers: delete for admin"
ON customers
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_sales_customer'
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
