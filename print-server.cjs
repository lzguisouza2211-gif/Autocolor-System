const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

// Detecta se está no Linux ou Windows
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json());

// Nome da impressora Windows (configure conforme necessário)
const PRINTER_NAME = process.env.PRINTER_NAME || 'Bematech MP-4200 HS(1)';

/**
 * Cria uma instância da impressora térmica
 */
function createPrinter() {
  let printer;

  if (isWindows) {
    // Configuração para Windows - impressora USB
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,  // ou STAR, TANCA dependendo da sua impressora
      interface: `printer:${PRINTER_NAME}`,
      characterSet: 'BRAZIL',
      removeSpecialCharacters: false,
      lineCharacter: '-',
      options: {
        timeout: 5000
      }
    });
  } else if (isLinux) {
    // Modo teste no Linux - salva em arquivo
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: '/dev/usb/lp0',  // Ajuste conforme necessário
      characterSet: 'BRAZIL',
      removeSpecialCharacters: false,
      lineCharacter: '-'
    });
  }

  return printer;
}

/**
 * Formata e imprime o recibo usando node-thermal-printer
 */
async function printReceipt(items, total, payment, company) {
  const printer = createPrinter();

  try {
    const now = new Date();
    const dataHora = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

    // Inicia a impressão
    printer.alignCenter();
    printer.println('========================================');
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(company?.name || 'AutoColor');
    printer.bold(false);
    printer.println('========================================');
    printer.println('Recibo de Venda');
    printer.setTextNormal();
    printer.println(dataHora);
    printer.drawLine();
    printer.newLine();

    // Alinha à esquerda para os itens
    printer.alignLeft();

    // Imprime os itens
    if (items && items.length > 0) {
      for (const item of items) {
        const itemName = `${item.name} x${item.qty}`;
        const itemPrice = `R$ ${Number(item.price).toFixed(2)}`;
        
        // Calcula espaços para alinhar o preço à direita
        const lineWidth = 42;
        const spaces = lineWidth - itemName.length - itemPrice.length;
        const line = itemName + ' '.repeat(Math.max(1, spaces)) + itemPrice;
        
        printer.println(line);
      }
    }

    printer.newLine();
    printer.drawLine();
    
    // Total e Pagamento
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(`TOTAL: R$ ${Number(total).toFixed(2)}`);
    printer.bold(false);
    printer.setTextNormal();
    printer.println(`Pagamento: ${payment}`);
    printer.drawLine();
    printer.newLine();
    
    // Mensagem final
    printer.println('Obrigado pela preferencia!');
    printer.newLine();
    printer.newLine();
    printer.newLine();
    
    // Corta o papel (se a impressora suportar)
    printer.cut();

    // Executa a impressão
    await printer.execute();
    
    console.log('✅ Impressão enviada com sucesso');
    return { success: true, message: 'Impresso com sucesso' };

  } catch (error) {
    console.error('❌ Erro ao imprimir:', error.message);
    
    // Em caso de erro no Windows, tenta salvar em arquivo para debug
    if (isWindows) {
      const receiptText = formatReceiptAsText(items, total, payment, company);
      fs.writeFileSync('recibo-erro.txt', receiptText);
    }
    
    throw error;
  }
}

/**
 * Função auxiliar para formatar recibo como texto simples (fallback)
 */
function formatReceiptAsText(items, total, payment, company) {
  const now = new Date();
  const dataHora = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
  
  let receipt = '\n';
  receipt += '========================================\n';
  receipt += `        ${company?.name || 'AutoColor'}        \n`;
  receipt += '========================================\n';
  receipt += '           Recibo de Venda           \n';
  receipt += `${dataHora}\n`;
  receipt += '----------------------------------------\n\n';
  
  if (items && items.length > 0) {
    items.forEach(item => {
      const itemName = `${item.name} x${item.qty}`;
      const itemPrice = `R$ ${Number(item.price).toFixed(2)}`;
      const spaces = 40 - itemName.length - itemPrice.length;
      receipt += itemName + ' '.repeat(Math.max(1, spaces)) + itemPrice + '\n';
    });
  }
  
  receipt += '\n----------------------------------------\n';
  receipt += `           TOTAL: R$ ${Number(total).toFixed(2)}           \n`;
  receipt += `        Pagamento: ${payment}        \n`;
  receipt += '----------------------------------------\n\n';
  receipt += '     Obrigado pela preferencia!     \n\n\n\n\n';
  
  return receipt;
}

app.post('/api/print', async (req, res) => {
  const { items, total, payment, company } = req.body;

  // Modo teste no Linux - salva em arquivo
  if (isLinux) {
    const receiptText = formatReceiptAsText(items, total, payment, company);
    fs.writeFileSync('recibo-teste.txt', receiptText);
    console.log('✅ Recibo salvo em recibo-teste.txt (modo teste Linux)');
    return res.json({ success: true, message: 'Recibo gerado (teste)', file: 'recibo-teste.txt' });
  }

  // Impressão no Windows
  if (isWindows) {
    try {
      const result = await printReceipt(items, total, payment, company);
      res.json(result);
    } catch (err) {
      console.error('❌ Erro ao imprimir:', err.message);
      
      res.status(500).json({ 
        success: false, 
        error: err.message,
        hint: `Verifique se a impressora '${PRINTER_NAME}' está instalada e conectada. Configure via variável de ambiente PRINTER_NAME se necessário.`
      });
    }
    return;
  }
  
  // Fallback
  res.status(500).json({ success: false, error: 'Plataforma não suportada' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('');
  console.log('============================================');
  console.log('🖨️  Servidor de Impressão AutoColor');
  console.log('============================================');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`📍 Plataforma: ${process.platform}`);
  console.log(`�️  Impressora: ${isWindows ? PRINTER_NAME : 'Modo teste (arquivo)'}`);
  console.log(`🔧 Modo: ${isWindows ? 'PRODUÇÃO (Windows - node-thermal-printer)' : 'TESTE (Linux - arquivo)'}`);
  console.log('✅ Sistema pronto!');
  console.log('============================================');
  console.log('');
});
