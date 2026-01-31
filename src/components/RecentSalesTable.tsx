import React, { useState, useEffect } from 'react';
import SaleForm from './SaleForm';
import { supabase } from '../supabase';



const RecentSalesTable: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    const { data: salesData, error } = await supabase
      .from('sales')
      .select('id, total, created_at, sale_items ( product_id, quantidade, preco_unitario )')
      .order('created_at', { ascending: false });
    if (!error && salesData) {
      setSales(salesData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Vendas Recentes</h3>
        <div className="flex gap-2">
          <button className="text-xs text-slate-500 hover:text-slate-900" onClick={() => setShowForm(true)}>Registrar Venda</button>
          <button className="text-xs text-slate-500 hover:text-slate-900">Ver todas</button>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <SaleForm onSave={() => setShowForm(false)} />
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setShowForm(false)}>
              ×
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando vendas...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-2 tracking-wider">ID</th>
                <th className="px-4 py-2 tracking-wider">Itens</th>
                <th className="px-4 py-2 tracking-wider">Data</th>
                <th className="px-4 py-2 tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">#{sale.id}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {sale.sale_items && sale.sale_items.length > 0
                      ? sale.sale_items.map((item: any) => `${item.quantidade}x Produto ${item.product_id}`).join(', ')
                      : '-'}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right font-normal text-slate-900">R$ {Number(sale.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentSalesTable;
