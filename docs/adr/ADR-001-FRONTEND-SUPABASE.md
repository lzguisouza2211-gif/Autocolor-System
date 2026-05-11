# ADR-001 — Frontend acessa Supabase diretamente

## Status
Aceito

## Contexto
O sistema opera como SPA React sem backend HTTP intermediário para domínio.

## Decisão
Usar `@supabase/supabase-js` no frontend para CRUD e consultas de negócio.

## Consequências

- Simplicidade de deploy e menor superfície de backend.
- Regras críticas precisam estar bem cobertas por RLS/constraints/triggers.
- Lógica de negócio acaba distribuída entre frontend e banco.
