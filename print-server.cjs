const express = require('express');
const cors = require('cors');
const fs = require('fs');
const escpos = require('escpos');
const USB = require('escpos-usb');

// Detecta se está no Linux ou Windows
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json());

/**
 * Encontra a impressora USB conectada
 */
function findUsbPrinter() {
  try {
    const devices = USB.getDeviceList();
    if (devices && devices.length > 0) {
      return devices[0]; // Retorna a primeira impressora USB encontrada
    }
  } catch (err) {
    console.error('Erro ao procurar dispositivos USB:', err.message);
  }
  return null;
}

/**
 * Formata e imprime o recibo usando escpos
 */
async function printReceipt(items, total, payment, company) {
  const device = findUsbPrinter();
  
  if (!device) {
    throw new Error('Nenhuma impressora USB encontrada. Verifique a conexão.');
  }

  try {
    const printer = new escpos.Printer(new USB(device), { width: 42, options: { timeout: 5000 } });

    const now = new Date();
    const dataHora = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

    // Inicia a impressão
    printer
      .align('center')
      .println('========================================')
      .setTextSize(1, 1)
      .bold(true)
      .println(company?.name || 'AutoColor')
      .bold(false)
      .println('========================================')
      .println('Recibo de Venda')
      .setTextNormal()
      .println(dataHora)
      .drawLine()
      .newLine();

    // Alinha à esquerda para os itens
    printer.align('left');

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

    printer
      .newLine()
      .drawLine()
      .align('center')
      .setTextSize(1, 1)
      .bold(true)
      .println(`TOTAL: R$ ${Number(total).toFixed(2)}`)
      .bold(false)
      .setTextNormal()
      .println(`Pagamento: ${payment}`)
      .drawLine()
      .newLine()
      .println('Obrigado pela preferencia!')
      .newLine()
      .newLine()
      .newLine()
      .cut();

    // Executa a impressão
    await printer.execute();
    
    console.log('✅ Impressão enviada com sucesso');
    return { success: true, message: 'Impresso com sucesso' };

  } catch (error) {
    console.error('❌ Erro ao imprimir:', error.message);
    
    // Em caso de erro, tenta salvar em arquivo para debug
    const receiptText = formatReceiptAsText(items, total, payment, company);
    fs.writeFileSync('recibo-erro.txt', receiptText);
    
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

  // Impressão no Windows com USB
  if (isWindows) {
    try {
      const result = await printReceipt(items, total, payment, company);
      res.json(result);
    } catch (err) {
      console.error('❌ Erro ao imprimir:', err.message);
      
      res.status(500).json({ 
        success: false, 
        error: err.message,
        hint: 'Verifique se a impressora USB está conectada e ligada.'
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
  
  if (isWindows) {
    const device = findUsbPrinter();
    if (device) {
      console.log(`🖨️  Impressora USB encontrada`);
      console.log(`🔧 Modo: PRODUÇÃO (Windows - USB/ESC-POS)`);
    } else {
      console.log(`⚠️  AVISO: Nenhuma impressora USB encontrada!`);
      console.log(`🔧 Modo: ESPERA (Conecte a impressora USB)`);
    }
  } else {
    console.log(`🔧 Modo: TESTE (Linux - arquivo)`);
  }
  
  console.log('✅ Sistema pronto!');
  console.log('============================================');
  console.log('');
});
