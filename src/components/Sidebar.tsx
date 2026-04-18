import React from 'react';
import { Icon } from '@iconify/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SidebarOpenContext } from './SidebarContext.tsx';
import { supabase } from '../supabase';

const baseNavItems = [
  { to: '/visao-geral', icon: 'solar:widget-2-linear', label: 'Dashboard' },
  { to: '/produtos', icon: 'solar:box-linear', label: 'Produtos' },
  { to: '/vendas', icon: 'solar:cart-large-minimalistic-linear', label: 'Vendas' },
];

interface SidebarProps {
  onOpenChange?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenChange }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

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
        console.error('Erro ao carregar role no menu lateral:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.role === 'admin');
    };

    loadRole();
  }, [user]);

  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { to: '/vendas-marcadas', icon: 'solar:bill-list-linear', label: 'Vendas a Prazo' },
        { to: '/clientes', icon: 'solar:users-group-two-rounded-linear', label: 'Clientes' },
      ]
    : baseNavItems;

  // Mouse enter/leave para abrir/fechar
  const handleMouseEnter = () => {
    setOpen(true);
    onOpenChange && onOpenChange(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
    onOpenChange && onOpenChange(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <SidebarOpenContext.Provider value={open}>
      {/* Area sensivel invisivel para abrir o sidebar */}
      <div
        onMouseEnter={handleMouseEnter}
        style={{
          width: open ? 0 : 12,
          minWidth: 0,
          height: '100vh',
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 30,
          background: 'transparent',
          transition: 'width 0.2s',
        }}
      />
      <aside
        id="sidebar-autocolor"
        ref={sidebarRef}
        onMouseLeave={handleMouseLeave}
        className={`h-screen flex flex-col py-4 shadow-xl border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${open ? 'w-[220px]' : 'w-[0px]'} relative overflow-hidden`}
        style={{ transitionProperty: 'width, box-shadow, background', transitionDuration: '300ms', zIndex: 20 }}
      >
        {/* Logo ou icone do sistema */}
        <div
          className={`mb-8 flex items-center gap-3 px-4 transition-all duration-300 ${
            open ? 'justify-start' : 'justify-center'
          }`}
        >
          {open && <span className="text-slate-800 text-lg font-bold tracking-tight ml-2">AutoColor</span>}
        </div>

        {/* Grupo principal de navegacao */}
        <nav className="flex flex-col gap-2 w-full flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-12 rounded-lg transition-all duration-200 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 ${
                  isActive ? 'bg-indigo-200 text-indigo-700 font-semibold' : ''
                } ${open ? 'justify-start' : 'justify-center'}`
              }
              title={item.label}
            >
              <Icon icon={item.icon} width={22} />
              {open && <span className="text-base">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Grupo inferior: sair */}
        <div className={`flex flex-col items-center gap-4 mb-2 px-2 ${open ? 'items-start' : 'items-center'}`}>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 w-full h-12 rounded-lg transition-all duration-200 text-red-400 hover:text-white hover:bg-red-400/80 px-4 ${
              open ? 'justify-start bg-red-50' : 'justify-center'
            }`}
            title="Sair"
          >
            <Icon icon="solar:logout-2-linear" width={22} />
            {open && <span className="text-base">Sair</span>}
          </button>
        </div>
      </aside>
    </SidebarOpenContext.Provider>
  );
};

export default Sidebar;

