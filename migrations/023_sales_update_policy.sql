-- Migration: Policies de UPDATE para soft delete
-- Permite que admin e operator atualizem vendas, itens de venda e auditoria de estoque (ex: para soft delete)

CREATE POLICY "Vendas: update para admin e operator"
  ON sales
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Itens de venda: update para admin e operator"
  ON sale_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Auditoria de estoque: update para admin e operator"
  ON stock_audit
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role IN ('admin', 'operator')
    )
  );
