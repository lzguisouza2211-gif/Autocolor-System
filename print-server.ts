// Simple Express server for printing receipts
import express from 'express';
import { render, Printer, Text } from 'react-thermal-printer';
import { connect } from 'node:net';

const app = express();
app.use(express.json());

app.post('/api/print', async (req, res) => {
  const { items, total, payment, company } = req.body;

  // Example: build receipt dynamically
  const receipt = (
    <Printer type="epson" width={42}>
      <Text size={{ width: 2, height: 2 }}>{company?.name || 'Empresa'}</Text>
      <Text bold={true}>Recibo de Venda</Text>
      <Text>------------------------------</Text>
      {items?.map((item: any, idx: number) => (
        <Text key={idx}>{item.name} x{item.qty} - R$ {item.price}</Text>
      ))}
      <Text>------------------------------</Text>
      <Text bold={true}>Total: R$ {total}</Text>
      <Text>Pagamento: {payment}</Text>
      <Text>Obrigado pela preferência!</Text>
    </Printer>
  );

  try {
    const data = await render(receipt);
    const conn = connect({
      host: '192.168.0.99', // IP da impressora
      port: 9100,
      timeout: 3000,
    }, () => {
      conn.write(Buffer.from(data), () => {
        conn.destroy();
        res.json({ success: true });
      });
    });
    conn.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Print server running on port ${PORT}`);
});
