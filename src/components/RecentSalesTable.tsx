import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const RecentSalesTable: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    const { data: salesData, error } = await supabase
      .from('sales')
      .select(`
        id, 
        total, 
        created_at, 
        sale_items!fk_sale_items_sale_id (
          product_id, 
          quantity, 
          price,
          original_price,
          discount,
          products (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && salesData) {
      setSales(salesData);
    } else {
      console.error('Erro ao buscar vendas:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="font-medium text-slate-900 text-sm sm:text-base">Vendas Recentes</h3>
        <div className="flex gap-2">
          <button className="text-xs text-slate-500 hover:text-slate-900" onClick={() => navigate('/vendas')}>Registrar Venda</button>
          <button className="text-xs text-slate-500 hover:text-slate-900" onClick={() => navigate('/historico-vendas')}>Ver todas</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando vendas...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
            <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-3 sm:px-4 py-2 tracking-wider">ID</th>
                <th className="px-3 sm:px-4 py-2 tracking-wider">Itens</th>
                <th className="px-3 sm:px-4 py-2 tracking-wider">Data</th>
                <th className="px-3 sm:px-4 py-2 tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((sale, idx) => (
                <tr key={idx}>
                  <td className="px-3 sm:px-4 py-2 font-mono text-xs text-slate-400">#{sale.id}</td>
                  <td className="px-3 sm:px-4 py-2 text-slate-500 text-xs sm:text-sm">
                    {sale.sale_items && sale.sale_items.length > 0
                      ? sale.sale_items.map((item: any) => 
                          `${item.quantity}x ${item.products?.name || `Produto ${item.product_id}`}`
                        ).join(', ')
                      : '-'}
                  </td>
                  <td className="px-3 sm:px-4 py-2 text-slate-500 text-xs sm:text-sm">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-3 sm:px-4 py-2 text-right font-normal text-slate-900 text-xs sm:text-sm">R$ {Number(sale.total).toFixed(2)}</td>
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
