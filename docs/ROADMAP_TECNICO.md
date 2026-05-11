# Roadmap Técnico (Baseado em Lacunas Reais)

Este roadmap lista apenas pontos observados no estado atual do código.

## Prioridade Alta

1. Consolidar migrations históricas em baseline limpo
   - Existem scripts com sobreposição de funções/policies.
   - Reduz risco de ambientes novos divergirem.

2. Resolver referência sem migration (`embalagem_nome_historico`)
   - `PDV.tsx` escreve nessa tabela, mas não há script de criação.

3. Endurecer integração de impressão no Windows
   - Hoje depende de `COM7` fixo no `print-server.cjs`.
   - Tornar porta configurável por variável de ambiente.

## Prioridade Média

4. Remover ou integrar `print-server.ts`
   - Arquivo existe, mas não participa do fluxo operacional.

5. Criar script npm para impressão
   - Ex.: `npm run print-server` apontando para `node print-server.cjs`.

6. Revisar comportamento de sessão no `beforeunload`
   - Hoje há `signOut` ao fechar/recarregar página.

## Prioridade Baixa

7. Revisar componente `BarcodeScanner.tsx`
   - Estrutura atual contém trecho com retorno antecipado e listener de detecção fora do fluxo esperado.

8. Padronizar estratégias de consulta de clientes/vendas
   - Parte dos dados usa RPC; parte usa consultas diretas equivalentes.
