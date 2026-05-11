# Onboarding Técnico

## 1) Primeiro acesso ao projeto

1. Instalar dependências com `npm install`.
2. Configurar `.env` com URL/chave anon do Supabase.
3. Rodar `npm run dev`.
4. Validar login em `/login`.

## 2) Entender o fluxo funcional

Ordem recomendada de leitura de código:

1. `src/AppRoutes.tsx` (rotas e guards)
2. `src/contexts/AuthContext.tsx` (sessão)
3. `src/components/PDV.tsx` (core de vendas)
4. `src/components/SalesHistory.tsx` e `src/components/MarkedSales.tsx`
5. `src/components/Customers.tsx`
6. `print-server.cjs`

## 3) Banco e regras

1. Ler migrations finais (`025` a `030` + `026`).
2. Conferir policies/RLS e triggers.
3. Confirmar tabela `users` sincronizada com Auth.

## 4) Checklist mínimo de validação local

- Login funcionando.
- CRUD de produto funcionando.
- Venda à vista e a prazo funcionando.
- Impressão local gerando arquivo de teste no Linux.
- Dashboard com métricas carregando.

## 5) Cuidados na manutenção

- Sempre validar impacto de mudanças em `sales`, `sale_items`, `stock_audit`.
- Evitar duplicar regras de negócio entre frontend e SQL sem necessidade.
- Em mudanças na impressão, validar payload real vindo do frontend.
