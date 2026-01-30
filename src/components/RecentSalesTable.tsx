import React from 'react';

// Hook para simular vendas recentes
function useRecentSales() {
  return [
    {
      id: '#4021',
      cliente: 'Oficina Silva & Filhos',
      itens: 'Verniz 8000, Lixa 1200...',
      status: 'Concluído',
      statusColor: 'green',
      total: 'R$ 428,50',
    },
    {
      id: '#4020',
      cliente: 'Funilaria Express',
      itens: 'Tinta Poliéster Prata...',
      status: 'Separando',
      statusColor: 'blue',
      total: 'R$ 1.250,00',
    },
    {
      id: '#4019',
      cliente: 'João Paulo (Balcão)',
      itens: 'Spray Customizado',
      status: 'Concluído',
      statusColor: 'green',
      total: 'R$ 85,00',
    },
  ];
}

const statusColors: Record<string, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const RecentSalesTable: React.FC = () => {
  const sales = useRecentSales();

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Vendas Recentes</h3>
        <button className="text-xs text-slate-500 hover:text-slate-900">Ver todas</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3 tracking-wider">ID</th>
              <th className="px-6 py-3 tracking-wider">Cliente</th>
              <th className="px-6 py-3 tracking-wider">Itens</th>
              <th className="px-6 py-3 tracking-wider">Status</th>
              <th className="px-6 py-3 tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((sale, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400">{sale.id}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{sale.cliente}</td>
                <td className="px-6 py-4">{sale.itens}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${statusColors[sale.statusColor]}`}>{sale.status}</span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">{sale.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSalesTable;
