import React, { useState } from 'react';
import { Icon } from '@iconify/react';

type ImpostoDetalhe = {
  tributo: number;
  juros: number;
  multa: number;
};

type ImpostoItem = {
  nome: string;
  cor: string;
  detalhe: ImpostoDetalhe;
};

// Dados de exemplo baseados no dashboard jurídico
const impostos: ImpostoItem[] = [
  {
    nome: 'IR',
    cor: '#3B82F6',
    detalhe: { tributo: 2004407.25, juros: 770373.60, multa: 2004407.52 },
  },
  {
    nome: 'CSLL',
    cor: '#8B5CF6',
    detalhe: { tributo: 774350.63, juros: 297384.97, multa: 774350.63 },
  },
  {
    nome: 'PIS/Pasep',
    cor: '#EC4899',
    detalhe: { tributo: 203328.89, juros: 78509.48, multa: 203328.89 },
  },
  {
    nome: 'Cofins',
    cor: '#10B981',
    detalhe: { tributo: 938441.31, juros: 362351.72, multa: 938441.31 },
  },
];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
}

const CATEGORY_COLORS = {
  tributo: { bar: 'bg-blue-500', barMuted: 'bg-blue-500/70', text: 'text-blue-700', legend: 'bg-blue-500' },
  juros: { bar: 'bg-amber-500', barMuted: 'bg-amber-500/70', text: 'text-amber-700', legend: 'bg-amber-500' },
  multa: { bar: 'bg-rose-500', barMuted: 'bg-rose-500/70', text: 'text-rose-700', legend: 'bg-rose-500' },
};

const LEGEND_ITEMS = [
  { label: 'Tributo', color: CATEGORY_COLORS.tributo.legend },
  { label: 'Juros', color: CATEGORY_COLORS.juros.legend },
  { label: 'Multa', color: CATEGORY_COLORS.multa.legend },
];

const NAME_COL_WIDTH = 'w-20';
const ROW_GAP = 'gap-3';

const ImpostosDashboard: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const totals = impostos.reduce(
    (acc, item) => ({
      tributo: acc.tributo + item.detalhe.tributo,
      juros: acc.juros + item.detalhe.juros,
      multa: acc.multa + item.detalhe.multa,
    }),
    { tributo: 0, juros: 0, multa: 0 }
  );
  const totalGeral = totals.tributo + totals.juros + totals.multa;

  const maxTotal = Math.max(
    ...impostos.map((i) => i.detalhe.tributo + i.detalhe.juros + i.detalhe.multa)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] p-5 sm:p-6 w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-indigo-600 rounded-full" />
        <h2 className="text-lg font-semibold text-slate-900">Impostos do Processo</h2>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Total Geral</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{formatCompact(totalGeral)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-100">
          <p className="text-[11px] uppercase tracking-wide text-blue-400 font-medium">Tributo</p>
          <p className="text-base sm:text-lg font-bold text-blue-700 mt-0.5">{formatCompact(totals.tributo)}</p>
        </div>
        <div className="bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
          <p className="text-[11px] uppercase tracking-wide text-amber-400 font-medium">Juros</p>
          <p className="text-base sm:text-lg font-bold text-amber-700 mt-0.5">{formatCompact(totals.juros)}</p>
        </div>
        <div className="bg-rose-50 rounded-lg px-3 py-2.5 border border-rose-100">
          <p className="text-[11px] uppercase tracking-wide text-rose-400 font-medium">Multa</p>
          <p className="text-base sm:text-lg font-bold text-rose-700 mt-0.5">{formatCompact(totals.multa)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Stacked bar rows */}
      <div className="space-y-1">
        {impostos.map((imposto, idx) => {
          const total = imposto.detalhe.tributo + imposto.detalhe.juros + imposto.detalhe.multa;
          const barWidth = (total / maxTotal) * 100;
          const tribPct = (imposto.detalhe.tributo / total) * 100;
          const jurosPct = (imposto.detalhe.juros / total) * 100;
          const multaPct = (imposto.detalhe.multa / total) * 100;
          const isExpanded = expandedIndex === idx;

          return (
            <div key={imposto.nome}>
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className={`w-full flex items-center ${ROW_GAP} py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer`}
              >
                {/* Tax name */}
                <span className={`text-sm font-medium text-slate-700 ${NAME_COL_WIDTH} text-left shrink-0`}>
                  {imposto.nome}
                </span>

                {/* Stacked bar */}
                <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative" style={{ minWidth: 0 }}>
                  <div className="h-full flex rounded-md overflow-hidden" style={{ width: `${barWidth}%` }}>
                    <div
                      className={`h-full ${CATEGORY_COLORS.tributo.bar} transition-all duration-300`}
                      style={{ width: `${tribPct}%` }}
                      title={`Tributo: ${formatCurrency(imposto.detalhe.tributo)}`}
                    />
                    <div
                      className={`h-full ${CATEGORY_COLORS.juros.bar} transition-all duration-300`}
                      style={{ width: `${jurosPct}%` }}
                      title={`Juros: ${formatCurrency(imposto.detalhe.juros)}`}
                    />
                    <div
                      className={`h-full ${CATEGORY_COLORS.multa.bar} transition-all duration-300`}
                      style={{ width: `${multaPct}%` }}
                      title={`Multa: ${formatCurrency(imposto.detalhe.multa)}`}
                    />
                  </div>
                </div>

                {/* Total value */}
                <span className="text-sm font-semibold text-slate-800 w-28 text-right shrink-0">
                  {formatCompact(total)}
                </span>

                {/* Expand chevron */}
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  width={16}
                  className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expandable detail */}
              {isExpanded && (
                <div className="ml-[calc(5rem+0.75rem)] mr-12 mb-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Tributo</span>
                      <p className={`text-sm font-semibold ${CATEGORY_COLORS.tributo.text} mt-0.5`}>
                        {formatCurrency(imposto.detalhe.tributo)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Juros</span>
                      <p className={`text-sm font-semibold ${CATEGORY_COLORS.juros.text} mt-0.5`}>
                        {formatCurrency(imposto.detalhe.juros)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Multa</span>
                      <p className={`text-sm font-semibold ${CATEGORY_COLORS.multa.text} mt-0.5`}>
                        {formatCurrency(imposto.detalhe.multa)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total bar */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className={`flex items-center ${ROW_GAP} px-2`}>
          <span className={`text-sm font-bold text-slate-900 ${NAME_COL_WIDTH} shrink-0`}>Total</span>
          <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden">
            <div className="h-full flex rounded-md overflow-hidden w-full">
              <div
                className={`h-full ${CATEGORY_COLORS.tributo.barMuted}`}
                style={{ width: `${(totals.tributo / totalGeral) * 100}%` }}
                title={`Tributo: ${formatCurrency(totals.tributo)}`}
              />
              <div
                className={`h-full ${CATEGORY_COLORS.juros.barMuted}`}
                style={{ width: `${(totals.juros / totalGeral) * 100}%` }}
                title={`Juros: ${formatCurrency(totals.juros)}`}
              />
              <div
                className={`h-full ${CATEGORY_COLORS.multa.barMuted}`}
                style={{ width: `${(totals.multa / totalGeral) * 100}%` }}
                title={`Multa: ${formatCurrency(totals.multa)}`}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-slate-900 w-28 text-right shrink-0">
            {formatCompact(totalGeral)}
          </span>
          <div className="w-4 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default ImpostosDashboard;
