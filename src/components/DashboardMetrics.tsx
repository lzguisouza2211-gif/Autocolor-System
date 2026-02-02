import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

type MetricData = {
  totalProducts: number;
  totalSalesMonth: number;
  criticalStock: number;
  totalClients: number;
};

const badgeColors: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-50',
  orange: 'text-orange-600 bg-orange-50',
  slate: 'text-slate-600 bg-slate-100',
};

const DashboardMetrics: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricData>({
    totalProducts: 0,
    totalSalesMonth: 0,
    criticalStock: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);

      // Total de produtos cadastrados (não deletados)
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Total de vendas do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: salesData } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', startOfMonth.toISOString());

      const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      // Produtos com estoque crítico (<=10)
      const { count: criticalCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .lte('stock', 10);

      // Total de clientes ativos - removido (users são funcionários/admins, não clientes)

      setMetrics({
        totalProducts: productsCount || 0,
        totalSalesMonth: totalSales,
        criticalStock: criticalCount || 0,
        totalClients: 0, // Desabilitado - não há tabela de clientes
      });

      setLoading(false);
    };

    fetchMetrics();
  }, []);

  const metricsData = [
    {
      icon: <Icon icon="solar:box-linear" width={20} />,
      value: loading ? '...' : metrics.totalProducts.toLocaleString('pt-BR'),
      label: 'Produtos Cadastrados',
      badge: null,
      badgeColor: 'emerald',
      clickable: true,
      onClick: () => navigate('/produtos'),
    },
    {
      icon: <Icon icon="solar:bag-check-linear" width={20} />,
      value: loading ? '...' : `R$ ${(metrics.totalSalesMonth / 10).toFixed(1)}d`,
      label: 'Vendas (Mês)',
      badge: null,
      badgeColor: 'emerald',
      clickable: true,
      onClick: () => navigate('/historico-vendas'),
    },
    {
      icon: <Icon icon="solar:danger-circle-linear" width={20} />,
      value: loading ? '...' : metrics.criticalStock.toString(),
      label: 'Estoque Crítico',
      badge: metrics.criticalStock > 0 ? 'Atenção' : null,
      badgeColor: 'orange',
      clickable: true,
      onClick: () => navigate('/produtos?estoque=critico'),
    },
    {
      icon: <Icon icon="solar:users-group-rounded-linear" width={20} />,
      value: loading ? '...' : metrics.totalClients.toString(),
      label: 'Clientes Ativos',
      badge: null,
      badgeColor: 'slate',
      clickable: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricsData.map((metric, idx) => (
        <div
          key={idx}
          onClick={metric.clickable ? metric.onClick : undefined}
          className={`bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] ${
            metric.clickable ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className={`p-2 rounded-lg ${badgeColors[metric.badgeColor]}`}>{metric.icon}</div>
            {metric.badge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[metric.badgeColor]}`}>{metric.badge}</span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{metric.value}</div>
          <div className="text-xs text-slate-500 mt-1">{metric.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
