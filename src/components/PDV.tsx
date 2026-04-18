
import React, { useEffect, useRef, useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
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

interface CustomerOption {
  id: number;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
}

const PDV: React.FC = () => {
  // Estado para abrir/fechar o carrinho (sidebar)
  const [cartOpen, setCartOpen] = useState(false);
    // Estado para abrir scanner
    const [scannerOpen, setScannerOpen] = useState(false);
    // Handler para código de barras detectado
    const handleBarcodeDetected = (barcode: string) => {
      setSearch(barcode);
      setScannerOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
  // Estados
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(0);
  const [customerPickerExpanded, setCustomerPickerExpanded] = useState(false);
  const [markAsPendingPayment, setMarkAsPendingPayment] = useState(false);
  const [paidNowValue, setPaidNowValue] = useState('0');

  // Cálculo de totais (deve vir antes de hooks que dependem deles)
  const total = React.useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const desconto = React.useMemo(() => cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0), [cart]);
  const subtotal = total + desconto;

  const inputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerSelectorRef = useRef<HTMLDivElement>(null);
  // Filtrar produtos localmente (mesma lógica da rota /produtos)
  const filteredProducts = products
    .filter(p => {
      const s = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        (p.category || '').toLowerCase().includes(s) ||
        (p.mark || '').toLowerCase().includes(s) ||
        (p.barcode || '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  const customerSearchTerm = customerSearch.trim().toLowerCase();
  const filteredCustomers = customers
    .filter((customer) => {
      if (!customerSearchTerm) return true;
      return (
        customer.full_name.toLowerCase().includes(customerSearchTerm) ||
        (customer.cpf ?? '').toLowerCase().includes(customerSearchTerm) ||
        (customer.cnpj ?? '').toLowerCase().includes(customerSearchTerm) ||
        (customer.phone ?? '').toLowerCase().includes(customerSearchTerm)
      );
    })
    .slice(0, 12);

  const getCustomerDocumentValue = (customer: CustomerOption) => customer.cnpj || customer.cpf || '-';
  const getCustomerDocumentLabel = (customer: CustomerOption) => (customer.cnpj ? 'CNPJ' : 'CPF');

  const formatCustomerShortLabel = (customer: CustomerOption) =>
    `${customer.full_name} • ${getCustomerDocumentValue(customer)}`;

  const selectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setCustomerPickerExpanded(false);
    setActiveCustomerIndex(0);
    setError(null);
  };
  // Estado para navegação por teclado no carrinho
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  // Estado para navegação por teclado na lista de produtos filtrados
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  // Resetar seleção de produto ao mudar busca ou lista
  useEffect(() => {
    setSelectedProductIndex(filteredProducts.length > 0 ? 0 : -1);
  }, [search, filteredProducts.length]);

  // Permitir mouseover para selecionar item visualmente
  const handleProductMouseOver = (idx: number) => {
    setSelectedProductIndex(idx);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (finalizing || filteredProducts.length === 0) return;
    if (e.key === 'ArrowDown') {
      setSelectedProductIndex((prev) => {
        const next = prev < filteredProducts.length - 1 ? prev + 1 : 0;
        setTimeout(() => {
          const el = document.getElementById(`product-option-${next}`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 0);
        return next;
      });
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedProductIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredProducts.length - 1;
        setTimeout(() => {
          const el = document.getElementById(`product-option-${next}`);
          el?.scrollIntoView({ block: 'nearest' });
        }, 0);
        return next;
      });
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (selectedProductIndex >= 0 && selectedProductIndex < filteredProducts.length) {
        addToCart(filteredProducts[selectedProductIndex]);
        setTimeout(() => { inputRef.current?.focus(); }, 0);
      }
    }
  };
  
    // Efeito para resetar seleção se carrinho mudar
    useEffect(() => {
      if (cart.length === 0) {
        setSelectedCartIndex(-1);
      } else if (selectedCartIndex >= cart.length) {
        setSelectedCartIndex(cart.length - 1);
      }
    }, [cart, selectedCartIndex]);

    // Handler de teclado global para navegação no carrinho
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Só ativa se o carrinho tiver itens e não estiver finalizando
        if (finalizing || cart.length === 0) return;
        // Se foco está em input, não navega
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

        if (e.key === 'ArrowDown') {
          setSelectedCartIndex((prev) => (prev < cart.length - 1 ? prev + 1 : 0));
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          setSelectedCartIndex((prev) => (prev > 0 ? prev - 1 : cart.length - 1));
          e.preventDefault();
        } else if (e.key === 'Delete') {
          if (selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
            removeItem(cart[selectedCartIndex].product_id);
          }
        } else if (e.key === 'Enter') {
          // Enter: aumenta quantidade do item selecionado
          if (selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
            changeQuantity(cart[selectedCartIndex].product_id, 1);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedCartIndex, finalizing]);
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

    // Carregar clientes para vincular na venda
    setLoadingCustomers(true);
    supabase
      .from('customers')
      .select('id, full_name, cpf, cnpj, phone, street, address_number, neighborhood')
      .order('full_name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao carregar clientes no PDV:', error);
          setCustomers([]);
        } else {
          setCustomers((data || []) as CustomerOption[]);
        }
        setLoadingCustomers(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!customerSelectorRef.current) return;
      if (!customerSelectorRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
        setCustomerPickerExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveCustomerIndex(0);
  }, [customerSearchTerm, showCustomerDropdown]);

  useEffect(() => {
    if (markAsPendingPayment && !selectedCustomer) {
      setCustomerPickerExpanded(true);
      setShowCustomerDropdown(true);
      setTimeout(() => customerInputRef.current?.focus(), 0);
    }
  }, [markAsPendingPayment, selectedCustomer]);

  const handleCustomerSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCustomerDropdown) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        setShowCustomerDropdown(true);
      }
      return;
    }

    if (filteredCustomers.length === 0) {
      if (event.key === 'Escape') {
        setShowCustomerDropdown(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveCustomerIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveCustomerIndex((prev) => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const customer = filteredCustomers[activeCustomerIndex];
      if (customer) {
        selectCustomer(customer);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setShowCustomerDropdown(false);
    }
  };

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem('pdv_cart', JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    setCart((prev) => {
      if (product.stock < 1) {
        setError('Produto sem estoque');
        return prev;
      }
      // Só EMBALAGEM pode ser adicionado como item separado
      if (product.name.trim().toUpperCase() === 'EMBALAGEM') {
        return [
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
          ...prev,
        ];
      } else {
        const existing = prev.find((item) => item.product_id === product.id);
        if (existing) {
          if (existing.quantity + 1 > product.stock) {
            setError('Estoque insuficiente');
            return prev;
          }
          // Atualiza quantidade, mantém item no topo
          const updated = prev
            .map((item) =>
              item.product_id === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * (product.price_sale ?? product.price),
                  }
                : item
            );
          // Move o item atualizado para o topo, removendo undefined
          const movedItem = updated.find((item) => item.product_id === product.id);
          const rest = updated.filter((item) => item.product_id !== product.id);
          return movedItem ? [movedItem, ...rest] : rest;
        } else {
          return [
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
            ...prev,
          ];
        }
      }
    });
    setError(null);
    setAddSuccess(`Produto "${product.name}" adicionado!`);
    setTimeout(() => setAddSuccess(null), 1200);
    // Não limpa o input nem fecha o dropdown
    inputRef.current?.focus();
  };

  // Alterar quantidade
  const changeQuantity = (idx: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
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
      })
    );
    setError(null);
  };

  const updateUnitPrice = (idx: number, unitPrice: number) => {
    if (Number.isNaN(unitPrice) || unitPrice < 0) return;
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
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

  const updateTotalPrice = (idx: number, totalPrice: number) => {
    if (Number.isNaN(totalPrice) || totalPrice < 0) return;
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
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
  // Atualizar nome do item (para produtos customizáveis)
  const updateItemName = (index: number, newName: string) => {
    setCart((prev) => {
      // Salvar histórico se for EMBALAGEM e nome mudou
      const item = prev[index];
      if (item && item.name.trim().toUpperCase() === 'EMBALAGEM' && newName.trim() !== item.name.trim()) {
        // Salva no banco
        supabase.from('embalagem_nome_historico').insert([
          {
            cart_item_id: null, // Não há id do item do carrinho, pode ser null
            product_id: item.product_id,
            nome_antigo: item.name,
            nome_novo: newName,
            user_id: user?.id ?? null
          }
        ]).then(({ error }) => {
          if (error) {
            console.error('Erro ao salvar histórico de nome de EMBALAGEM:', error);
          }
        });
      }
      return prev.map((item, idx) =>
        idx === index ? { ...item, name: newName } : item
      );
    });
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

    if (markAsPendingPayment && !selectedCustomer) {
      setError('Selecione um cliente para marcar a venda como pagamento posterior.');
      return;
    }

    const paidNowParsed = Number(markAsPendingPayment ? paidNowValue.replace(',', '.') : total);
    const paidAmount = Number.isFinite(paidNowParsed) ? paidNowParsed : 0;

    if (paidAmount < 0) {
      setError('O valor pago não pode ser negativo.');
      return;
    }

    if (paidAmount > total) {
      setError('O valor pago não pode ser maior que o total da venda.');
      return;
    }

    // Finalização direta da venda
    setFinalizing(true);
    setError(null);
    setSuccess(null);
    try {
      // 1. Inserir sale
      const paymentStatus = markAsPendingPayment && paidAmount < total ? 'pending' : 'paid';
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            total,
            user_id: user.id,
            customer_id: selectedCustomer?.id ?? null,
            payment_status: paymentStatus,
            marked_at: paymentStatus === 'pending' ? new Date().toISOString() : null,
            paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
            paid_amount: paymentStatus === 'paid' ? total : paidAmount,
          },
        ])
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
        custom_name: (item.is_customizable || item.name.trim().toUpperCase() === 'EMBALAGEM') && item.name ? item.name : null,
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
      setSuccess(
        paymentStatus === 'pending'
          ? `Pedido #${sale.id} registrado a prazo. Restante: R$ ${(total - paidAmount).toFixed(2)}`
          : `Pedido #${sale.id} registrado à vista com sucesso!`
      );
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setShowCustomerDropdown(false);
      setMarkAsPendingPayment(false);
      setPaidNowValue('0');
      localStorage.removeItem('pdv_cart');
        // Chamar endpoint de impressão
        try {
          const printItems = cart.map(item => ({
            name: item.name,
            custom_name: item.name,
            qty: item.quantity,
            price: item.price_sale
          }));

          const printCustomer = selectedCustomer
            ? {
                full_name: selectedCustomer.full_name,
                street: selectedCustomer.street,
                address_number: selectedCustomer.address_number,
                neighborhood: selectedCustomer.neighborhood,
              }
            : null;

          if (paymentStatus === 'pending' && printCustomer) {
            await fetch('http://localhost:4000/api/print', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: printItems,
                total,
                payment: 'A prazo',
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
                total,
                payment: 'A prazo',
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
                total,
                payment: 'À vista',
                saleType: 'a_vista',
                receiptType: 'default',
                customer: printCustomer,
                company: { name: 'AutoColor' }
              })
            });
          }
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
      <div className="w-full h-full bg-transparent relative">
        {/* Coluna esquerda: busca e resultados - APENAS DESKTOP */}
        <div className="flex flex-col h-full bg-white p-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-xl md:text-2xl">Pedido {pedidoNumero}</div>
            {/* Botão de lixeira superior removido conforme solicitado */}
          </div>

          <div className="relative w-full flex items-center gap-2">
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
              onKeyDown={handleSearchKeyDown}
              maxLength={100}
              disabled={loading || finalizing}
            />
            {/* Botão de código de barras removido conforme solicitado */}
            {scannerOpen && (
              <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
            )}
          </div>
          {loading && <div className="text-center text-gray-500 mt-2">Carregando produtos...</div>}
          {search.length > 0 && filteredProducts.length === 0 && !loading && (
            <div className="text-sm text-gray-400 mt-3">Nenhum produto encontrado.</div>
          )}
          {search.length > 0 && filteredProducts.length > 0 && (
            <>
              <ul className="bg-white border rounded-lg shadow max-h-[520px] overflow-y-auto mt-3 z-10 relative divide-y">
                {filteredProducts.map((prod, idx) => (
                  <li
                    key={prod.id}
                    id={`product-option-${idx}`}
                    className={`p-3 flex flex-row items-center gap-4 transition
                      ${prod.stock < 1 ? 'bg-red-50 cursor-not-allowed opacity-70 border border-red-200' : 'hover:bg-blue-50 cursor-pointer'}
                      ${selectedProductIndex === idx && prod.stock > 0 ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                    onMouseOver={() => handleProductMouseOver(idx)}
                    onClick={() => {
                      if (prod.stock > 0) {
                        addToCart(prod);
                        // Mantém o dropdown aberto e o input preenchido
                      }
                    }}
                    tabIndex={-1}
                    aria-disabled={prod.stock < 1}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-base truncate ${prod.stock < 1 ? 'text-red-700' : 'text-slate-900'}`}>{prod.name}
                        {prod.stock < 1 && (
                          <span className="ml-2 inline-flex items-center text-xs font-semibold text-red-700">
                            <svg className="inline mr-1" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                            Sem estoque
                          </span>
                        )}
                      </div>
                      <div className="text-xs flex flex-wrap gap-2 ${prod.stock < 1 ? 'text-red-500' : 'text-gray-500'}">
                        {prod.category && <span>{prod.category}</span>}
                        {prod.mark && <span>{prod.mark}</span>}
                        {prod.type && <span>{prod.type}</span>}
                        {prod.color && <span>{prod.color}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end min-w-[90px]">
                      <span className={`font-bold text-lg ${prod.stock < 1 ? 'text-red-700' : 'text-slate-900'}`}>R$ {(prod.price_sale ?? prod.price).toFixed(2)}</span>
                      <span className={`text-xs ${prod.stock < 1 ? 'text-red-700' : 'text-gray-500'}`}>Estoque: {prod.stock}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {addSuccess && (
                <div className="absolute top-1 right-2 bg-green-100 text-green-800 text-xs rounded px-3 py-1 shadow transition animate-fadeIn" style={{zIndex: 20}}>
                  {addSuccess}
                </div>
              )}
            </>
          )}
        </div>

        {/* Coluna direita: carrinho e resumo - TELA TODA NO MOBILE */}
        {/* Botão para abrir/fechar o carrinho (sidebar) */}
        {/* Botão para abrir/fechar carrinho - visível em todas as telas, mas posição diferente no mobile */}
        {/* Floating Cart Button */}
        {!cartOpen && (
          <button
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-slate-800 transition-all duration-200"
            style={{ minWidth: 56, minHeight: 56, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', position: 'fixed' }}
            onClick={() => setCartOpen(true)}
            aria-label="Abrir carrinho"
          >
            {/* Ícone de carrinho */}
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-13z"/><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="18" cy="21" r="1" fill="currentColor"/></svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 border-2 border-white shadow" style={{minWidth: 22, textAlign: 'center'}}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        )}
        {/* Floating Cart Panel */}
        {cartOpen && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fadeIn"
              onClick={() => setCartOpen(false)}
              aria-label="Fechar carrinho"
            />
            <div
              className="fixed top-0 right-0 z-50 w-full max-w-full h-screen bg-white border-l border-gray-200 flex flex-col p-2 lg:p-4 shadow-2xl transition-all duration-300"
              style={{
                transition: 'transform 0.3s, opacity 0.3s',
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
                opacity: cartOpen ? 1 : 0,
                width: '100%',
                maxWidth: '600px' // até metade de uma tela fullhd
              }}
            >
              {/* Botão de fechar */}
              <div className="flex items-center justify-between mb-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold border border-red-200 transition disabled:opacity-50"
                  onClick={clearCart}
                  disabled={finalizing || cart.length === 0}
                  title="Limpar carrinho"
                >
                  Limpar carrinho
                </button>
                <button
                  className="text-slate-500 hover:text-slate-900 p-1 rounded-full focus:outline-none"
                  onClick={() => setCartOpen(false)}
                  aria-label="Fechar carrinho"
                  style={{ background: 'rgba(240,240,240,0.7)' }}
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
          {/* Busca no mobile - no topo do carrinho */}
          <div className="lg:hidden mb-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg">Pedido {pedidoNumero}</div>
              {/* Ícone de lixeira do topo removido no mobile conforme solicitado */}
            </div>
            {cart.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold border border-red-200 transition disabled:opacity-50"
                  onClick={clearCart}
                  disabled={finalizing}
                >
                  <FiTrash2 size={14} /> Remover todos
                </button>
              </div>
            )}
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
                onKeyDown={handleSearchKeyDown}
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
                <div className="flex-1 overflow-y-auto min-h-0 text-[14px]">
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
                {cart.map((item, idx) => {
                  const lowStock = item.stock <= 3;
                  return (
                    <li
                      key={item.product_id}
                      className={`py-3 ${selectedCartIndex === idx ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${lowStock ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                      tabIndex={-1}
                    >
                      {/* Layout Desktop */}
                      <div className="hidden lg:flex items-center gap-2 w-full whitespace-nowrap overflow-x-hidden">
                        <div className="flex items-center justify-center flex-shrink-0">
                          <button
                            className="p-1.5 rounded-full hover:bg-red-100 text-red-500"
                            onClick={() => removeItem(item.product_id)}
                            disabled={finalizing}
                            title="Remover item"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 max-w-[320px] flex flex-row items-center gap-2 justify-start">
                          {item.is_customizable ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemName(idx, e.target.value)}
                              disabled={finalizing}
                              className="w-full text-base font-semibold text-slate-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="Nome do produto"
                            />
                          ) : (
                            <>
                              <div
                                className="font-semibold text-base md:text-lg min-w-0 truncate max-w-[180px]"
                                title={item.name}
                                style={{ display: 'inline-block', verticalAlign: 'middle' }}
                              >
                                {item.name}
                                {lowStock && <span className="ml-2 text-xs text-yellow-700 font-bold">Estoque baixo</span>}
                              </div>
                              {/* Não exibe marca, categoria, tipo ou cor no carrinho */}
                            </>
                          )}
                        </div>
                        <div className="flex items-center flex-shrink-0 min-w-[120px] gap-2">
                          <button
                            className="w-7 h-7 rounded bg-slate-100 border border-gray-300 text-base font-bold flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-50"
                            onClick={() => changeQuantity(idx, -1)}
                            disabled={item.quantity <= 1 || finalizing}
                            tabIndex={-1}
                          >-</button>
                          <input
                            type="number"
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            disabled={finalizing}
                            onChange={e => {
                              let value = parseInt(e.target.value, 10);
                              if (isNaN(value) || value < 1) value = 1;
                              if (value > item.stock) value = item.stock;
                              changeQuantity(idx, value - item.quantity);
                            }}
                            className="text-center text-base font-semibold text-slate-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 hide-spin"
                            style={{ MozAppearance: 'textfield', appearance: 'textfield', width: 48, minWidth: 48, maxWidth: 48 }}
                            onWheel={e => e.currentTarget.blur()}
                          />
                          <button
                            className="w-7 h-7 rounded bg-slate-100 border border-gray-300 text-base font-bold flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-50"
                            onClick={() => changeQuantity(idx, 1)}
                            disabled={item.quantity >= item.stock || finalizing}
                            tabIndex={-1}
                          >+</button>
                        </div>
                        <div className="flex items-center flex-shrink-0 min-w-[90px] max-w-[100px]">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price_sale || ''}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                updateUnitPrice(idx, 0);
                              } else {
                                updateUnitPrice(idx, Number(e.target.value));
                              }
                            }}
                            disabled={finalizing}
                            className="text-right text-base font-medium text-slate-900 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-200 hide-spin"
                            style={{ width: 70, minWidth: 70, maxWidth: 70 }}
                            onWheel={e => e.currentTarget.blur()}
                          />
                        </div>
                        <div className="flex items-center flex-shrink-0 min-w-[90px] max-w-[100px] justify-end">
                          <span className="text-base font-bold text-slate-900 bg-slate-100 rounded px-2 py-1 ml-1" style={{ width: 90, minWidth: 90, maxWidth: 90, display: 'inline-block', textAlign: 'right', overflow: 'hidden' }}>R$ {formatCurrency(item.subtotal)}</span>
                        </div>
                      </div>
                      {/* Layout Mobile */}
                      <div className={`lg:hidden space-y-3 ${selectedCartIndex === idx ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}> 
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {item.is_customizable ? (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItemName(idx, e.target.value)}
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
                                onClick={() => changeQuantity(idx, -1)}
                                disabled={item.quantity <= 1 || finalizing}
                              >-</button>
                              <span className="w-8 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                              <button
                                className="w-8 h-8 rounded-md bg-white border text-sm font-semibold flex items-center justify-center"
                                onClick={() => changeQuantity(idx, 1)}
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
                  );
                })}
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
            <div className="flex flex-col gap-2 mt-2" ref={customerSelectorRef}>
              <label className="text-sm font-medium text-gray-700">Cliente da venda</label>

              <button
                type="button"
                disabled={finalizing || loadingCustomers}
                onClick={() => {
                  setCustomerPickerExpanded((prev) => {
                    const nextState = !prev;
                    setShowCustomerDropdown(nextState);
                    if (nextState) {
                      setTimeout(() => customerInputRef.current?.focus(), 0);
                    }
                    return nextState;
                  });
                }}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedCustomer
                    ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
                    : 'border-gray-300 bg-white hover:bg-slate-50'
                } disabled:opacity-60`}
              >
                {selectedCustomer ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedCustomer.full_name}</p>
                      <p className="text-xs text-slate-600">
                        {getCustomerDocumentLabel(selectedCustomer)}: {getCustomerDocumentValue(selectedCustomer)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {selectedCustomer.phone ? `Telefone: ${selectedCustomer.phone}` : 'Sem telefone cadastrado'}
                      </p>
                    </div>
                    <span className="text-[11px] bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium">Selecionado</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Selecionar cliente</p>
                    <p className="text-xs text-slate-500 mt-0.5">Busca por nome, CPF/CNPJ ou telefone</p>
                  </div>
                )}
              </button>

              {!selectedCustomer && !customerPickerExpanded && (
                <p className="text-xs text-slate-500">Venda sem cliente vinculado (opcional para pagamento à vista).</p>
              )}

              {customerPickerExpanded && (
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={customerInputRef}
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Digite nome, CPF/CNPJ ou telefone..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onKeyDown={handleCustomerSearchKeyDown}
                      disabled={finalizing || loadingCustomers}
                    />
                    {selectedCustomer && (
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                          setShowCustomerDropdown(true);
                          setTimeout(() => customerInputRef.current?.focus(), 0);
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {showCustomerDropdown && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto">
                      {loadingCustomers ? (
                        <div className="px-3 py-3 text-sm text-slate-400">Carregando clientes...</div>
                      ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => {
                          const isActive = index === activeCustomerIndex;
                          const isSelected = selectedCustomer?.id === customer.id;

                          return (
                            <button
                              key={customer.id}
                              type="button"
                              className={`w-full text-left px-3 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                                isActive ? 'bg-blue-50' : 'hover:bg-blue-50'
                              }`}
                              onMouseEnter={() => setActiveCustomerIndex(index)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectCustomer(customer)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900 truncate">{customer.full_name}</p>
                                {isSelected && (
                                  <span className="text-[11px] text-indigo-700 bg-indigo-100 rounded px-2 py-0.5">Selecionado</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{formatCustomerShortLabel(customer)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{customer.phone || 'Sem telefone'}</p>
                            </button>
                          );
                        })
                      ) : customers.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-slate-400">Nenhum cliente cadastrado.</div>
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-400">Nenhum cliente encontrado para essa busca.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <label className="mt-2 flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={markAsPendingPayment}
                  onChange={(event) => {
                    setMarkAsPendingPayment(event.target.checked);
                    if (event.target.checked && !selectedCustomer) {
                      setError('Para marcar a venda, selecione um cliente.');
                    } else {
                      setError(null);
                    }
                    if (!event.target.checked) {
                      setPaidNowValue('0');
                    }
                  }}
                  disabled={finalizing}
                />
                <span>Marcar venda para cliente pagar depois</span>
              </label>
              {markAsPendingPayment && !selectedCustomer && (
                <p className="text-xs text-amber-600">
                  Selecione um cliente para concluir a venda marcada.
                </p>
              )}
              {markAsPendingPayment && (
                <>
                  <div className="mt-1">
                    <label className="text-xs text-gray-600">Valor pago agora (entrada)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paidNowValue}
                      onChange={(event) => setPaidNowValue(event.target.value)}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 hide-spin"
                      disabled={finalizing}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Restante a prazo: R$ {Math.max(0, total - (Number(paidNowValue.replace(',', '.')) || 0)).toFixed(2)}
                  </p>
                </>
              )}
            </div>
            <button
              className="w-full bg-slate-900 text-white text-base font-semibold rounded-lg py-3 mt-4 shadow hover:bg-slate-800 transition"
              onClick={finalizeSale}
              disabled={finalizing || cart.length === 0}
            >
              {finalizing
                ? 'Registrando...'
                : markAsPendingPayment
                  ? 'Marcar Venda para Depois →'
                  : 'Finalizar Venda →'}
            </button>
          </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDV;

