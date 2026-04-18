import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';

interface PendingSale {
  id: number;
  total: number;
  paid_amount: number;
  created_at: string;
  customer_id: number | null;
  customers: {
    full_name: string;
    cpf: string;
    phone: string | null;
  } | null;
}

interface PendingSaleRow {
  id: number;
  total: number;
  paid_amount: number | null;
  created_at: string;
  customer_id: number | null;
}

interface CustomerRow {
  id: number;
  full_name: string;
  cpf: string;
  phone: string | null;
}

interface CustomerOverview {
  customer_id: number;
  total_sales: number;
  total_paid: number;
  total_pending: number;
  pending_sales_count: number;
  last_sale_at: string | null;
}

interface CustomerSaleHistoryItem {
  sale_id: number;
  created_at: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'paid' | 'pending';
  paid_at: string | null;
}

interface CustomerSalesRow {
  id: number;
  total: number;
  paid_amount: number | null;
  created_at: string;
  payment_status: 'paid' | 'pending' | null;
  paid_at: string | null;
}

interface GroupedCustomer {
  customerId: number;
  fullName: string;
  cpf: string;
  phone: string | null;
  pendingCount: number;
  pendingTotal: number;
}

const MarkedSales: React.FC = () => {
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerOverview, setSelectedCustomerOverview] = useState<CustomerOverview | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerSaleHistoryItem[]>([]);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);
  const [settlingSaleId, setSettlingSaleId] = useState<number | null>(null);
  const [abatementValues, setAbatementValues] = useState<Record<number, string>>({});

  const normalizePaidAmount = (total: number, paidAmount: number | null | undefined, status: 'paid' | 'pending') => {
    if (status === 'paid') {
      return total;
    }

    const numericPaid = Number(paidAmount ?? 0);
    if (!Number.isFinite(numericPaid) || numericPaid < 0) {
      return 0;
    }

    return Math.min(total, numericPaid);
  };

  const fetchPendingSales = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('sales')
      .select('id, total, paid_amount, created_at, customer_id')
      .eq('payment_status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(`Erro ao carregar vendas a prazo: ${fetchError.message}`);
      setPendingSales([]);
      setLoading(false);
      return;
    }

    const salesRows = (data ?? []) as PendingSaleRow[];
    const customerIds = Array.from(
      new Set(
        salesRows
          .map((sale) => sale.customer_id)
          .filter((customerId): customerId is number => customerId !== null)
      )
    );

    let customersMap = new Map<number, CustomerRow>();

    if (customerIds.length > 0) {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, cpf, phone')
        .in('id', customerIds);

      if (customersError) {
        setError(`Erro ao carregar clientes das vendas a prazo: ${customersError.message}`);
      } else {
        customersMap = new Map((customersData ?? []).map((customer) => [customer.id, customer as CustomerRow]));
      }
    }

    const normalizedSales = salesRows.map((sale) => ({
      id: sale.id,
      total: Number(sale.total),
      paid_amount: normalizePaidAmount(Number(sale.total), sale.paid_amount, 'pending'),
      created_at: sale.created_at,
      customer_id: sale.customer_id,
      customers: sale.customer_id ? (customersMap.get(sale.customer_id) ?? null) : null,
    }));

    setPendingSales(normalizedSales);
    setLoading(false);
  };

  const fetchCustomerDetails = async (customerId: number) => {
    setLoadingCustomerDetails(true);
    setError(null);

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total, paid_amount, created_at, payment_status, paid_at')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (salesError) {
      setError(`Erro ao carregar histórico do cliente: ${salesError.message}`);
      setSelectedCustomerOverview(null);
      setSelectedCustomerHistory([]);
      setLoadingCustomerDetails(false);
      return;
    }

    const rows = (salesData ?? []) as CustomerSalesRow[];

    const history: CustomerSaleHistoryItem[] = rows.map((sale) => {
      const total = Number(sale.total);
      const paymentStatus = sale.payment_status === 'pending' ? 'pending' : 'paid';
      const paidAmount = normalizePaidAmount(total, sale.paid_amount, paymentStatus);

      return {
        sale_id: sale.id,
        created_at: sale.created_at,
        total,
        paid_amount: paidAmount,
        remaining_amount: Math.max(0, total - paidAmount),
        payment_status: paymentStatus,
        paid_at: sale.paid_at,
      };
    });

    const totalSales = history.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalPaid = history.reduce((sum, sale) => sum + Number(sale.paid_amount), 0);
    const totalPending = history.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0);
    const pendingSalesCount = history.filter((sale) => sale.payment_status === 'pending').length;

    setSelectedCustomerOverview({
      customer_id: customerId,
      total_sales: totalSales,
      total_paid: totalPaid,
      total_pending: totalPending,
      pending_sales_count: pendingSalesCount,
      last_sale_at: history.length > 0 ? history[0].created_at : null,
    });
    setSelectedCustomerHistory(history);

    setLoadingCustomerDetails(false);
  };

  const handleSettleSale = async (saleId: number) => {
    const selectedSale = selectedCustomerHistory.find((sale) => sale.sale_id === saleId);
    if (!selectedSale) return;

    setSettlingSaleId(saleId);
    setError(null);

    const { error: settleError } = await supabase
      .from('sales')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: selectedSale.total,
      })
      .eq('id', saleId)
      .eq('payment_status', 'pending')
      .is('deleted_at', null);

    if (settleError) {
      setError(`Erro ao dar baixa na venda #${saleId}: ${settleError.message}`);
      setSettlingSaleId(null);
      return;
    }

    await fetchPendingSales();
    if (selectedCustomerId) {
      await fetchCustomerDetails(selectedCustomerId);
    }
    setSettlingSaleId(null);
  };

  const handleApplyAbatement = async (saleId: number) => {
    const selectedSale = selectedCustomerHistory.find((sale) => sale.sale_id === saleId);
    if (!selectedSale || selectedSale.payment_status !== 'pending') return;

    const rawValue = abatementValues[saleId] ?? '';
    const amount = Number(rawValue.replace(',', '.'));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor de abatimento maior que zero.');
      return;
    }

    if (amount > selectedSale.remaining_amount) {
      setError('O abatimento não pode ser maior que o valor restante da venda.');
      return;
    }

    setSettlingSaleId(saleId);
    setError(null);

    const newPaidAmount = Math.min(selectedSale.total, selectedSale.paid_amount + amount);
    const isSettled = newPaidAmount >= selectedSale.total;

    const { error: updateError } = await supabase
      .from('sales')
      .update({
        paid_amount: newPaidAmount,
        payment_status: isSettled ? 'paid' : 'pending',
        paid_at: isSettled ? new Date().toISOString() : null,
      })
      .eq('id', saleId)
      .is('deleted_at', null);

    if (updateError) {
      setError(`Erro ao abater valor da venda #${saleId}: ${updateError.message}`);
      setSettlingSaleId(null);
      return;
    }

    setAbatementValues((prev) => ({ ...prev, [saleId]: '' }));
    await fetchPendingSales();
    if (selectedCustomerId) {
      await fetchCustomerDetails(selectedCustomerId);
    }
    setSettlingSaleId(null);
  };

  useEffect(() => {
    fetchPendingSales();
  }, []);

  const groupedCustomers = useMemo(() => {
    const groupedMap = new Map<number, GroupedCustomer>();

    pendingSales.forEach((sale) => {
      if (!sale.customer_id || !sale.customers) return;

      const existing = groupedMap.get(sale.customer_id);
      if (existing) {
        groupedMap.set(sale.customer_id, {
          ...existing,
          pendingCount: existing.pendingCount + 1,
          pendingTotal: existing.pendingTotal + Math.max(0, Number(sale.total) - Number(sale.paid_amount)),
        });
      } else {
        groupedMap.set(sale.customer_id, {
          customerId: sale.customer_id,
          fullName: sale.customers.full_name,
          cpf: sale.customers.cpf,
          phone: sale.customers.phone,
          pendingCount: 1,
          pendingTotal: Math.max(0, Number(sale.total) - Number(sale.paid_amount)),
        });
      }
    });

    return Array.from(groupedMap.values()).sort((a, b) => b.pendingTotal - a.pendingTotal);
  }, [pendingSales]);

  const selectedCustomer = groupedCustomers.find((customer) => customer.customerId === selectedCustomerId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Vendas a Prazo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize vendas a prazo, quanto cada cliente deve e faça abatimentos parciais ou baixa total.
        </p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-slate-900">Clientes com vendas a prazo</h2>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-400">Carregando...</div>
          ) : groupedCustomers.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">Nenhuma venda marcada no momento.</div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
              {groupedCustomers.map((customer) => (
                <button
                  key={customer.customerId}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(customer.customerId);
                    fetchCustomerDetails(customer.customerId);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${
                    selectedCustomerId === customer.customerId ? 'bg-slate-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{customer.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {customer.cpf}
                    {customer.phone ? ` - ${customer.phone}` : ''}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {customer.pendingCount} venda(s) marcada(s) -{' '}
                    {customer.pendingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Individual do cliente</h2>
            <p className="text-xs text-slate-500 mt-1">Selecione um cliente à esquerda para ver detalhes.</p>
          </div>

          {!selectedCustomer ? (
            <div className="text-sm text-slate-400">Nenhum cliente selecionado.</div>
          ) : loadingCustomerDetails ? (
            <div className="text-sm text-slate-400">Carregando detalhes...</div>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedCustomer.fullName}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCustomer.cpf}
                  {selectedCustomer.phone ? ` - ${selectedCustomer.phone}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="border border-gray-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs text-slate-500">Total em compras</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {Number(selectedCustomerOverview?.total_sales ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs text-slate-500">Valor já pago</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">
                    {Number(selectedCustomerOverview?.total_paid ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs text-slate-500">Quanto deve</p>
                  <p className="text-sm font-semibold text-amber-700 mt-1">
                    {Number(selectedCustomerOverview?.total_pending ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {selectedCustomerHistory.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">Nenhuma venda para este cliente.</div>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-600 min-w-[520px]">
                      <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
                        <tr>
                          <th className="px-3 py-2 tracking-wider">Venda</th>
                          <th className="px-3 py-2 tracking-wider">Data</th>
                          <th className="px-3 py-2 tracking-wider">Status</th>
                                <th className="px-3 py-2 tracking-wider text-right">Pago</th>
                                <th className="px-3 py-2 tracking-wider text-right">Falta</th>
                          <th className="px-3 py-2 tracking-wider text-right">Valor</th>
                          <th className="px-3 py-2 tracking-wider text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedCustomerHistory.map((sale) => (
                          <tr key={sale.sale_id}>
                            <td className="px-3 py-2 text-xs text-slate-500">#{sale.sale_id}</td>
                            <td className="px-3 py-2">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  sale.payment_status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {sale.payment_status === 'pending' ? 'A prazo' : 'À vista'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-medium">
                              {Number(sale.paid_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-3 py-2 text-right text-amber-700 font-medium">
                              {Number(sale.remaining_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-900">
                              {Number(sale.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {sale.payment_status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={abatementValues[sale.sale_id] ?? ''}
                                    onChange={(event) =>
                                      setAbatementValues((prev) => ({
                                        ...prev,
                                        [sale.sale_id]: event.target.value,
                                      }))
                                    }
                                    className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right hide-spin"
                                    placeholder="Abater"
                                  />
                                  <button
                                    type="button"
                                    className="text-xs bg-slate-900 text-white rounded px-3 py-1 hover:bg-slate-800 disabled:opacity-60"
                                    onClick={() => handleApplyAbatement(sale.sale_id)}
                                    disabled={settlingSaleId === sale.sale_id}
                                  >
                                    Abater
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs bg-emerald-600 text-white rounded px-3 py-1 hover:bg-emerald-700 disabled:opacity-60"
                                    onClick={() => handleSettleSale(sale.sale_id)}
                                    disabled={settlingSaleId === sale.sale_id}
                                  >
                                    {settlingSaleId === sale.sale_id ? 'Baixando...' : 'Quitar'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Pago</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkedSales;
