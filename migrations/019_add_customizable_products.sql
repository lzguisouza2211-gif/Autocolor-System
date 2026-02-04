-- Migration 019: Add is_customizable column to products table for custom/made-to-order products (e.g., tintas)

ALTER TABLE products ADD COLUMN is_customizable BOOLEAN DEFAULT false;
