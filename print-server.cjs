const express = require('express');
const cors = require('cors');
const fs = require('fs');
const escpos = require('escpos');

// Detecta se está no Linux ou Windows
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json());

/**
 * Encontra a impressora USB conectada
 */


/**
 * Formata e imprime o recibo usando escpos
 */
async function printReceipt(items, total, payment, company) {
  // Para Windows, detecta se impressora está como USB ou Serial (COM)
  if (isWindows) {
    try {
      // Gera recibo em arquivo texto
      const receiptText = formatReceiptAsText(items, total, payment, company);
      const filePath = 'recibo-print.txt';
      fs.writeFileSync(filePath, receiptText);
      // Executa comando para enviar arquivo para impressora
      const { exec } = require('child_process');
      exec(`copy ${filePath} COM5`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Erro ao imprimir via comando copy:', error.message);
          return;
        }
        console.log('✅ Recibo enviado para impressora COM5');
      });
      return { success: true, message: 'Recibo enviado para impressora via comando copy' };
    } catch (error) {
      console.error('❌ Erro ao imprimir:', error.message);
      const receiptText = formatReceiptAsText(items, total, payment, company);
      fs.writeFileSync('recibo-erro.txt', receiptText);
      throw error;
    }
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
    console.log('🖨️  Impressora: USB (detecção automática)');
    console.log('🔧 Modo: PRODUÇÃO (Windows - escpos-usb)');
  } else {
    console.log('🖨️  Impressora: Modo teste (arquivo)');
    console.log('🔧 Modo: TESTE (Linux - arquivo)');
  }
  console.log('✅ Sistema pronto!');
  console.log('============================================');
  console.log('');
});
