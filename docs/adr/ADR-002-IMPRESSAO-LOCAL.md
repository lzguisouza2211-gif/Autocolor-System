# ADR-002 — Impressão via servidor local desacoplado

## Status
Aceito

## Contexto
A impressão térmica depende de infraestrutura local (porta/dispositivo da máquina da loja).

## Decisão
Manter serviço local em Node (`print-server.cjs`) recebendo payload HTTP do frontend.

## Consequências

- Frontend permanece web, sem dependência direta de driver local.
- Operação exige processo local rodando na loja.
- Comportamento por SO difere (Linux arquivo teste, Windows envio para COM).
