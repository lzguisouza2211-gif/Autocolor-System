# Impressão Local

## Componente ativo

O fluxo em produção local usa `print-server.cjs`.

- Endpoint: `POST /api/print`
- Porta padrão: `4000`

## Payload esperado

```json
{
  "items": [{ "name": "Produto", "qty": 1, "price": 10 }],
  "total": 10,
  "payment": "À vista",
  "company": { "name": "AutoColor" },
  "receiptType": "default",
  "saleType": "a_vista",
  "customer": {
    "full_name": "Nome Cliente",
    "street": "Rua X",
    "address_number": "123",
    "neighborhood": "Centro"
  }
}
```

## Resolução de nome do cliente

O backend aceita múltiplos campos e normaliza o nome na ordem:
- `customer.full_name`
- `customer.name`
- `customer.customer_name`
- `customer.nome`
- `customer.customers.full_name`
- fallback: `customerName` no body

## Comportamento por plataforma

### Linux

- Não imprime fisicamente.
- Salva recibo texto: `recibo-teste-<receiptType>.txt`.

### Windows

- Gera arquivo texto e envia com `copy <arquivo> COM7`.
- Retorno de sucesso: `Recibo enviado para impressora via comando copy`.

## Logs de depuração atuais

O endpoint registra payload recebido e `resolvedCustomerName` para validação de dados de cliente.

## Integração no frontend

Chamadas para impressão ocorrem em:
- `src/components/PDV.tsx`
- `src/components/SalesHistory.tsx`

Para vendas a prazo, o frontend envia duas vias:
- `receiptType: customer`
- `receiptType: owner`

## Auto start no Windows

Use `start-printer.bat` + pasta `shell:startup`.
Detalhes em `AUTOSTART_WINDOWS.md`.
