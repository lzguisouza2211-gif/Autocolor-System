const express = require('express');
const cors = require('cors');
const React = require('react');
const { render, Printer, Text, Br, Line, Row } = require('react-thermal-printer');
const fs = require('fs');

// Detecta se está no Linux ou Windows
const isLinux = process.platform === 'linux';
let printer;

// Só carrega a biblioteca printer no Windows
if (!isLinux) {
  try {
    printer = require('printer');
  } catch (err) {
    console.warn('Biblioteca printer não disponível. Modo teste ativado.');
  }
}

const app = express();
app.use(cors()); // Permite requisições do frontend
app.use(express.json());

app.post('/api/print', async (req, res) => {
  const { items, total, payment, company } = req.body;

  // Data e hora atual
  const now = new Date();
  const dataHora = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

  // Montar recibo usando React.createElement
  const receipt = React.createElement(
    Printer,
    { type: 'epson', width: 42 },
    React.createElement(Text, { size: { width: 2, height: 2 } }, company?.name || 'AutoColor'),
    React.createElement(Text, { bold: true }, 'Recibo de Venda'),
    React.createElement(Text, { align: 'center' }, dataHora),
    React.createElement(Br),
    React.createElement(Line),
    ...(items?.map((item) => 
      React.createElement(Row, { 
        left: `${item.name} x${item.qty}`, 
        right: `R$ ${Number(item.price).toFixed(2)}` 
      })
    ) || []),
    React.createElement(Line),
    React.createElement(Text, { bold: true }, `Total: R$ ${Number(total).toFixed(2)}`),
    React.createElement(Text, null, `Pagamento: ${payment}`),
    React.createElement(Br),
    React.createElement(Text, { align: 'center' }, 'Obrigado pela preferência!')
  );

  try {
    const data = await render(receipt);
    
    // No Linux: salva em arquivo para teste
    if (isLinux || !printer) {
      fs.writeFileSync('recibo-teste.bin', Buffer.from(data));
      console.log('✅ Recibo salvo em recibo-teste.bin (modo teste Linux)');
      console.log('Dados do recibo:', { items, total, payment, company });
      res.json({ success: true, message: 'Recibo gerado (teste)', file: 'recibo-teste.bin' });
    } else {
      // No Windows: imprime de verdade
      printer.printDirect({
        data: Buffer.from(data),
        printer: 'Bematech MP-4200 HS', // nome exato da impressora instalada no Windows
        type: 'RAW',
        success: function(jobID) {
          console.log('✅ Impressão enviada com sucesso. Job ID:', jobID);
          res.json({ success: true, jobID });
        },
        error: function(err) {
          console.error('❌ Erro ao imprimir:', err);
          res.status(500).json({ success: false, error: err });
        }
      });
    }
  } catch (err) {
    console.error('❌ Erro ao gerar recibo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🖨️  Print server running on port ${PORT}`);
  console.log(`📍 Plataforma: ${process.platform}`);
  console.log(`🔧 Modo: ${isLinux ? 'TESTE (Linux - salva arquivo)' : 'PRODUÇÃO (Windows - imprime)'}`);
});
