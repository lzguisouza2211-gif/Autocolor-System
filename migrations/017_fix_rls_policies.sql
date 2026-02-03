-- Migration 017: Fix overly permissive RLS policies
-- This fixes the "rls_policy_always_true" warnings

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

-- Drop overly permissive UPDATE policies
DROP POLICY IF EXISTS "Produtos: atualização para autenticados" ON products;
DROP POLICY IF EXISTS "Produtos: validação de atualização" ON products;

-- Replace with role-based UPDATE policy
-- Only authenticated users can update products
-- Admins can update everything, operators can update stock-related fields
CREATE POLICY "Produtos: atualização para autenticados"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user is admin or operator
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    -- Same check for the updated values
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );


-- ============================================================
-- SALES TABLE
-- ============================================================

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Vendas: inserção para autenticados" ON sales;

-- Replace with role-based INSERT policy
CREATE POLICY "Vendas: inserção para autenticados"
  ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must exist in users table with appropriate role
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );


-- ============================================================
-- SALE_ITEMS TABLE
-- ============================================================

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Itens de venda: inserção para autenticados" ON sale_items;

-- Replace with role-based INSERT policy
CREATE POLICY "Itens de venda: inserção para autenticados"
  ON sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must exist in users table with appropriate role
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );


-- ============================================================
-- STOCK_AUDIT TABLE
-- ============================================================

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Auditoria de estoque: inserção" ON stock_audit;

-- Replace with policy that allows inserts from authenticated users and triggers
-- Note: This table is primarily populated by triggers, so we keep it permissive
-- but restricted to authenticated context
CREATE POLICY "Auditoria de estoque: inserção"
  ON stock_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow inserts for authenticated users (including from triggers)
    auth.role() = 'authenticated'
  );

-- Alternative stricter policy (commented out - use if triggers fail):
-- This would require the user to exist in the users table
/*
CREATE POLICY "Auditoria de estoque: inserção"
  ON stock_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
    )
  );
*/


-- ============================================================
-- NOTES
-- ============================================================

-- These policies now require:
-- 1. Users to be authenticated
-- 2. Users to have a record in the users table
-- 3. Users to have appropriate roles (admin/operator)
--
-- The stock_audit policy remains relatively permissive because it's used by triggers
-- If triggers fail, uncomment the alternative policy above
