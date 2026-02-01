import React, { useState } from 'react';
import { supabase } from '../supabase';

interface SaleItem {
  product_id: number;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  estoque: number;
}

const SaleForm: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, nome: '', quantidade: 1, preco_unitario: 0, estoque: 0 }]);
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleProductSelect = (idx: number, productId: number) => {
    const product = products.find(p => p.id === Number(productId));
    if (product) {
      setItems(items.map((item, i) =>
        i === idx ? {
          ...item,
          product_id: product.id,
          nome: product.nome,
          preco_unitario: product.venda,
          estoque: product.estoque
        } : item
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Cria a venda
      const total = items.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
      const { data: sale, error: saleError } = await supabase.from('sales').insert({ total }).select().single();
      if (saleError || !sale) throw new Error('Erro ao registrar venda');
      // 2. Cria os itens da venda
      for (const item of items) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id,
          product_id: item.product_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario
        });
        // 3. Atualiza estoque do produto
        await supabase.from('products').update({
          estoque: item.estoque - item.quantidade
        }).eq('id', item.product_id);
      }
      onSave();
    } catch (err) {
      setError('Erro ao registrar venda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
      <h2 className="text-base sm:text-lg font-bold mb-2">Registrar Venda</h2>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-end border-b pb-2 sm:border-0 sm:pb-0">
          <select className="border rounded px-2 py-2 text-sm flex-1" value={item.product_id} onChange={e => handleProductSelect(idx, Number(e.target.value))} required>
            <option value="">Selecione o produto</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          <input type="number" min={1} max={item.estoque} value={item.quantidade} onChange={e => handleItemChange(idx, 'quantidade', Number(e.target.value))} className="w-full sm:w-20 border rounded px-2 py-2 text-sm" placeholder="Qtd" required />
          <div className="flex items-center justify-between sm:contents">
            <span className="text-xs sm:text-sm">x R$ {item.preco_unitario?.toFixed(2) || '0.00'}</span>
            <span className="text-xs text-slate-500">Estoque: {item.estoque}</span>
          </div>
        </div>
      ))}
      <button type="button" className="w-full sm:w-auto bg-slate-200 px-3 py-2 rounded text-sm hover:bg-slate-300" onClick={handleAddItem}>Adicionar Produto</button>
      {error && <div className="text-red-600 text-xs sm:text-sm">{error}</div>}
      <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-indigo-700" disabled={loading || items.length === 0}>
        {loading ? 'Salvando...' : 'Registrar Venda'}
      </button>
    </form>
  );
};

export default SaleForm;
