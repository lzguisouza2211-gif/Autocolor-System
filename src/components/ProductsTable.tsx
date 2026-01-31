
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../supabase';
import ProductForm from './ProductForm';

type Product = {
  id: number;
  name: string;
  category: string;
  mark?: string;
  price: number;
  price_sale?: number;
  venda?: number; // legacy, fallback
  stock: number;
  deleted_at?: string | null;
};

const ProductsTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null);
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleNew = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    fetchProducts();
  };

  // Soft delete
  const handleDelete = async (productId: number) => {
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', productId);
    fetchProducts();
  };

  // Filtro de busca
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.mark || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2" onClick={handleNew}>
          <Icon icon="solar:add-circle-linear" width={18} /> <span>Novo Produto</span>
        </button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
            <ProductForm product={editProduct} onSave={handleSave} />
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setShowForm(false)}>
              <Icon icon="solar:close-circle-linear" width={24} />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando produtos...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></th>
                <th className="px-4 py-3 tracking-wider">Produto</th>
                <th className="px-4 py-3 tracking-wider">Categoria</th>
                <th className="px-4 py-3 tracking-wider">Marca</th>
                <th className="px-4 py-3 tracking-wider text-right">Custo</th>
                <th className="px-4 py-3 tracking-wider text-right">Venda</th>
                <th className="px-4 py-3 tracking-wider text-center">Estoque</th>
                <th className="px-4 py-3 tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                // Barra de estoque
                const estoquePercent = Math.min(100, Math.round((product.stock / 100) * 100));
                let estoqueColor = 'bg-emerald-500';
                if (product.stock <= 5) estoqueColor = 'bg-red-500';
                else if (product.stock <= 10) estoqueColor = 'bg-yellow-400';

                return (
                  <tr key={product.id} className="group hover:bg-slate-50/50">
                    <td className="px-4 py-4"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-400">
                          <Icon icon="solar:box-linear" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">{product.category}</span></td>
                    <td className="px-4 py-4"><span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{product.mark}</span></td>
                    <td className="px-4 py-4 text-right">
                      R$ {typeof product.price === 'number' ? product.price.toFixed(2) : (Number(product.price) ? Number(product.price).toFixed(2) : '0.00')}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-slate-900">
                      R$ {typeof product.price_sale === 'number' ? product.price_sale.toFixed(2) : (typeof product.venda === 'number' ? product.venda.toFixed(2) : (Number(product.price_sale) ? Number(product.price_sale).toFixed(2) : '0.00'))}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-slate-900 font-medium ${product.stock <= 5 ? 'text-red-600 font-bold' : product.stock <= 10 ? 'text-yellow-600 font-bold' : ''}`}>{typeof product.stock === 'number' ? product.stock : (Number(product.stock) || 0)}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${estoqueColor}`} style={{ width: `${estoquePercent}%` }}></div>
                        </div>
                        {product.stock <= 10 && (
                          <span className={`ml-2 px-2 py-0.5 rounded ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} text-xs font-semibold`}>
                            {product.stock <= 5 ? 'Estoque Mínimo' : 'Estoque Baixo'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right flex gap-2 justify-end">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => handleEdit(product)}><Icon icon="solar:pen-linear" width={18} /></button>
                      <button className="text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(product.id)}><Icon icon="solar:trash-bin-minimalistic-linear" width={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductsTable;
