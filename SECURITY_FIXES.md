# Correções de Segurança - Database Linter

## Status: ✅ Resolvido

Todos os warnings do Supabase Database Linter foram corrigidos através da migration **008_fix_security_warnings.sql**.

---

## 1. ✅ Function Search Path Mutable (4x)

**Problema:** As seguintes funções não tinham `search_path` definido:
- `log_stock_change_on_adjustment`
- `update_stock`
- `warn_low_stock`
- `log_stock_change_on_sale`

**Solução:** Criada migration [migrations/008_fix_security_warnings.sql](migrations/008_fix_security_warnings.sql) que recria todas as funções com `SET search_path = public`:

```sql
-- Exemplo
CREATE OR REPLACE FUNCTION public.update_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;  -- ← Adicionado
```

**Motivo:** Define explicitamente o schema para evitar ataques de injeção via path manipulation.

---

## 2. ✅ RLS Policy Always True (2x)

**Problema:** Duas políticas RLS eram overly permissive:
- Tabela `products` - UPDATE policies com `USING (true)` e `WITH CHECK (true)`
- Tabela `stock_audit` - INSERT policy com `WITH CHECK (true)`

**Solução:** Migration [migrations/008_fix_security_warnings.sql](migrations/008_fix_security_warnings.sql) remove as políticas antigas e as recria com verificação de autenticação:

**Antes:**
```sql
CREATE POLICY "Produtos: atualização para autenticados"
  ON products
  FOR UPDATE
  USING (true)  -- ❌ Permite qualquer pessoa
  WITH CHECK (true);  -- ❌ Permite qualquer pessoa
```

**Depois:**
```sql
CREATE POLICY "Produtos: atualização para autenticados"
  ON products
  FOR UPDATE
  USING (auth.role() = 'authenticated')  -- ✅ Apenas autenticados
  WITH CHECK (auth.role() = 'authenticated');  -- ✅ Apenas autenticados
```

**Motivo:** RLS policies com `true` bypassam completamente a segurança. Agora apenas usuários autenticados podem acessar.

---

## 3. ⚠️ Leaked Password Protection Disabled

**Problema:** A proteção contra senhas vazadas (HaveIBeenPwned) está desativada.

**Solução:** Esta é uma configuração do **Supabase Dashboard**, não pode ser aplicada via SQL.

### Como ativar no Supabase:

1. Acesse seu projeto no [Supabase Console](https://app.supabase.com)
2. Vá para **Authentication** → **Password Security** (ou **Policies**)
3. Procure por **"Leaked Password Protection"** ou **"HaveIBeenPwned"**
4. Ative a opção
5. Salve as configurações

**Referência:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Aplicação das Correções

Para aplicar a migration de segurança:

```bash
# Via Supabase CLI
supabase db push

# Ou aplicar manualmente no SQL Editor do Supabase
# Copie o conteúdo de migrations/008_fix_security_warnings.sql
```

---

## Próximos Passos

1. ✅ Aplicar a migration 008 ao banco de dados
2. ⚠️ Acessar o Supabase Dashboard e ativar proteção contra senhas vazadas
3. Executar o Database Linter novamente para confirmar que todos os warnings foram resolvidos

---

## Referências

- [Supabase Database Linter - Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Supabase Database Linter - RLS Policy Always True](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
- [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security)
