const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Detecta se está no Linux ou Windows
const isLinux = process.platform === 'linux';

let escpos;
let escposUsb;
let Printer;

// Só carrega a biblioteca escpos no Windows
if (!isLinux) {
  try {
    escpos = require('escpos');
    escposUsb = require('escpos-usb');
    escpos.USB = escposUsb;
    Printer = escpos.Printer;
    console.log('✅ Biblioteca ESC/POS carregada com sucesso');
  } catch (err) {
    console.warn('⚠️  Biblioteca ESC/POS não disponível. Modo teste ativado.');
    console.warn('   Execute: npm install escpos escpos-usb');
  }
}

const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json());

// Função para encontrar impressora USB
function findPrinterDevice() {
  if (!escpos || !escposUsb) {
    throw new Error('Biblioteca ESC/POS não carregada');
  }
  
  const devices = escposUsb.findPrinter();
  
  if (devices.length === 0) {
    throw new Error('Nenhuma impressora USB ESC/POS encontrada. Verifique se a impressora está conectada.');
  }
  
  console.log(`🔍 Encontradas ${devices.length} impressora(s) USB`);
  
  // Retorna a primeira impressora encontrada
  return new escposUsb(devices[0].vendorId, devices[0].productId);
}

app.post('/api/print', async (req, res) => {
  const { items, total, payment, company } = req.body;

  // Data e hora atual
  const now = new Date();
  const dataHora = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

  // Modo teste no Linux
  if (isLinux) {
    const testData = {
      company: company?.name || 'AutoColor',
      data: dataHora,
      items,
      total,
      payment
    };
    fs.writeFileSync('recibo-teste.txt', JSON.stringify(testData, null, 2));
    console.log('✅ Recibo salvo em recibo-teste.txt (modo teste Linux)');
    return res.json({ success: true, message: 'Recibo gerado (teste)', file: 'recibo-teste.txt' });
  }

  // Impressão real no Windows via USB
  if (!escpos || !Printer) {
    return res.status(500).json({ 
      success: false, 
      error: 'Biblioteca ESC/POS não disponível. Execute: npm install escpos escpos-usb' 
    });
  }

  try {
    const device = findPrinterDevice();
    const printer = new Printer(device);
    
    device.open(function(error) {
      if (error) {
        console.error('❌ Erro ao abrir dispositivo USB:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
      
      try {
        // Cabeçalho
        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text(company?.name || 'AutoColor')
          .size(1, 1)
          .style('normal')
          .text('Recibo de Venda')
          .text(dataHora)
          .text('----------------------------------------')
          .align('lt');
        
        // Itens
        if (items && items.length > 0) {
          items.forEach(item => {
            const itemName = `${item.name} x${item.qty}`;
            const itemPrice = `R$ ${Number(item.price).toFixed(2)}`;
            const spaces = 42 - itemName.length - itemPrice.length;
            printer.text(itemName + ' '.repeat(Math.max(1, spaces)) + itemPrice);
          });
        }
        
        // Total
        printer
          .text('----------------------------------------')
          .align('ct')
          .style('b')
          .size(1, 1)
          .text(`TOTAL: R$ ${Number(total).toFixed(2)}`)
          .style('normal')
          .text(`Pagamento: ${payment}`)
          .feed(2)
          .text('Obrigado pela preferencia!')
          .feed(1)
          .cut()
          .close();
        
        console.log('✅ Impressão enviada com sucesso via USB');
        res.json({ success: true, message: 'Impresso com sucesso' });
        
      } catch (printError) {
        console.error('❌ Erro durante impressão:', printError);
        res.status(500).json({ success: false, error: printError.message });
      }
    });
    
  } catch (err) {
    console.error('❌ Erro ao inicializar impressão:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('');
  console.log('============================================');
  console.log('🖨️  Servidor de Impressão AutoColor');
  console.log('============================================');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`📍 Plataforma: ${process.platform}`);
  console.log(`🔧 Modo: ${isLinux ? 'TESTE (Linux - salva arquivo)' : 'PRODUÇÃO (Windows - USB)'}`);
  
  if (!isLinux && escpos) {
    try {
      const devices = escposUsb.findPrinter();
      console.log(`🖨️  Impressoras USB encontradas: ${devices.length}`);
      if (devices.length > 0) {
        console.log('✅ Sistema pronto para imprimir!');
      } else {
        console.log('⚠️  ATENÇÃO: Nenhuma impressora USB detectada');
        console.log('   Conecte a impressora térmica USB');
      }
    } catch (e) {
      console.log('⚠️  Erro ao verificar impressoras:', e.message);
    }
  }
  
  console.log('============================================');
  console.log('');
});
