-- Migration 015: Add DELETE policies for admin users

-- Policy de DELETE para produtos (apenas admin)
CREATE POLICY "Produtos: delete apenas para admin"
  ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy de DELETE para vendas (apenas admin)
CREATE POLICY "Vendas: delete apenas para admin"
  ON sales
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Atualiza policy de DELETE para sale_items (admin ou autenticados)
DROP POLICY IF EXISTS "Itens de venda: delete para autenticados" ON sale_items;

CREATE POLICY "Itens de venda: delete para admin"
  ON sale_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy de DELETE para auditoria de estoque (apenas admin)
CREATE POLICY "Auditoria de estoque: delete apenas para admin"
  ON stock_audit
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'admin'
    )
  );
