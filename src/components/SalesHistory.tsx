

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';

interface SaleDetail {
  id: number;
  total: number;
  created_at: string;
  payment_status?: 'paid' | 'pending';
  paid_at?: string | null;
  customer_id?: number | null;
  users?: {
    name: string | null;
    email: string;
  };
  customers?: {
    full_name: string;
    cpf: string | null;
    cnpj: string | null;
    phone: string | null;
    street: string | null;
    address_number: string | null;
    neighborhood: string | null;
  } | null;
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

interface CustomerOption {
  id: number;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
}

interface CustomerRow {
  id: number;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
}

type EditedItem = SaleDetail['sale_items'][number] & { custom_name?: string | null };

const SalesHistory: React.FC = () => {
      // Modal de confirmação de exclusão
      const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
      const [deleteLoading, setDeleteLoading] = useState(false);
    // Produtos para autocomplete (via contexto global)
    const { products } = useProducts();
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Estados principais
    const { user } = useAuth();
    const [sales, setSales] = useState<SaleDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedItems, setEditedItems] = useState<EditedItem[]>([]);
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [editedCustomerId, setEditedCustomerId] = useState<number | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

  // Produtos filtrados para busca
  const filteredProducts = products.filter(p => {
    const s = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s) ||
      (p.mark || '').toLowerCase().includes(s) ||
      (p.barcode || '').toLowerCase().includes(s)
    );
  });

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

  useEffect(() => {
    if (!editMode) return;
    setLoadingCustomers(true);
    supabase
      .from('customers')
      .select('id, full_name, cpf, cnpj, phone')
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao buscar clientes:', error);
          setCustomers([]);
        } else {
          setCustomers((data || []) as CustomerOption[]);
        }
        setLoadingCustomers(false);
      });
  }, [editMode]);

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
        payment_status,
        paid_at,
        user_id,
        customer_id,
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
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!salesData) {
      setLoading(false);
      return;
    }

    // Coleta IDs únicos e busca usuários + clientes em paralelo (resolve N+1)
    const userIds = [...new Set(salesData.map(s => s.user_id).filter(Boolean))] as string[];
    const customerIds = [...new Set(salesData.map(s => s.customer_id).filter(Boolean))] as number[];

    const [usersResult, customersResult] = await Promise.all([
      userIds.length > 0
        ? supabase.from('users').select('id, name, email').in('id', userIds)
        : Promise.resolve({ data: [] as UserRow[] }),
      customerIds.length > 0
        ? supabase.from('customers').select('id, full_name, cpf, cnpj, phone, street, address_number, neighborhood').in('id', customerIds)
        : Promise.resolve({ data: [] as CustomerRow[] }),
    ]);

    const usersMap = new Map<string, UserRow>((usersResult.data as UserRow[] || []).map(u => [u.id, u]));
    const customersMap = new Map<number, CustomerRow>((customersResult.data as CustomerRow[] || []).map(c => [c.id, c]));

    const salesWithRelations = salesData.map(sale => ({
      ...sale,
      users: sale.user_id ? (usersMap.get(sale.user_id) ?? null) : null,
      customers: sale.customer_id ? (customersMap.get(sale.customer_id) ?? null) : null,
    }));

    setSales(salesWithRelations as unknown as SaleDetail[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    checkAdminStatus();
    fetchAllSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const calculateTotalDiscount = (saleItems: SaleDetail['sale_items']) => {
    return saleItems.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  };

  const getSaleStatusInfo = (sale: SaleDetail) => {
    if (sale.payment_status === 'pending') {
      return { label: 'A prazo', badgeClass: 'bg-amber-100 text-amber-700' };
    }

    if (sale.customer_id || sale.customers) {
      return { label: 'Pago', badgeClass: 'bg-blue-100 text-blue-700' };
    }

    return { label: 'À vista', badgeClass: 'bg-emerald-100 text-emerald-700' };
  };

  const openSaleDetail = (sale: SaleDetail) => {
    setSelectedSale(sale);
    setShowModal(true);
    setEditMode(false);
    setEditedItems(sale.sale_items.map(item => ({ ...item })));
    setEditedCustomerId(sale.customer_id ?? null);
  };

  const closeSaleDetail = () => {
    setShowModal(false);
    setSelectedSale(null);
    setEditedCustomerId(null);
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
        {/* Mobile: cards */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando vendas...</div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma venda registrada</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sales.map((sale) => {
                const statusInfo = getSaleStatusInfo(sale);
                return (
                  <div key={sale.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-400">#{sale.id}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                          {sale.customers?.full_name || 'Balcão'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(sale.created_at).toLocaleDateString('pt-BR')} {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-base font-bold text-slate-900">
                          R$ {parseFloat(sale.total.toString()).toFixed(2)}
                        </span>
                        <button
                          onClick={() => openSaleDetail(sale)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Desktop: tabela */}
        <div className="hidden lg:block overflow-x-auto">
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
                  <th className="px-4 py-3 tracking-wider">Cliente</th>
                  <th className="px-4 py-3 tracking-wider">Status</th>
                  <th className="px-4 py-3 tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => {
                  const statusInfo = getSaleStatusInfo(sale);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">#{sale.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}{' '}
                        <span className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {sale.customers?.full_name || 'Balcão'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
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
                  );
                })}
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

            <div className="p-6 space-y-6 relative">
              {/* Notificação de sucesso */}
              {success && (
                <div className="absolute top-6 right-6 bg-green-100 text-green-800 text-xs rounded px-3 py-2 shadow transition animate-fadeIn" style={{zIndex: 20}}>
                  {success}
                </div>
              )}
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
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Cliente</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedSale.customers?.full_name || 'Balcão'}
                  </p>
                  {(selectedSale.customers?.cpf || selectedSale.customers?.cnpj) && (
                    <p className="text-xs text-slate-400">
                      {selectedSale.customers?.cnpj ? 'CNPJ' : 'CPF'}: {selectedSale.customers?.cnpj || selectedSale.customers?.cpf}
                      {selectedSale.customers.phone ? ` - Tel: ${selectedSale.customers.phone}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Itens da venda */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Itens</h3>
                {editMode && (
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 mb-1 block">Cliente da venda</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                      value={editedCustomerId ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (selectedSale.payment_status === 'pending' && !value) {
                          return;
                        }
                        setEditedCustomerId(value ? Number(value) : null);
                      }}
                      disabled={loadingCustomers}
                    >
                      <option value="" disabled={selectedSale.payment_status === 'pending'}>
                        Balcão (sem cliente)
                      </option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.full_name}
                          {customer.cnpj ? ` • CNPJ: ${customer.cnpj}` : customer.cpf ? ` • CPF: ${customer.cpf}` : ''}
                        </option>
                      ))}
                    </select>
                    {loadingCustomers && (
                      <p className="text-xs text-slate-400 mt-1">Carregando clientes...</p>
                    )}
                    {selectedSale.payment_status === 'pending' && !editedCustomerId && (
                      <p className="text-xs text-amber-600 mt-1">Venda a prazo exige cliente vinculado.</p>
                    )}
                  </div>
                )}
                <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                  {editMode ? (
                    <>
                      {/* Autocomplete de produtos para adicionar item */}
                      <div className="mb-3 flex gap-2 items-center relative" style={{ position: 'relative' }}>
                        <input
                          ref={inputRef}
                          className="text-sm border rounded px-2 py-1 w-full"
                          placeholder="Adicionar produto à venda..."
                          value={productSearch}
                          onChange={e => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          onBlur={() => {
                            // Fecha dropdown ao perder foco, exceto se for clicar no dropdown
                            setTimeout(() => setShowProductDropdown(false), 120);
                          }}
                        />
                        <button
                          className="text-xs bg-blue-600 text-white rounded px-3 py-1 font-medium hover:bg-blue-700"
                          onClick={() => setShowProductDropdown(v => !v)}
                          type="button"
                        >Buscar</button>
                        {showProductDropdown && productSearch.length > 0 && (
                          <div
                            className="absolute left-0 right-0 top-full mt-1 z-[99999] bg-white border border-gray-300 rounded-lg shadow-2xl w-full max-h-60 overflow-y-auto"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 99999 }}
                            tabIndex={-1}
                          >
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map(prod => (
                                <div
                                  key={prod.id}
                                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm flex justify-between items-center transition-colors"
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => {
                                    setEditedItems(items => {
                                      const idx = items.findIndex(it => it.product_id === prod.id);
                                      if (idx !== -1) {
                                        return items.map((it, i) =>
                                          i === idx ? { ...it, quantity: it.quantity + 1 } : it
                                        );
                                      } else {
                                        return [
                                          ...items,
                                          {
                                            product_id: prod.id,
                                            quantity: 1,
                                            price: prod.price_sale ?? prod.price,
                                            original_price: prod.price_sale ?? prod.price,
                                            discount: 0,
                                            custom_name: prod.name,
                                            products: { name: prod.name }
                                          }
                                        ];
                                      }
                                    });
                                    setProductSearch('');
                                    setShowProductDropdown(false);
                                    inputRef.current?.focus();
                                  }}
                                >
                                  <span>{prod.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">Est: {prod.stock}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-slate-400">Nenhum produto encontrado</div>
                            )}
                          </div>
                        )}
                      </div>
                      {showProductDropdown && productSearch.length > 0 && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 z-[99999] bg-white border border-gray-300 rounded-lg shadow-2xl w-full max-h-60 overflow-y-auto"
                          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                          tabIndex={-1}
                        >
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(prod => (
                              <div
                                key={prod.id}
                                className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm flex justify-between items-center transition-colors"
                                onClick={() => {
                                  setEditedItems(items => {
                                    const idx = items.findIndex(it => it.product_id === prod.id);
                                    if (idx !== -1) {
                                      return items.map((it, i) =>
                                        i === idx ? { ...it, quantity: it.quantity + 1 } : it
                                      );
                                    } else {
                                      return [
                                        ...items,
                                        {
                                          product_id: prod.id,
                                          quantity: 1,
                                          price: prod.price_sale ?? prod.price,
                                          original_price: prod.price_sale ?? prod.price,
                                          discount: 0,
                                          custom_name: prod.name,
                                          products: { name: prod.name }
                                        }
                                      ];
                                    }
                                  });
                                  setProductSearch('');
                                  setShowProductDropdown(false);
                                  inputRef.current?.focus();
                                }}
                              >
                                <span>{prod.name}</span>
                                <span className="text-xs text-gray-400 ml-2">Est: {prod.stock}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">Nenhum produto encontrado</div>
                          )}
                        </div>
                      )}
                      {/* Lista de itens editáveis */}
                      {editedItems.map((item, idx) => (
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
                      ))}
                    </>
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
                          const printItems = selectedSale.sale_items.map(item => ({
                            name: item.custom_name?.trim() ? item.custom_name : (item.products?.name || `Produto ${item.product_id}`),
                            qty: item.quantity,
                            price: item.price
                          }));

                          const printCustomer = selectedSale.customers
                            ? {
                                full_name: selectedSale.customers.full_name,
                                street: selectedSale.customers.street,
                                address_number: selectedSale.customers.address_number,
                                neighborhood: selectedSale.customers.neighborhood,
                              }
                            : null;

                          const paymentLabel = getSaleStatusInfo(selectedSale).label;

                          if (selectedSale.payment_status === 'pending' && printCustomer) {
                            await fetch('http://localhost:4000/api/print', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                items: printItems,
                                total: selectedSale.total,
                                payment: paymentLabel,
                                saleType: 'a_prazo',
                                receiptType: 'customer',
                                customer: printCustomer,
                                company: { name: 'AutoColor' }
                              })
                            });

                            await fetch('http://localhost:4000/api/print', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                items: printItems,
                                total: selectedSale.total,
                                payment: paymentLabel,
                                saleType: 'a_prazo',
                                receiptType: 'owner',
                                customer: printCustomer,
                                company: { name: 'AutoColor' }
                              })
                            });
                          } else {
                            await fetch('http://localhost:4000/api/print', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                items: printItems,
                                total: selectedSale.total,
                                payment: paymentLabel,
                                saleType: selectedSale.payment_status === 'pending' ? 'a_prazo' : 'a_vista',
                                receiptType: 'default',
                                customer: printCustomer,
                                company: { name: 'AutoColor' }
                              })
                            });
                          }
                          setSuccess('Notinha foi enviada para impressão!');
                          setTimeout(() => setSuccess(null), 2000);
                        } catch {
                          setSuccess('Erro ao imprimir pedido. Verifique o servidor de impressão.');
                          setTimeout(() => setSuccess(null), 2000);
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
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full sm:w-auto bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
                    >
                      Deletar Venda
                    </button>
                        {/* Modal de confirmação de exclusão */}
                        {showDeleteConfirm && (
                          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000]">
                            <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirmar exclusão</h3>
                              <p className="text-slate-600 mb-6">Tem certeza que deseja excluir (soft delete) esta venda? O estoque será devolvido.</p>
                              <div className="flex gap-2 justify-center">
                                <button
                                  className="bg-slate-400 text-white px-4 py-2 rounded hover:bg-slate-500 font-medium"
                                  onClick={() => setShowDeleteConfirm(false)}
                                  disabled={deleteLoading}
                                >Cancelar</button>
                                <button
                                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
                                  onClick={async () => {
                                    if (!selectedSale) return;
                                    setDeleteLoading(true);
                                    try {
                                      // 1. Devolver estoque dos produtos
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
                                      // 2. Soft delete da venda e registros relacionados
                                      const { error: saleError } = await supabase
                                        .from('sales')
                                        .update({ deleted_at: new Date().toISOString() })
                                        .eq('id', selectedSale.id);
                                      const { error: itemsError } = await supabase
                                        .from('sale_items')
                                        .update({ deleted_at: new Date().toISOString() })
                                        .eq('sale_id', selectedSale.id);
                                      const { error: auditError } = await supabase
                                        .from('stock_audit')
                                        .update({ deleted_at: new Date().toISOString() })
                                        .eq('sale_id', selectedSale.id);
                                      if (saleError || itemsError || auditError) {
                                        alert('Erro ao excluir venda: ' + (saleError?.message || itemsError?.message || auditError?.message));
                                        setDeleteLoading(false);
                                        return;
                                      }
                                      // alert('Venda excluída com sucesso!');
                                      setShowModal(false);
                                      setShowDeleteConfirm(false);
                                      fetchAllSales();
                                    } catch (err) {
                                      alert('Erro inesperado ao excluir venda.');
                                      console.error('Erro inesperado ao excluir venda:', err);
                                    }
                                    setDeleteLoading(false);
                                  }}
                                  disabled={deleteLoading}
                                >{deleteLoading ? 'Excluindo...' : 'Excluir'}</button>
                              </div>
                            </div>
                          </div>
                        )}
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
                        if (selectedSale.payment_status === 'pending' && !editedCustomerId) {
                          alert('Venda a prazo não pode ser marcada como Balcão. Selecione um cliente.');
                          return;
                        }
                        // Removido: oldItems não é mais necessário
                        const newItems = editedItems;
                        // Mapear por product_id para fácil lookup
                        // Removido: oldMap e newMap não são mais necessários

                        // Removido ajuste manual de estoque: triggers do banco já controlam o estoque corretamente

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
                          .update({ total: newTotal, customer_id: editedCustomerId })
                          .eq('id', selectedSale.id);
                        // alert('Venda atualizada com sucesso!');
                        setEditMode(false);
                        // Atualizar a venda selecionada no modal e na lista
                        const { data: updatedSale } = await supabase
                          .from('sales')
                          .select(`
                            id,
                            total,
                            created_at,
                            user_id,
                            customer_id,
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
                          .eq('id', selectedSale.id)
                          .single();
                        if (updatedSale) {
                          // Buscar usuário
                          let userData = null;
                          let customerData = null;
                          if (updatedSale.user_id) {
                            const { data } = await supabase
                              .from('users')
                              .select('name, email')
                              .eq('id', updatedSale.user_id)
                              .single();
                            userData = data;
                          }
                          if (updatedSale.customer_id) {
                            const { data } = await supabase
                              .from('customers')
                              .select('full_name, cpf, cnpj, phone, street, address_number, neighborhood')
                              .eq('id', updatedSale.customer_id)
                              .maybeSingle();
                            customerData = data ?? null;
                          }
                          // Corrigir estrutura de sale_items: garantir que products seja objeto { name: string }
                          const fixedSaleItems = (Array.isArray(updatedSale.sale_items)
                            ? updatedSale.sale_items.map((item: Record<string, unknown>) => ({
                                ...item,
                                products: Array.isArray(item.products) ? (item.products[0] || { name: '' }) : item.products
                              }))
                            : []) as SaleDetail['sale_items'];
                          setSelectedSale({
                            ...updatedSale,
                            users: userData ?? undefined,
                            customers: customerData,
                            sale_items: fixedSaleItems,
                          });
                        }
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

