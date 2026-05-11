# Autenticação e Autorização

## Autenticação

- Provider: Supabase Auth (email/senha).
- Login em `src/components/Login.tsx` com `signInWithPassword`.
- Estado de sessão centralizado em `src/contexts/AuthContext.tsx`.

## Persistência de sessão

- Usuário é armazenado em `localStorage` (`ac_user`).
- Sessão é validada ao iniciar (`getSession`) e por listener (`onAuthStateChange`).
- Há `signOut` no evento `beforeunload` (comportamento intencional no código atual).

## Proteção de rotas

- `ProtectedRoute`: exige usuário autenticado.
- `AdminRoute`: valida papel do usuário na tabela `users` (`role = 'admin'`).

## Regras de acesso por módulo

- Todos os usuários autenticados:
  - Dashboard
  - Produtos
  - Vendas (PDV)
- Apenas admin:
  - Histórico de vendas
  - Vendas a prazo
  - Clientes

## Fonte de autorização

- Frontend verifica role em `users`.
- Banco aplica RLS por `auth.uid()` + role em policies SQL.

## Provisionamento de usuário

- Migration `014_add_user_roles.sql` cria trigger `handle_new_user` para sincronizar `auth.users` -> `public.users`.
- Usuário novo entra com role padrão `operator`.
- Elevação para `admin` é operacional (update na tabela `users`).
