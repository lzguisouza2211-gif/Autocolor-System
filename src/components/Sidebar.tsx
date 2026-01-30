import React from 'react';
import { Icon } from '@iconify/react';

// Hook para simular dados do usuário
function useUser() {
  return {
    name: 'João Silva',
    role: 'Gerente',
    initials: 'JS',
  };
}

interface SidebarProps {
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onTabChange, activeTab }) => {
  const user = useUser();

  return (
    <aside className="hidden lg:flex w-64 border-r border-gray-200 bg-white flex-col h-full sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-medium mr-2">A</div>
        <span className="text-base font-medium tracking-tight text-slate-900">AutoColor</span>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="px-2 text-xs font-medium text-slate-400 mb-2 mt-2 uppercase tracking-wider">Gestão</p>
        <button
          className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} border border-transparent`}
          onClick={() => onTabChange && onTabChange('dashboard')}
        >
          <Icon icon="solar:widget-2-linear" width={18} />
          Visão Geral
        </button>
        <button
          className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'products' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} border border-transparent`}
          onClick={() => onTabChange && onTabChange('products')}
        >
          <Icon icon="solar:box-linear" width={18} />
          Produtos
        </button>
        <button
          className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'sales' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} border border-transparent`}
          onClick={() => onTabChange && onTabChange('sales')}
        >
          <Icon icon="solar:cart-large-minimalistic-linear" width={18} />
          Vendas (PDV)
        </button>
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-medium">{user.initials}</div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-900">{user.name}</span>
            <span className="text-[10px] text-slate-500">{user.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
