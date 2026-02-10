
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '@iconify/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import ProductForm from './ProductForm';

type Product = {
  id: number;
  name: string;
  category: string;
  mark?: string;
  barcode?: string;
  price: number;
  price_sale?: number;
  venda?: number; // legacy, fallback
  stock: number;
  deleted_at?: string | null;
};

const ProductsTable: React.FC = () => {
  const [searchParams] = useSearchParams();
  const estoqueFilter = searchParams.get('estoque');
  const { user, loading: authLoading } = useAuth();
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
    if (!user) return;
    fetchProducts();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500">Carregando...</div>
    );
  }

  // Controlar overflow do body quando modal está aberto
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showForm]);

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
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto: ' + error.message);
      return;
    }
    fetchProducts();
  };

  // Filtro de busca
  const filteredProducts = products.filter(p => {
    // Filtro de texto
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.mark || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    
    // Filtro de estoque crítico
    const matchesEstoque = estoqueFilter === 'critico' ? p.stock <= 10 : true;
    
    return matchesSearch && matchesEstoque;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col gap-2 sm:gap-4">
        <div className="relative w-full">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} />
          <input
            type="text"
            placeholder="Buscar por nome, categoria, marca ou código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 w-full sm:w-auto" onClick={handleNew}>
          <Icon icon="solar:add-circle-linear" width={18} /> <span>Novo Produto</span>
        </button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <ProductForm product={editProduct} onSave={handleSave} />
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 z-10" onClick={() => setShowForm(false)}>
              <Icon icon="solar:close-circle-linear" width={24} />
            </button>
          </div>
        </div>
      )}
      {/* Desktop: Tabela */}
      <div className="hidden lg:block overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando produtos...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
            <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
              <tr>
                <th className="px-3 sm:px-4 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></th>
                <th className="px-3 sm:px-4 py-3 tracking-wider">Produto</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider">Categoria</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider">Marca</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider text-right">Custo</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider text-right">Venda</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider text-center">Estoque</th>
                <th className="px-3 sm:px-4 py-3 tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                // Barra de estoque
                const estoquePercent = Math.min(100, Math.round((product.stock / 10) * 100));
                let estoqueColor = 'bg-emerald-500';
                if (product.stock <= 5) estoqueColor = 'bg-red-500';
                else if (product.stock <= 10) estoqueColor = 'bg-yellow-400';

                return (
                  <tr key={product.id} className="group hover:bg-slate-50/50">
                    <td className="px-3 sm:px-4 py-3 sm:py-4"><input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /></td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-400">
                          <Icon icon="solar:box-linear" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 text-xs sm:text-sm">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4"><span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">{product.category}</span></td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4"><span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{product.mark}</span></td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-xs sm:text-sm">
                      R$ {typeof product.price === 'number' ? product.price.toFixed(2) : (Number(product.price) ? Number(product.price).toFixed(2) : '0.00')}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-slate-900 text-xs sm:text-sm">
                      R$ {typeof product.price_sale === 'number' ? product.price_sale.toFixed(2) : (typeof product.venda === 'number' ? product.venda.toFixed(2) : (Number(product.price_sale) ? Number(product.price_sale).toFixed(2) : '0.00'))}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-slate-900 font-medium text-xs sm:text-sm ${product.stock <= 5 ? 'text-red-600 font-bold' : product.stock <= 10 ? 'text-yellow-600 font-bold' : ''}`}>{typeof product.stock === 'number' ? product.stock : (Number(product.stock) || 0)}</span>
                        <div className="hidden sm:block w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${estoqueColor}`} style={{ width: `${estoquePercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right flex gap-2 justify-end">
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

      {/* Mobile: Cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando produtos...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3">
            {filteredProducts.map((product) => {
              // Barra de estoque
              const estoquePercent = Math.min(100, Math.round((product.stock / 10) * 100));
              let estoqueColor = 'bg-emerald-500';
              if (product.stock <= 5) estoqueColor = 'bg-red-500';
              else if (product.stock <= 10) estoqueColor = 'bg-yellow-400';

              return (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header: Nome e Ações */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Icon icon="solar:box-linear" width={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1" onClick={() => handleEdit(product)}>
                        <Icon icon="solar:pen-linear" width={20} />
                      </button>
                      <button className="text-slate-400 hover:text-red-600 transition-colors p-1" onClick={() => handleDelete(product.id)}>
                        <Icon icon="solar:trash-bin-minimalistic-linear" width={20} />
                      </button>
                    </div>
                  </div>

                  {/* Tags: Categoria e Marca */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {product.category}
                    </span>
                    {product.mark && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {product.mark}
                      </span>
                    )}
                  </div>

                  {/* Grid de Informações */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Preço Custo</div>
                      <div className="text-sm font-medium text-slate-900">
                        R$ {typeof product.price === 'number' ? product.price.toFixed(2) : (Number(product.price) ? Number(product.price).toFixed(2) : '0.00')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Preço Venda</div>
                      <div className="text-sm font-bold text-slate-900">
                        R$ {typeof product.price_sale === 'number' ? product.price_sale.toFixed(2) : (typeof product.venda === 'number' ? product.venda.toFixed(2) : (Number(product.price_sale) ? Number(product.price_sale).toFixed(2) : '0.00'))}
                      </div>
                    </div>
                  </div>

                  {/* Estoque com Barra */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Estoque</span>
                      <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-red-600' : product.stock <= 10 ? 'text-yellow-600' : 'text-slate-900'}`}>
                        {typeof product.stock === 'number' ? product.stock : (Number(product.stock) || 0)} un
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${estoqueColor} transition-all`} style={{ width: `${estoquePercent}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTable;
