import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardMetrics from './components/DashboardMetrics';
import RecentSalesTable from './components/RecentSalesTable';
import ProductsTable from './components/ProductsTable';
import MobileMenu from './components/MobileMenu';
import './App.css';

function VisaoGeral() {
  return (
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
  );
}

function Produtos() {
  return <ProductsTable />;
}

function Vendas() {
  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-xl font-medium tracking-tight text-slate-900">PDV / Vendas</h1>
      <p className="text-sm text-slate-500 mt-1">Em breve: tela de vendas.</p>
    </div>
  );
}

function App() {
  const [dateTime, setDateTime] = useState<string>('');

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
    const interval = setInterval(updateDateTime, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-gray-50 text-slate-800 font-sans h-screen flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 relative">
          <header className="h-16 bg-white/80 backdrop-blur flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
            <div className="flex items-center gap-3 flex-1 lg:flex-none">
              <div className="lg:hidden">
                <MobileMenu />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:inline">{dateTime}</span>
              <button className="p-2 text-slate-400 hover:text-slate-600 relative" aria-label="Notificações">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/visao-geral" replace />} />
              <Route path="/visao-geral" element={<VisaoGeral />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/vendas" element={<Vendas />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
