-- Migration 00: Soft delete de venda e itens relacionados
-- Este script faz soft delete em sales, sale_items e stock_audit relacionados a uma venda
-- Uso: substitua :sale_id pelo id da venda a ser excluída

-- Soft delete na tabela sales (adicionando coluna deleted_at se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='deleted_at') THEN
        ALTER TABLE sales ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END$$;

-- Soft delete na tabela sale_items (adicionando coluna deleted_at se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='deleted_at') THEN
        ALTER TABLE sale_items ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END$$;

-- Soft delete na tabela stock_audit (adicionando coluna deleted_at se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_audit' AND column_name='deleted_at') THEN
        ALTER TABLE stock_audit ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END$$;
