import React from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const MobileMenu: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar role no menu mobile:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.role === 'admin');
    };

    loadRole();
  }, [user]);

  return (
    <>
      {/* Menu fixo no rodape - apenas mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden shadow-lg">
        <div className="grid grid-cols-4 h-20">
          <NavLink
            to="/visao-geral"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:widget-2-linear" width={24} />
            <span className="text-[11px] font-medium">Visao Geral</span>
          </NavLink>

          <NavLink
            to="/produtos"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:box-linear" width={24} />
            <span className="text-[11px] font-medium">Produtos</span>
          </NavLink>

          <NavLink
            to="/vendas"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full gap-1 ${
                isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
              } transition-colors`
            }
          >
            <Icon icon="solar:cart-large-minimalistic-linear" width={24} />
            <span className="text-[11px] font-medium">Vendas</span>
          </NavLink>

          {isAdmin ? (
            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-1 ${
                  isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
                } transition-colors`
              }
            >
              <Icon icon="solar:users-group-two-rounded-linear" width={24} />
              <span className="text-[11px] font-medium">Clientes</span>
            </NavLink>
          ) : (
            <div className="h-full" />
          )}
        </div>
      </nav>

      {/* Padding no final da pagina para o menu nao ficar por cima do conteudo */}
      <div className="h-20 lg:h-0" />
    </>
  );
};

export default MobileMenu;
