import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

interface SaleDetail {
  id: number;
  total: number;
  created_at: string;
  users?: {
    name: string | null;
    email: string;
  };
  sale_items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    original_price: number;
    discount: number;
    custom_name?: string | null;
    products: {
      name: string;
    };
  }>;
}

const SalesHistory: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    checkAdminStatus();
    fetchAllSales();
  }, [user]);

  // Controlar overflow do body quando modal está aberto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

  const checkAdminStatus = async () => {
    if (!user?.email) return;
    
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    setIsAdmin(data?.role === 'admin');
  };

  const fetchAllSales = async () => {
    setLoading(true);
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        id, 
        total, 
        created_at,
        user_id,
        sale_items!fk_sale_items_sale_id (
          product_id, 
          quantity, 
          price,
          original_price,
          discount,
          custom_name,
          products (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (salesData) {
      // Buscar informações dos usuários manualmente
      const salesWithUsers = await Promise.all(
        salesData.map(async (sale) => {
          if (sale.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', sale.user_id)
              .single();
            return { ...sale, users: userData };
          }
          return { ...sale, users: null };
        })
      );
      setSales(salesWithUsers as any);
    }
    setLoading(false);
  };

  const calculateTotalDiscount = (saleItems: any[]) => {
    return saleItems.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  };

  const openSaleDetail = (sale: SaleDetail) => {
    setSelectedSale(sale);
    setShowModal(true);
    setEditMode(false);
    setEditedItems(sale.sale_items.map(item => ({ ...item })));
  };

  const closeSaleDetail = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const { loading: authLoading } = useAuth();
  if (authLoading || !user) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500">Carregando...</div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Acesso Restrito</h1>
          <p className="text-sm text-slate-500 mt-1">Apenas administradores podem visualizar o histórico de vendas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Histórico de Vendas</h1>
        <p className="text-sm text-slate-500 mt-1">Clique em uma venda para ver detalhes completos</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando vendas...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma venda registrada</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 min-w-[500px]">
              <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3 tracking-wider">ID</th>
                  <th className="px-4 py-3 tracking-wider">Data</th>
                  <th className="px-4 py-3 tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{sale.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')} {' '}
                      <span className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      R$ {parseFloat(sale.total.toString()).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openSaleDetail(sale)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Detalhes da Venda #{selectedSale.id}</h2>
              <button
                onClick={closeSaleDetail}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">ID da Venda</p>
                  <p className="text-sm font-semibold text-slate-900">#{selectedSale.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Data e Hora</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(selectedSale.created_at).toLocaleDateString('pt-BR')} - {new Date(selectedSale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Vendedor</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedSale.users?.name || selectedSale.users?.email || 'Não informado'}
                  </p>
                  {selectedSale.users?.name && (
                    <p className="text-xs text-slate-400">{selectedSale.users.email}</p>
                  )}
                </div>
              </div>

              {/* Itens da venda */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Itens</h3>
                <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                  {editMode ? (
                    editedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
                        <div className="flex-1">
                          <input
                            className="text-sm text-slate-900 border rounded px-2 py-1 w-full mb-1"
                            value={item.custom_name ?? (item.products?.name || `Produto ${item.product_id}`)}
                            onChange={e => {
                              const val = e.target.value;
                              setEditedItems(items => items.map((it, i) => i === idx ? { ...it, custom_name: val } : it));
                            }}
                          />
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min={1}
                              className="w-16 border rounded px-1 py-0.5 text-xs"
                              value={item.quantity}
                              onChange={e => {
                                const val = Math.max(1, Number(e.target.value));
                                setEditedItems(items => items.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                              }}
                            />
                            <span className="text-xs">x</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-20 border rounded px-1 py-0.5 text-xs"
                              value={item.price}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setEditedItems(items => items.map((it, i) => i === idx ? { ...it, price: val } : it));
                              }}
                            />
                            <span className="text-xs">Desconto:</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-16 border rounded px-1 py-0.5 text-xs"
                              value={item.discount}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setEditedItems(items => items.map((it, i) => i === idx ? { ...it, discount: val } : it));
                              }}
                            />
                          </div>
                        </div>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => setEditedItems(items => items.filter((_, i) => i !== idx))}
                        >Remover</button>
                      </div>
                    ))
                  ) : (
                    selectedSale.sale_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{item.custom_name?.trim() ? item.custom_name : (item.products?.name || `Produto ${item.product_id}`)}</p>
                          <p className="text-xs text-slate-500">{item.quantity}x R$ {parseFloat(item.price.toString()).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">R$ {(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-orange-600">Desc: R$ {(item.discount * item.quantity).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resumo financeiro */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                </div>
                {calculateTotalDiscount(selectedSale.sale_items) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Desconto total:</span>
                    <span className="font-medium text-orange-600">- R$ {calculateTotalDiscount(selectedSale.sale_items).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base border-t border-gray-200 pt-2">
                  <span className="font-semibold text-slate-900">Total:</span>
                  <span className="font-bold text-slate-900">R$ {parseFloat(selectedSale.total.toString()).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                {!editMode && (
                  <>
                    <button
                      onClick={async () => {
                        // Chamar endpoint de impressão
                        try {
                          await fetch('http://localhost:4000/api/print', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              items: selectedSale.sale_items.map(item => ({
                                name: item.custom_name?.trim() ? item.custom_name : (item.products?.name || `Produto ${item.product_id}`),
                                qty: item.quantity,
                                price: item.price
                              })),
                              total: selectedSale.total,
                              payment: 'N/A',
                              company: { name: 'AutoColor' }
                            })
                          });
                          alert('Pedido enviado para impressão!');
                        } catch (err) {
                          alert('Erro ao imprimir pedido. Verifique o servidor de impressão.');
                        }
                      }}
                      className="w-full sm:w-auto bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                      Imprimir
                    </button>
                    <button
                      onClick={closeSaleDetail}
                      className="w-full sm:w-auto bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition font-medium text-sm"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-full sm:w-auto bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition font-medium text-sm"
                    >
                      Editar Venda
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Tem certeza que deseja deletar esta venda? Esta ação não pode ser desfeita.')) return;
                        try {
                          // 1. Devolver estoque dos produtos
                          // Buscar estoque atual de cada produto antes de atualizar
                          await Promise.all(selectedSale.sale_items.map(async item => {
                            const { data: product, error: prodError } = await supabase
                              .from('products')
                              .select('stock')
                              .eq('id', item.product_id)
                              .single();
                            if (prodError || !product) return;
                            return supabase
                              .from('products')
                              .update({ stock: product.stock + item.quantity })
                              .eq('id', item.product_id);
                          }));

                          // 2. Deletar a venda
                          const { error } = await supabase
                            .from('sales')
                            .delete()
                            .eq('id', selectedSale.id);
                          if (error) {
                            alert('Erro ao deletar venda: ' + error.message);
                            return;
                          }
                          alert('Venda deletada com sucesso!');
                          setShowModal(false);
                          fetchAllSales();
                        } catch (err) {
                          alert('Erro inesperado ao deletar venda.');
                        }
                      }}
                      className="w-full sm:w-auto bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
                    >
                      Deletar Venda
                    </button>
                  </>
                )}
                {editMode && (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="w-full sm:w-auto bg-slate-400 text-white py-2 rounded-lg hover:bg-slate-500 transition font-medium text-sm"
                    >
                      Cancelar Edição
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedSale) return;
                        // Mapear itens antigos e novos por product_id
                        const oldItems = selectedSale.sale_items;
                        const newItems = editedItems;
                        // 1. Atualizar estoque conforme diferença de quantidade
                        for (const oldItem of oldItems) {
                          const newItem = newItems.find(i => i.product_id === oldItem.product_id);
                          if (newItem) {
                            const diff = newItem.quantity - oldItem.quantity;
                            if (diff !== 0) {
                              // Buscar estoque atual
                              const { data: product, error: prodError } = await supabase
                                .from('products')
                                .select('stock')
                                .eq('id', oldItem.product_id)
                                .single();
                              if (!prodError && product) {
                                await supabase
                                  .from('products')
                                  .update({ stock: product.stock - diff })
                                  .eq('id', oldItem.product_id);
                              }
                            }
                          } else {
                            // Item removido: devolver estoque
                            const { data: product, error: prodError } = await supabase
                              .from('products')
                              .select('stock')
                              .eq('id', oldItem.product_id)
                              .single();
                            if (!prodError && product) {
                              await supabase
                                .from('products')
                                .update({ stock: product.stock + oldItem.quantity })
                                .eq('id', oldItem.product_id);
                            }
                          }
                        }
                        // Novos itens adicionados
                        for (const newItem of newItems) {
                          if (!oldItems.find(i => i.product_id === newItem.product_id)) {
                            // Buscar estoque atual
                            const { data: product, error: prodError } = await supabase
                              .from('products')
                              .select('stock')
                              .eq('id', newItem.product_id)
                              .single();
                            if (!prodError && product) {
                              await supabase
                                .from('products')
                                .update({ stock: product.stock - newItem.quantity })
                                .eq('id', newItem.product_id);
                            }
                          }
                        }
                        // 2. Atualizar itens da venda (deletar todos e inserir novos)
                        await supabase
                          .from('sale_items')
                          .delete()
                          .eq('sale_id', selectedSale.id);
                        await supabase
                          .from('sale_items')
                          .insert(newItems.map(item => ({
                            sale_id: selectedSale.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            price: item.price,
                            original_price: item.original_price ?? item.price,
                            discount: item.discount,
                            custom_name: item.custom_name ?? null
                          })));
                        // 3. Atualizar total da venda
                        const newTotal = newItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
                        await supabase
                          .from('sales')
                          .update({ total: newTotal })
                          .eq('id', selectedSale.id);
                        alert('Venda atualizada com sucesso!');
                        setEditMode(false);
                        fetchAllSales();
                      }}
                      className="w-full sm:w-auto bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
                    >
                      Salvar Alterações
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;

