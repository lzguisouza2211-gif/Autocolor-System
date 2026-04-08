-- Migration: Adiciona coluna custom_name em sale_items para nomes personalizados de produtos (ex: EMBALAGEM)
ALTER TABLE sale_items ADD COLUMN custom_name TEXT;

-- Opcional: comentário explicativo
COMMENT ON COLUMN sale_items.custom_name IS 'Nome personalizado do item, usado quando o nome do produto é alterado (ex: EMBALAGEM com nome customizado)';
