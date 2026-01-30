import React from 'react';

// Hook para simular produtos
function useProducts() {
  return [
    {
      id: 1,
      nome: 'Verniz Alto Sólidos 5L',
      codigo: '89332',
      categoria: 'Vernizes',
      custo: 'R$ 120,00',
      venda: 'R$ 210,00',
      estoque: 42,
      estoquePercent: 80,
    },
    {
      id: 2,
      nome: 'Tinta Poliéster Preto Ninja',
      codigo: '12290',
      categoria: 'Tintas',
      custo: 'R$ 80,00',
      venda: 'R$ 150,00',
      estoque: 15,
      estoquePercent: 30,
    },
  ];
}

const ProductsTable: React.FC = () => {
  const products = useProducts();

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16"></iconify-icon>
          <input type="text" placeholder="Buscar por nome, código ou categoria..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></th>
              <th className="px-6 py-3 tracking-wider">Produto</th>
              <th className="px-6 py-3 tracking-wider">Categoria</th>
              <th className="px-6 py-3 tracking-wider text-right">Custo</th>
              <th className="px-6 py-3 tracking-wider text-right">Venda</th>
              <th className="px-6 py-3 tracking-wider text-center">Estoque</th>
              <th className="px-6 py-3 tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="group hover:bg-slate-50/50">
                <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-400">
                      <iconify-icon icon="solar:gallery-linear"></iconify-icon>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{product.nome}</div>
                      <div className="text-xs text-slate-400">Cod: {product.codigo}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">{product.categoria}</span></td>
                <td className="px-6 py-4 text-right">{product.custo}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">{product.venda}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-slate-900 font-medium">{product.estoque}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${product.estoquePercent}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors"><iconify-icon icon="solar:pen-linear" width="18"></iconify-icon></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;
