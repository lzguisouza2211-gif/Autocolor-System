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

  const iconSize = isAdmin ? 20 : 24;
  const labelClass = isAdmin ? 'text-[9px] font-medium' : 'text-[11px] font-medium';
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center h-full gap-1 ${
      isActive ? 'text-slate-900 border-t-2 border-slate-900' : 'text-slate-400'
    } transition-colors`;

  return (
    <>
      {/* Menu fixo no rodape - apenas mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden shadow-lg">
        <div className={`grid h-16 ${isAdmin ? 'grid-cols-6' : 'grid-cols-3'}`}>
          <NavLink to="/visao-geral" className={linkClass}>
            <Icon icon="solar:widget-2-linear" width={iconSize} />
            <span className={labelClass}>Dashboard</span>
          </NavLink>

          <NavLink to="/produtos" className={linkClass}>
            <Icon icon="solar:box-linear" width={iconSize} />
            <span className={labelClass}>Produtos</span>
          </NavLink>

          <NavLink to="/vendas" className={linkClass}>
            <Icon icon="solar:cart-large-minimalistic-linear" width={iconSize} />
            <span className={labelClass}>Vendas</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/vendas-marcadas" className={linkClass}>
                <Icon icon="solar:bill-list-linear" width={iconSize} />
                <span className={labelClass}>Marcadas</span>
              </NavLink>

              <NavLink to="/clientes" className={linkClass}>
                <Icon icon="solar:users-group-two-rounded-linear" width={iconSize} />
                <span className={labelClass}>Clientes</span>
              </NavLink>

              <NavLink to="/financeiro" className={linkClass}>
                <Icon icon="solar:wallet-money-linear" width={iconSize} />
                <span className={labelClass}>Financeiro</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Padding no final da pagina para o menu nao ficar por cima do conteudo */}
      <div className="h-16 lg:h-0" />
    </>
  );
};

export default MobileMenu;
