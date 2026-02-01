-- migration 006 : add policies for products table

-- Habilita Row Level Security (RLS) para as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela products
-- SELECT
CREATE POLICY "Produtos: leitura para autenticados"
  ON products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT
CREATE POLICY "Produtos: inserção para autenticados"
  ON products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE
CREATE POLICY "Produtos: atualização para autenticados"
  ON products
  FOR UPDATE
  USING (true);

-- UPDATE WITH CHECK
CREATE POLICY "Produtos: validação de atualização"
  ON products
  FOR UPDATE
  WITH CHECK (true);

-- DELETE (bloqueado, só soft delete via UPDATE)

-- Políticas para a tabela sales
-- SELECT
CREATE POLICY "Vendas: leitura para autenticados"
  ON sales
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT
CREATE POLICY "Vendas: inserção para autenticados"
  ON sales
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

  --políticas para a tabela sale_items
  -- SELECT
CREATE POLICY "Itens de venda: leitura para autenticados"
  ON sale_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT
CREATE POLICY "Itens de venda: inserção para autenticados"
  ON sale_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy para DELETE em sale_items
CREATE POLICY "Itens de venda: delete para autenticados"
  ON sale_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policies para users
-- SELECT
CREATE POLICY "Usuário: leitura do próprio registro"
  ON users
  FOR SELECT
  USING (id::text = auth.uid()::text);

-- POLICY para stock_audit
-- SELECT
CREATE POLICY "Auditoria de estoque: leitura para autenticados"
  ON stock_audit
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT (para triggers)
CREATE POLICY "Auditoria de estoque: inserção"
  ON stock_audit
  FOR INSERT
  WITH CHECK (true);