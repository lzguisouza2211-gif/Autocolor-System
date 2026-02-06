# Como liberar a API de impressão no PC do cliente

## Pré-requisitos
- Node.js instalado (versão 18 ou superior recomendada)
- Impressora térmica Bematech MP-4200 HS conectada via USB
- **NÃO é necessário instalar driver** - a comunicação é direta via USB
- O arquivo `print-server.cjs` no projeto

## 🖨️ NOVO: Sistema com ESC/POS USB Direto

O sistema foi atualizado para usar comunicação direta USB com a impressora, eliminando problemas de compilação de bibliotecas nativas.

**Vantagens:**
- ✅ Detecção automática da impressora USB
- ✅ Não precisa compilar bibliotecas complexas
- ✅ Funciona com qualquer impressora térmica ESC/POS
- ✅ Mais rápido e confiável

## Passos para liberar a API (Windows)

1. **Instale o Node.js**
   Baixe e instale o Node.js pelo site oficial: https://nodejs.org

2. **Conecte a impressora USB**
   - Conecte a impressora térmica via USB
   - **NÃO precisa instalar driver** - o sistema acessa diretamente
   - Aguarde o Windows reconhecer o dispositivo USB

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
4. **Instale as dependências do projeto**
   Execute o comando:
   ```cmd
   npm install
   ```
   
   O sistema irá instalar automaticamente as bibliotecas `escpos` e `escpos-usb`.

5. **Teste a detecção da impressora**
   Inicie o servidor:
   ```cmd
   node print-server.cjs
   ```
   
   Você deve ver uma mensagem similar a:
   ```
   ============================================
   🖨️  Servidor de Impressão AutoColor
   ============================================
   📡 Porta: 4000
   📍 Plataforma: win32
   🔧 Modo: PRODUÇÃO (Windows - USB)
   🖨️  Impressoras USB encontradas: 1
   ✅ Sistema pronto para imprimir!
   ============================================
   ```

6. **Permitir acesso no firewall**
   Libere a porta 4000 no firewall do Windows (Painel de Controle > Sistema e Segurança > Firewall > Regras de Entrada).

## Configuração do sistema
O sistema React deve estar configurado para enviar os pedidos para o endereço do servidor de impressão (exemplo: `http://localhost:4000/api/print`).

## Observações
- O servidor de impressão deve rodar sempre no computador onde a impressora USB está conectada.
- **NOVO:** Sistema usa comunicação USB direta (ESC/POS) - não precisa de driver
- A impressora é detectada automaticamente via USB
- Funciona com qualquer impressora térmica que suporte ESC/POS
- **Não é mais necessário** configurar o nome da impressora no código

## Solução de Problemas

### "Nenhuma impressora USB encontrada"
- Verifique se a impressora está ligada e conectada via USB
- Reconecte o cabo USB
- Verifique no Gerenciador de Dispositivos se o USB está sendo reconhecido

### "Biblioteca ESC/POS não disponível"
- Execute: `npm install escpos escpos-usb`
- Reinicie o servidor com `node print-server.cjs`

## Passos para liberar a API (Linux - Modo Teste)

No Linux, o sistema roda em modo teste e salva os recibos em arquivo:

1. **Instale as dependências**
   ```bash
   npm install
   ```

2. **Inicie o servidor**
   ```bash
   node print-server.cjs
   ```
   
   Os recibos serão salvos em `recibo-teste.txt` para teste.

## Suporte
Em caso de dúvidas, entre em contato com o suporte técnico.
