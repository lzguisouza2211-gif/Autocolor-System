import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

type LowStockProduct = {
  id: number;
  name: string;
  stock: number;
};

const Header: React.FC = () => {
  const [dateTime, setDateTime] = useState<string>('');
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const CRITICAL_STOCK_THRESHOLD = 10;

  const lowStockCount = useMemo(() => lowStock.length, [lowStock]);

  const fetchLowStock = async () => {
    setLoadingStock(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .is('deleted_at', null)
      .lte('stock', CRITICAL_STOCK_THRESHOLD)
      .order('stock', { ascending: true });

    if (!error && data) {
      setLowStock(data as LowStockProduct[]);
    }
    setLoadingStock(false);
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLowStock();

    const channel = supabase
      .channel('products-low-stock')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchLowStock();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="h-16 bg-white/80 backdrop-blur flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3 flex-1 lg:flex-none">
        <div className="flex items-center gap-2 lg:ml-0">
          <img src="/icon-autocolor.png" alt="AutoColor Logo" className="w-8 h-8 rounded-lg" />
          <span className="text-base font-medium tracking-tight text-slate-900 hidden sm:inline">AutoColor System</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 hidden sm:inline">{dateTime}</span>
        <div className="relative" ref={menuRef}>
          <button
            className="p-2 text-slate-400 hover:text-slate-600 relative"
            aria-label="Notificações"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {lowStockCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border border-white">
                {lowStockCount > 99 ? '99+' : lowStockCount}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">Notificações</div>
                <button
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={() => navigate('/produtos?estoque=critico')}
                >
                  Ver estoque crítico
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {loadingStock ? (
                  <div className="px-4 py-3 text-sm text-slate-500">Carregando...</div>
                ) : lowStock.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500">Sem alertas de estoque crítico.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {lowStock.map((product) => (
                      <li key={product.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{product.name}</div>
                            <div className="text-xs text-slate-500">Estoque crítico</div>
                          </div>
                          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 whitespace-nowrap">
                            {product.stock} un
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
