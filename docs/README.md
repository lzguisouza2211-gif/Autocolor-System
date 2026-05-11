# Documentação Técnica — AutoColor System

Este diretório foi reorganizado para refletir exclusivamente o estado atual do código.

## Índice

- [Visão geral do sistema](./SYSTEM_OVERVIEW.md)
- [Arquitetura e módulos](./ARQUITETURA_E_MODULOS.md)
- [Banco de dados e regras](./BANCO_DE_DADOS.md)
- [Autenticação e autorização](./AUTENTICACAO_E_AUTORIZACAO.md)
- [Impressão local](./IMPRESSAO.md)
- [Setup local e operação](./SETUP_LOCAL_E_OPERACAO.md)
- [Onboarding técnico](./ONBOARDING.md)
- [Roadmap técnico real](./ROADMAP_TECNICO.md)
- [Diagramas](./diagrams/FLUXOS.md)
- ADRs:
  - [ADR-001 — Frontend direto no Supabase](./adr/ADR-001-FRONTEND-SUPABASE.md)
  - [ADR-002 — Impressão local desacoplada](./adr/ADR-002-IMPRESSAO-LOCAL.md)
  - [ADR-003 — Crédito/contas a receber em `sales`](./adr/ADR-003-CREDITO-NO-SALES.md)

## Escopo

A documentação cobre:
- arquitetura real do frontend e backend local;
- integrações existentes (Supabase, ViaCEP e API local de impressão);
- regras de negócio implementadas hoje;
- comandos e setup realmente usados no projeto.

Não há documentação de funcionalidades hipotéticas neste diretório.
