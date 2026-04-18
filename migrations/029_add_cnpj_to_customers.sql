-- Migration 029: add CNPJ support to customers

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

ALTER TABLE customers
ALTER COLUMN cpf DROP NOT NULL;

UPDATE customers
SET cpf = NULL
WHERE cpf IS NOT NULL AND btrim(cpf) = '';

UPDATE customers
SET cnpj = NULL
WHERE cnpj IS NOT NULL AND btrim(cnpj) = '';

ALTER TABLE customers
DROP CONSTRAINT IF EXISTS chk_customers_document_required;

ALTER TABLE customers
ADD CONSTRAINT chk_customers_document_required
CHECK (
  NULLIF(btrim(cpf), '') IS NOT NULL
  OR NULLIF(btrim(cnpj), '') IS NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cnpj_unique
ON customers (cnpj)
WHERE cnpj IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_cnpj
ON customers(cnpj);
