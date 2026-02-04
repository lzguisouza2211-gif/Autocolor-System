import React, { useEffect, useRef, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  price: number;
  price_sale?: number;
  stock: number;
  barcode?: string;
  category?: string;
  mark?: string;
  type?: string;
  color?: string;
  is_customizable?: boolean;
}

interface CartItem {
  product_id: number;
  name: string;
  price_sale: number;
  original_price: number;
  discount: number;
  quantity: number;
  subtotal: number;
  stock: number;
  category?: string;
  mark?: string;
  type?: string;
  color?: string;
  is_customizable?: boolean;
}

const PDV: React.FC = () => {
  // Estados
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const total = React.useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const desconto = React.useMemo(() => cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0), [cart]);
  const subtotal = total + desconto;
  // Número do pedido dinâmico do banco de dados
  const pedidoNumero = saleId ? `#${saleId}` : 'Novo Pedido';

  // Formatar valor com 2 dígitos mínimo antes da vírgula e 2 depois
  const formatCurrency = (value: number): string => {
    const formatted = value.toFixed(2);
    const [intPart, decPart] = formatted.split('.');
    const paddedInt = intPart.padStart(2, '0');
    return `${paddedInt}.${decPart}`;
  };

  // Carregar todos os produtos e carrinho salvo ao abrir o PDV
  useEffect(() => {
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem('pdv_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e);
      }
    }
    setCartLoaded(true);

    // Carregar produtos
    supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .then(({ data, error }) => {
        setProducts(error ? [] : data || []);
        setLoading(false);
      });
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem('pdv_cart', JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  // Filtrar produtos localmente (mesma lógica da rota /produtos)
  const filteredProducts = products.filter(p => {
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s) ||
      (p.mark || '').toLowerCase().includes(s) ||
      (p.barcode || '').toLowerCase().includes(s)
    );
  });

  // (Removido: total agora é calculado via useMemo)

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        // Se já existe, aumenta quantidade se não ultrapassar estoque
        if (existing.quantity + 1 > product.stock) {
          setError('Estoque insuficiente');
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * (product.price_sale ?? product.price),
              }
            : item
        );
      } else {
        if (product.stock < 1) {
          setError('Produto sem estoque');
          return prev;
        }
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            price_sale: product.price_sale ?? product.price,
            original_price: product.price_sale ?? product.price,
            discount: 0,
            quantity: 1,
            subtotal: product.price_sale ?? product.price,
            stock: product.stock,
            category: product.category,
            mark: product.mark,
            type: product.type,
            color: product.color,
            is_customizable: product.is_customizable,
          },
        ];
      }
    });
    setError(null);
    setSearch('');
    inputRef.current?.focus();
  };

  // Alterar quantidade
  const changeQuantity = (product_id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === product_id) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;
          if (newQty > item.stock) {
            setError('Estoque insuficiente');
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.price_sale,
          };
        }
        return item;
      })
    );
    setError(null);
  };

  const updateUnitPrice = (product_id: number, unitPrice: number) => {
    if (Number.isNaN(unitPrice) || unitPrice < 0) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id !== product_id) return item;
        const discount = item.original_price - unitPrice;
        return {
          ...item,
          price_sale: unitPrice,
          discount: discount > 0 ? discount : 0,
          subtotal: unitPrice * item.quantity,
        };
      })
    );
  };

  const updateTotalPrice = (product_id: number, totalPrice: number) => {
    if (Number.isNaN(totalPrice) || totalPrice < 0) return;
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id !== product_id) return item;
        const unitPrice = item.quantity > 0 ? totalPrice / item.quantity : 0;
        const discount = item.original_price - unitPrice;
        return {
          ...item,
          price_sale: unitPrice,
          discount: discount > 0 ? discount : 0,
          subtotal: totalPrice,
        };
      })
    );
  };

  // Atualizar nome do item (para produtos customizáveis)
  const updateItemName = (product_id: number, newName: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === product_id ? { ...item, name: newName } : item
      )
    );
  };

  // Remover item
  const removeItem = (product_id: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== product_id));
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('pdv_cart');
    setError(null);
    setSuccess(null);
  };

  // Finalizar venda
  const finalizeSale = async () => {
    if (cart.length === 0) {
      setError('Carrinho vazio');
      return;
    }
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }
    setFinalizing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 1. Inserir sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ total, user_id: user.id }])
        .select('id')
        .single();
      
      if (saleError) {
        console.error('Erro ao registrar venda:', saleError);
        setError('Erro ao registrar venda: ' + saleError.message);
        setFinalizing(false);
        return;
      }
      
      if (!sale) {
        setError('Erro ao registrar venda: resposta vazia');
        setFinalizing(false);
        return;
      }
      
      // 2. Inserir sale_items
      const items = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price_sale,
        original_price: item.original_price,
        discount: item.discount,
      }));
      
      console.log('=== DETALHES DA INSERÇÃO ===');
      console.log('Sale ID:', sale.id);
      console.log('Itens a inserir:', JSON.stringify(items, null, 2));
      console.log('Primeiro item:', items[0]);
      
      const { data: insertedItems, error: itemsError } = await supabase
        .from('sale_items')
        .insert(items)
        .select();
      
      if (itemsError) {
        console.error('Erro ao registrar itens da venda:', itemsError);
        console.error('Detalhes do erro:', JSON.stringify(itemsError, null, 2));
        setError(`Erro ao registrar itens da venda: ${itemsError.message}${itemsError.hint ? ` (${itemsError.hint})` : ''}`);
        setFinalizing(false);
        return;
      }
      
      console.log('Itens inseridos com sucesso:', insertedItems);
      
      // Usar o ID real da venda (gerado pelo banco)
      setSaleId(sale.id);
      setSuccess(`Pedido #${sale.id} registrado com sucesso!`);
      setCart([]);
      localStorage.removeItem('pdv_cart');
        // Chamar endpoint de impressão
        try {
          await fetch('http://localhost:4000/api/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cart.map(item => ({
                name: item.name,
                qty: item.quantity,
                price: item.price_sale
              })),
              total,
              payment: 'N/A', // Adapte conforme necessário
              company: { name: 'AutoColor' }
            })
          });
        } catch (err) {
          console.error('Erro ao imprimir recibo:', err);
        }
      setTimeout(() => {
        setSuccess(null);
        setSaleId(null);
      }, 3000);
    } catch (err) {
      console.error('Erro inesperado ao finalizar venda:', err);
      setError('Erro inesperado ao finalizar venda');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="w-full h-full p-0 m-0">
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[42%_58%] gap-0 bg-transparent">
        {/* Coluna esquerda: busca e resultados - APENAS DESKTOP */}
        <div className="hidden lg:flex flex-col h-full bg-white p-10">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-xl md:text-2xl">Pedido {pedidoNumero}</div>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              onClick={clearCart}
              title="Limpar carrinho"
              disabled={cart.length === 0 || finalizing}
            >
              <FiTrash2 size={22} />
            </button>
          </div>
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/></svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-10 pr-4 py-3 text-base md:text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Buscar por nome, categoria, marca ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              maxLength={100}
              disabled={loading || finalizing}
            />
          </div>
          {loading && <div className="text-center text-gray-500 mt-2">Carregando produtos...</div>}
          {search.length > 0 && filteredProducts.length === 0 && !loading && (
            <div className="text-sm text-gray-400 mt-3">Nenhum produto encontrado.</div>
          )}
          {search.length > 0 && filteredProducts.length > 0 && (
            <ul className="bg-white border rounded-lg shadow max-h-[520px] overflow-y-auto mt-3 z-10 relative divide-y">
              {filteredProducts.map((prod) => (
                <li
                  key={prod.id}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex flex-row items-center gap-4"
                  onClick={() => addToCart(prod)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base text-slate-900 truncate">{prod.name}</div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                      {prod.category && <span>{prod.category}</span>}
                      {prod.mark && <span>{prod.mark}</span>}
                      {prod.type && <span>{prod.type}</span>}
                      {prod.color && <span>{prod.color}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end min-w-[90px]">
                    <span className="font-bold text-slate-900 text-lg">R$ {(prod.price_sale ?? prod.price).toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Estoque: {prod.stock}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Coluna direita: carrinho e resumo - TELA TODA NO MOBILE */}
        <div className="flex flex-col h-full bg-white p-4 lg:p-10 overflow-hidden">
          {/* Busca no mobile - no topo do carrinho */}
          <div className="lg:hidden mb-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg">Pedido {pedidoNumero}</div>
              <button
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                onClick={clearCart}
                title="Limpar carrinho"
                disabled={cart.length === 0 || finalizing}
              >
                <FiTrash2 size={20} />
              </button>
            </div>
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"/></svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Buscar produto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                maxLength={100}
                disabled={loading || finalizing}
              />
            </div>
            {search.length > 0 && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mt-2 z-10 relative">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer active:bg-blue-100 transition"
                    onClick={() => addToCart(prod)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm">{prod.name}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-1 mt-1">
                          {prod.category && <span className="px-1.5 py-0.5 bg-gray-100 rounded">#{prod.category}</span>}
                          {prod.mark && <span className="px-1.5 py-0.5 bg-gray-100 rounded">#{prod.mark}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="font-bold text-slate-900 text-sm">R$ {(prod.price_sale ?? prod.price).toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-1">Est: {prod.stock}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Cabeçalho - apenas desktop */}
            {cart.length > 0 && (
              <div className="hidden lg:grid grid-cols-[28px_2.4fr_0.8fr_1fr_1.2fr] gap-3 text-xs text-gray-500 uppercase tracking-wide pb-2 border-b">
                <span></span>
                <span>Produto</span>
                <span className="text-center">Quantidade</span>
                <span className="text-right">Unitário</span>
                <span className="text-right">Total</span>
              </div>
            )}
            {cart.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Nenhum produto adicionado</div>
            ) : (
              <ul className="divide-y">
                {cart.map((item) => (
                  <li key={item.product_id} className="py-4">
                    {/* Layout Desktop */}
                    <div className="hidden lg:grid grid-cols-[28px_2.4fr_0.8fr_1fr_1.2fr] gap-3 items-center">
                      <div className="flex items-center justify-center">
                        <button
                          className="p-1.5 rounded-full hover:bg-red-100 text-red-500"
                          onClick={() => removeItem(item.product_id)}
                          disabled={finalizing}
                          title="Remover item"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <div className="min-w-0">
                        {item.is_customizable ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItemName(item.product_id, e.target.value)}
                            disabled={finalizing}
                            className="w-full text-base font-semibold text-slate-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Nome do produto"
                          />
                        ) : (
                          <>
                            <div className="font-semibold text-base md:text-lg break-words">{item.name}</div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2 break-words">
                              {item.category && <span>{item.category}</span>}
                              {item.mark && <span>{item.mark}</span>}
                              {item.type && <span>{item.type}</span>}
                              {item.color && <span>{item.color}</span>}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-md px-1 py-0.5 border border-gray-200">
                          <button
                            className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white border text-sm font-semibold flex items-center justify-center"
                            onClick={() => changeQuantity(item.product_id, -1)}
                            disabled={item.quantity <= 1 || finalizing}
                          >-</button>
                          <span className="w-6 md:w-7 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                          <button
                            className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white border text-sm font-semibold flex items-center justify-center"
                            onClick={() => changeQuantity(item.product_id, 1)}
                            disabled={item.quantity >= item.stock || finalizing}
                          >+</button>
                        </div>
                      </div>
                      <div className="text-right flex items-center justify-end">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price_sale || ''}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              updateUnitPrice(item.product_id, 0);
                            } else {
                              updateUnitPrice(item.product_id, Number(e.target.value));
                            }
                          }}
                          disabled={finalizing}
                          className="w-full text-right text-sm font-medium text-slate-900 border border-gray-200 rounded px-0.2 py-0.2 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                      <div className="text-right flex items-center justify-end gap-1">
                        <span className="text-sm text-gray-500">R$</span>
                        <input
                          type="text"
                          value={formatCurrency(item.subtotal)}
                          onChange={(e) => {
                            const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                            if (!isNaN(numValue)) updateTotalPrice(item.product_id, numValue);
                          }}
                          disabled={finalizing}
                          className="w-full text-right text-sm font-bold text-slate-900 border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                    
                    {/* Layout Mobile */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {item.is_customizable ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemName(item.product_id, e.target.value)}
                              disabled={finalizing}
                              className="w-full text-base font-semibold text-slate-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="Nome do produto"
                            />
                          ) : (
                            <>
                              <div className="font-semibold text-base break-words">{item.name}</div>
                              <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                                {item.category && <span>{item.category}</span>}
                                {item.mark && <span>• {item.mark}</span>}
                                {item.type && <span>• {item.type}</span>}
                                {item.color && <span>• {item.color}</span>}
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          className="p-2 rounded-full hover:bg-red-100 text-red-500 flex-shrink-0"
                          onClick={() => removeItem(item.product_id)}
                          disabled={finalizing}
                          title="Remover"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Quantidade</div>
                          <div className="flex items-center gap-1 bg-gray-50 rounded-md px-1 py-0.5 border border-gray-200 w-fit">
                            <button
                              className="w-8 h-8 rounded-md bg-white border text-sm font-semibold flex items-center justify-center"
                              onClick={() => changeQuantity(item.product_id, -1)}
                              disabled={item.quantity <= 1 || finalizing}
                            >-</button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                            <button
                              className="w-8 h-8 rounded-md bg-white border text-sm font-semibold flex items-center justify-center"
                              onClick={() => changeQuantity(item.product_id, 1)}
                              disabled={item.quantity >= item.stock || finalizing}
                            >+</button>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Unitário</div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price_sale || ''}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                updateUnitPrice(item.product_id, 0);
                              } else {
                                updateUnitPrice(item.product_id, Number(e.target.value));
                              }
                            }}
                            disabled={finalizing}
                            className="w-full text-left text-sm font-medium text-slate-900 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total</div>
                        <input
                          type="text"
                          value={`R$ ${formatCurrency(item.subtotal)}`}
                          onChange={(e) => {
                            const numValue = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
                            if (!isNaN(numValue)) updateTotalPrice(item.product_id, numValue);
                          }}
                          disabled={finalizing}
                          className="w-full text-left text-base font-bold text-slate-900 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t pt-4 space-y-2 bg-white shrink-0">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Desconto</span>
              <span>- R$ {desconto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mt-2">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {error && <div className="text-red-600 text-center mt-2">{error}</div>}
            {success && <div className="text-green-600 text-center mt-2">{success}</div>}
            <button
              className="w-full bg-slate-900 text-white text-base font-semibold rounded-lg py-3 mt-4 shadow hover:bg-slate-800 transition"
              onClick={finalizeSale}
              disabled={finalizing || cart.length === 0}
            >
              {finalizing ? 'Registrando...' : 'Finalizar Venda →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDV;
