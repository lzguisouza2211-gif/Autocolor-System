import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import DashboardMetrics from './components/DashboardMetrics';
import RecentSalesTable from './components/RecentSalesTable';
import ProductsTable from './components/ProductsTable';
import MobileMenu from './components/MobileMenu';

function App() {
  const [tab, setTab] = useState<string>("dashboard");

  return (
    <div className="bg-gray-50 text-slate-800 font-sans h-screen flex overflow-hidden">
      <Sidebar onTabChange={setTab} activeTab={tab} />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 relative">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-gray-200 flex items-center px-4 lg:px-8 shrink-0 z-10">
          {/* Esquerda: menu e logo */}
          <div className="flex items-center gap-3 flex-1 lg:flex-none">
            <div className="lg:hidden">
              <MobileMenu />
            </div>
            <span className="font-medium tracking-tight text-slate-900">AutoColor</span>
          </div>
          {/* Direita: notificações (mobile) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative" aria-label="Notificações">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
          {/* Direita: busca e notificações (desktop) */}
          <div className="flex items-center gap-3 hidden lg:flex">
            <div className="relative hidden sm:block">
              <input type="text" placeholder="Buscar produto..." className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 w-64 transition-shadow" />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {tab === 'dashboard' && (
            <div className="space-y-6 fade-in">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-xl font-medium tracking-tight text-slate-900">Visão Geral</h1>
                  <p className="text-sm text-slate-500 mt-1">Métricas de hoje</p>
                </div>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                  Relatórios
                </button>
              </div>
              <DashboardMetrics />
              <RecentSalesTable />
            </div>
          )}
          {tab === 'products' && (
            <div className="space-y-6 fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-medium tracking-tight text-slate-900">Produtos</h1>
                  <p className="text-sm text-slate-500 mt-1">Gerencie seu inventário e preços.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                    Filtros
                  </button>
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20">
                    Novo Produto
                  </button>
                </div>
              </div>
              <ProductsTable />
            </div>
          )}
          {tab === 'sales' && (
            <div className="space-y-6 fade-in">
              <h1 className="text-xl font-medium tracking-tight text-slate-900">PDV / Vendas</h1>
              <p className="text-sm text-slate-500 mt-1">Em breve: tela de vendas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
