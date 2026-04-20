-- Migration 030: remove required document constraint from customers

ALTER TABLE customers
DROP CONSTRAINT IF EXISTS chk_customers_document_required;
