import React from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';

const MobileMenu: React.FC = () => {
  return (
    <>
      {/* Menu fixo no rodapé - apenas mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden shadow-lg">
        <div className="flex items-center justify-around h-20">
          <NavLink
            to="/visao-geral"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:widget-2-linear" width={24} />
            <span className="text-xs font-medium">Visão Geral</span>
          </NavLink>

          <NavLink
            to="/produtos"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:box-linear" width={24} />
            <span className="text-xs font-medium">Produtos</span>
          </NavLink>

          <NavLink
            to="/vendas"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:cart-large-minimalistic-linear" width={24} />
            <span className="text-xs font-medium">Vendas (PDV)</span>
          </NavLink>
        </div>
      </nav>

      {/* Padding no final da página para o menu não ficar por cima do conteúdo */}
      <div className="h-20 lg:h-0" />
    </>
  );
};

export default MobileMenu;
