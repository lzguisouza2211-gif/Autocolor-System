-- Script para LIMPAR BANCO
-- ⚠️ ATENÇÃO: Este script APAGA TODOS OS DADOS!
-- Execute apenas se tiver certeza absoluta do que está fazendo!!!!!!!

-- 1. Desabilita RLS temporariamente
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Limpa todas as tabelas (respeita ordem de foreign keys)
TRUNCATE TABLE sale_items CASCADE;
TRUNCATE TABLE stock_audit CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- Opcional: limpar usuários (comente se quiser manter os usuários)
-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- 3. Reseta sequences para começar do ID 1 novamente
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE sales_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_audit_id_seq RESTART WITH 1;
-- ALTER SEQUENCE users_id_seq RESTART WITH 1; -- descomente se limpou users

-- 4. Reabilita RLS
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ✅ Banco limpo e pronto para novos dados!
