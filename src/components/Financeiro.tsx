import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../supabase';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface MonthEvolution {
  key: string;
  label: string;
  received: number;
  pending: number;
  salesCount: number;
  avgTicket: number;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
  share: number;
}

const selectedMonthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const Financeiro: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [evolution, setEvolution] = useState<MonthEvolution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);

    // busca a data da primeira venda para saber onde começar o histórico
    const { data: firstSaleData } = await supabase
      .from('sales')
      .select('created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1);

    const firstSaleDate = firstSaleData?.[0]?.created_at
      ? new Date(firstSaleData[0].created_at)
      : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const historyStart = new Date(firstSaleDate.getFullYear(), firstSaleDate.getMonth(), 1);

    // todas as vendas desde o início do histórico
    const { data: allSales } = await supabase
      .from('sales')
      .select('id, total, paid_amount, created_at, payment_status')
      .gte('created_at', historyStart.toISOString())
      .lt('created_at', end.toISOString())
      .is('deleted_at', null);

    // monta o mapa com todos os meses desde o início até o mês selecionado
    const monthMap = new Map<string, { received: number; pending: number; count: number }>();
    const cursor = new Date(historyStart);
    while (cursor < end) {
      const key = selectedMonthKey(cursor);
      monthMap.set(key, { received: 0, pending: 0, count: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const selectedSaleIds: number[] = [];

    (allSales ?? []).forEach((s) => {
      const d = new Date(s.created_at);
      const key = selectedMonthKey(d);
      if (!monthMap.has(key)) return;

      const prev = monthMap.get(key)!;
      const isPaid = s.payment_status === 'paid';
      const pendingAmt = isPaid ? 0 : Math.max(0, Number(s.total) - Number(s.paid_amount ?? 0));

      monthMap.set(key, {
        received: prev.received + (isPaid ? Number(s.total) : 0),
        pending: prev.pending + pendingAmt,
        count: prev.count + 1,
      });

      if (key === selectedMonthKey(selectedDate)) {
        selectedSaleIds.push(s.id);
      }
    });

    setEvolution(
      Array.from(monthMap.entries()).map(([key, val]) => {
        const [yr, mo] = key.split('-').map(Number);
        const label = new Date(yr, mo - 1, 1).toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        });
        return {
          key,
          label,
          received: val.received,
          pending: val.pending,
          salesCount: val.count,
          avgTicket: val.count > 0 ? val.received / val.count : 0,
        };
      })
    );

    // top produtos do mês selecionado
    if (selectedSaleIds.length > 0) {
      const { data: items } = await supabase
        .from('sale_items')
        .select('quantity, price, discount, custom_name, products(name)')
        .in('sale_id', selectedSaleIds);

      const productMap = new Map<string, { qty: number; revenue: number }>();
      (items ?? []).forEach((item: any) => {
        const name = item.custom_name || item.products?.name || 'Produto';
        const unit = Number(item.price) - Number(item.discount ?? 0);
        const qty = Number(item.quantity);
        const prev = productMap.get(name) ?? { qty: 0, revenue: 0 };
        productMap.set(name, { qty: prev.qty + qty, revenue: prev.revenue + unit * qty });
      });

      const sorted = Array.from(productMap.entries())
        .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      const totalRevenue = sorted.reduce((sum, p) => sum + p.revenue, 0);
      setTopProducts(
        sorted.map((p) => ({
          ...p,
          share: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
        }))
      );
    } else {
      setTopProducts([]);
    }

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () =>
    setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

  const nextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    if (next <= new Date()) setSelectedDate(next);
  };

  const isCurrentMonth =
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  const currentKey = selectedMonthKey(selectedDate);

  return (
    <div className="space-y-6 fade-in">
      {/* cabeçalho */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Financeiro</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumo por mês</p>
      </div>

      {/* tabela de evolução */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Evolução mensal</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                <th className="text-left px-5 py-3 font-medium">Mês</th>
                <th className="text-right px-5 py-3 font-medium">Receita recebida</th>
                <th className="text-right px-5 py-3 font-medium">Pendente</th>
                <th className="text-right px-5 py-3 font-medium">Vendas</th>
                <th className="text-right px-5 py-3 font-medium">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan={5} className="px-5 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : evolution.map((row) => {
                    const isSelected = row.key === currentKey;
                    return (
                      <tr
                        key={row.key}
                        className={`border-t border-slate-100 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-5 py-3.5 capitalize">
                          <span
                            className={`font-medium ${
                              isSelected ? 'text-indigo-700' : 'text-slate-700'
                            }`}
                          >
                            {row.label}
                          </span>
                          {isSelected && (
                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 rounded px-1.5 py-0.5 font-medium">
                              selecionado
                            </span>
                          )}
                        </td>
                        <td className={`px-5 py-3.5 text-right font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                          {row.received > 0 ? fmt(row.received) : <span className="text-slate-300 font-normal">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {row.pending > 0 ? (
                            <span className="text-orange-500 font-medium">{fmt(row.pending)}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{row.salesCount}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500">
                          {row.salesCount > 0 ? fmt(row.avgTicket) : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* top produtos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800">Produtos mais vendidos</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
            >
              <Icon icon="solar:alt-arrow-left-linear" width={16} />
            </button>
            <span className="text-sm font-medium text-slate-600 capitalize min-w-[130px] text-center">
              {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon icon="solar:alt-arrow-right-linear" width={16} />
            </button>
          </div>
        </div>
        {!loading && topProducts.length === 0 ? (
          <div className="px-5 py-12 text-sm text-slate-400 text-center">
            Nenhuma venda registrada neste mês.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium w-8">#</th>
                  <th className="text-left px-5 py-3 font-medium">Produto</th>
                  <th className="text-right px-5 py-3 font-medium">Qtd</th>
                  <th className="text-right px-5 py-3 font-medium">Receita</th>
                  <th className="px-5 py-3 font-medium w-36">Participação</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td colSpan={5} className="px-5 py-3">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : topProducts.map((p, i) => (
                      <tr
                        key={i}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium">{p.name}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{p.qty}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          {fmt(p.revenue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-indigo-400 rounded-full"
                                style={{ width: `${p.share}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-9 text-right shrink-0">
                              {p.share.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Financeiro;
