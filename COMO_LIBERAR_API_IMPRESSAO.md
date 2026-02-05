# Como liberar a API de impressão no PC do cliente

## Pré-requisitos
- Node.js instalado (versão 18 ou superior recomendada)
- Impressora térmica Bematech MP-4200 HS conectada via USB e driver instalado
- O arquivo `print-server.cjs` no projeto

## Passos para liberar a API (Linux)

1. **Instale as dependências**
   Abra o terminal na pasta do projeto e execute:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure o nome da impressora**
   No arquivo `print-server.cjs`, verifique se o nome da impressora está correto:
   ```js
   printer.printDirect({
     data: Buffer.from(data),
     printer: 'Bematech MP-4200 HS', // nome exato da impressora instalada
     type: 'RAW',
     ...
   });
   ```

3. **Inicie a API**
   Execute o comando abaixo para rodar o servidor:
   ```bash
   node print-server.cjs
   ```
   O servidor vai rodar na porta 4000. Deixe esse terminal aberto enquanto o sistema estiver em uso.

4. **Permitir acesso no firewall**
   Certifique-se de que a porta 4000 está liberada no firewall do Linux.

## Passos para liberar a API (Windows)

1. **Instale o Node.js**
   Baixe e instale o Node.js pelo site oficial: https://nodejs.org

2. **Instale o driver da impressora**
   Instale o driver da Bematech MP-4200 HS no Windows conectando via USB. Certifique-se de que a impressora está funcionando antes de prosseguir.

3. **Abra o Prompt de Comando**
   Navegue até a pasta do projeto usando o comando:
   ```cmd
   cd C:\caminho\para\AutoColor-System
   ```

4. **Instale as dependências**
   ```cmd
   npm install --legacy-peer-deps
   ```

5. **Configure o nome da impressora**
   Edite o arquivo `print-server.cjs` e verifique se o nome da impressora está correto (deve ser exatamente como aparece no Windows):
   ```js
   printer: 'Bematech MP-4200 HS', // nome exato da impressora instalada
   ```

6. **Inicie a API**
   Execute:
   ```cmd
   node print-server.cjs
   ```
   O servidor vai rodar na porta 4000. Deixe essa janela aberta enquanto o sistema estiver em uso.

7. **Permitir acesso no firewall**
   Libere a porta 4000 no firewall do Windows (Painel de Controle > Sistema e Segurança > Firewall > Regras de Entrada).

## Configuração do sistema
O sistema React deve estar configurado para enviar os pedidos para o endereço do servidor de impressão (exemplo: `http://localhost:4000/api/print`).

## Observações
- O servidor de impressão deve rodar sempre no computador onde a impressora USB está conectada.
- Agora o arquivo usado é o `print-server.cjs` (JavaScript puro), que imprime diretamente via USB usando o driver instalado no Windows.
- A impressora deve estar instalada e funcionando no Windows antes de rodar a API.
- O nome da impressora no código (`'Bematech MP-4200 HS'`) deve ser exatamente igual ao nome que aparece nas configurações de impressoras do Windows.

## Como verificar o nome correto da impressora no Windows
1. Abra "Configurações" > "Dispositivos" > "Impressoras e scanners"
2. Veja o nome exato da impressora (exemplo: "Bematech MP-4200 HS")
3. Use esse nome exatamente no arquivo `print-server.cjs`

## Suporte
Em caso de dúvidas, entre em contato com o suporte técnico.
