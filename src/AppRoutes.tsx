import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardMetrics from './components/DashboardMetrics';
import RecentSalesTable from './components/RecentSalesTable';
import ProductsTable from './components/ProductsTable';
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PDV from './components/PDV';
import './App.css';

function VisaoGeral() {
  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-medium tracking-tight text-slate-900">Visão Geral</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Métricas</p>
        </div>
        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto">
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
// Componente para proteger rotas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Layout principal com Sidebar
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 text-slate-800 font-sans h-screen flex flex-col overflow-hidden lg:flex-row">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50 relative">
        <Header />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <MobileMenu />
    </div>
  );
}

// Layout sem padding para PDV
function PDVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 text-slate-800 font-sans h-screen flex flex-col overflow-hidden lg:flex-row">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        <Header />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <MobileMenu />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/visao-geral" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visao-geral"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VisaoGeral />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Produtos />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <ProtectedRoute>
                <PDVLayout>
                  <PDV />
                </PDVLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
