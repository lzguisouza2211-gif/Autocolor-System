import React from 'react';

// Hook para simular as métricas do dashboard
function useDashboardMetrics() {
  return [
    {
      icon: <iconify-icon icon="solar:box-linear" width="20"></iconify-icon>,
      value: '1,248',
      label: 'Produtos Cadastrados',
      badge: '+12%',
      badgeColor: 'emerald',
    },
    {
      icon: <iconify-icon icon="solar:bag-check-linear" width="20"></iconify-icon>,
      value: 'R$ 48.2k',
      label: 'Vendas (Mês)',
      badge: '+5%',
      badgeColor: 'emerald',
    },
    {
      icon: <iconify-icon icon="solar:danger-circle-linear" width="20"></iconify-icon>,
      value: '8',
      label: 'Estoque Crítico',
      badge: 'Atenção',
      badgeColor: 'orange',
    },
    {
      icon: <iconify-icon icon="solar:users-group-rounded-linear" width="20"></iconify-icon>,
      value: '342',
      label: 'Clientes Ativos',
      badge: null,
      badgeColor: 'slate',
    },
  ];
}

const badgeColors: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-50',
  orange: 'text-orange-600 bg-orange-50',
  slate: 'text-slate-600 bg-slate-100',
};

const DashboardMetrics: React.FC = () => {
  const metrics = useDashboardMetrics();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${badgeColors[metric.badgeColor]}`}>{metric.icon}</div>
            {metric.badge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[metric.badgeColor]}`}>{metric.badge}</span>
            )}
          </div>
          <div className="text-2xl font-semibold text-slate-900 tracking-tight">{metric.value}</div>
          <div className="text-xs text-slate-500 mt-1">{metric.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
