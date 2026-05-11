# Auto start do servidor de impressão (Windows)

## Arquivo usado

- `start-printer.bat`

Esse script:
- usa a própria pasta do `.bat` (`%~dp0`), então é portátil entre máquinas;
- verifica se `node` está disponível;
- valida se `print-server.cjs` existe;
- reinicia automaticamente o servidor se o processo cair.

## Pré-requisitos

1. Node.js instalado e no PATH.
2. Pasta do projeto contendo `print-server.cjs` e `start-printer.bat`.

## Método recomendado (Startup folder)

1. Pressione `Win + R`.
2. Digite `shell:startup`.
3. Crie um atalho para `start-printer.bat` nessa pasta.
4. Reinicie o Windows para validar.

## Como validar

- Ao logar no Windows, deve abrir uma janela com o título:
  `AutoColor - Servidor de Impressao (Rodando...)`
- O log deve mostrar: `Sistema pronto!`.

## Desabilitar

- Remova o atalho da pasta `shell:startup`.

## Troubleshooting

### Janela fecha rapidamente

- Node.js não está no PATH.
- `print-server.cjs` não está na mesma pasta do `start-printer.bat`.

### Servidor não sobe

- Execute `start-printer.bat` manualmente e leia a mensagem de erro exibida no console.
