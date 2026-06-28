# Architecture — AutoColor System

Registro de decisões arquiteturais importantes tomadas durante o desenvolvimento.

---

## Stack Principal

**Decisão:** React 19 + TypeScript + Supabase como stack principal.

**Motivo:** Curva de aprendizado equilibrada, ecosistema maduro para front-end e backend-as-a-service que elimina a necessidade de gerenciar infraestrutura própria.

**Alternativas consideradas:**
- Next.js (descartado por adicionar complexidade desnecessária para um sistema local/web simples)
- Firebase (substituído pelo Supabase por ser open-source e SQL-based)

**Impacto:** Desenvolvimento ágil com banco de dados PostgreSQL robusto e autenticação pronta.

---

## Servidor de Impressão Local

**Decisão:** Express.js como print-server local (`print-server.cjs`) separado do front-end.

**Motivo:** Impressoras térmicas precisam de acesso nativo ao sistema operacional. O navegador não tem permissão para acessar dispositivos USB/serial diretamente.

**Alternativas consideradas:**
- Web Serial API (ainda experimental e com suporte limitado)
- Impressão via PDF (sem suporte a comandos ESC/POS)

**Impacto:** Sistema de dois processos — Vite dev server + print-server rodando em paralelo.

---
