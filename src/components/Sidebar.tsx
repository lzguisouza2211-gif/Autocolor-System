
import React from 'react';
import { Icon } from '@iconify/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function useUser() {
  const { user } = useAuth();
  return {
    name: user?.email?.split('@')[0] || 'Usuário',
    role: 'Admin',
    initials: user?.email?.substring(0, 2).toUpperCase() || 'AD',
  };
}

const navItems = [
  { to: '/visao-geral', icon: 'solar:widget-2-linear', label: 'Dashboard' },
  { to: '/produtos', icon: 'solar:box-linear', label: 'Produtos' },
  { to: '/vendas', icon: 'solar:cart-large-minimalistic-linear', label: 'Vendas' },
  // { to: '/clientes', icon: 'solar:users-group-two-rounded-linear', label: 'Clientes' },
  // { to: '/relatorios', icon: 'solar:chart-2-linear', label: 'Relatórios' },
];


interface SidebarProps {
  onOpenChange?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenChange }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const user = useUser(); // Só para pegar as iniciais

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
    <>
      {/* Área sensível invisível para abrir o sidebar */}
      <div
        onMouseEnter={handleMouseEnter}
        style={{ width: open ? 0 : 12, minWidth: 0, height: '100vh', position: 'absolute', left: 0, top: 0, zIndex: 30, background: 'transparent', transition: 'width 0.2s' }}
      />
      <aside
        id="sidebar-autocolor"
        ref={sidebarRef}
        onMouseLeave={handleMouseLeave}
        className={`h-screen flex flex-col py-4 shadow-xl border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${open ? 'w-[220px]' : 'w-[0px]'} relative overflow-hidden`}
        style={{ transitionProperty: 'width, box-shadow, background', transitionDuration: '300ms', zIndex: 20 }}
      >
        {/* Logo ou ícone do sistema */}
        <div className={`mb-8 flex items-center gap-3 px-4 transition-all duration-300 ${open ? 'justify-start' : 'justify-center'}`}>
          {open && <span className="text-slate-800 text-lg font-bold tracking-tight ml-2">AutoColor</span>}
        </div>

        {/* Grupo principal de navegação */}
        <nav className="flex flex-col gap-2 w-full flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-12 rounded-lg transition-all duration-200 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 ${isActive ? 'bg-indigo-200 text-indigo-700 font-semibold' : ''} ${open ? 'justify-start' : 'justify-center'}`
              }
              title={item.label}
            >
              <Icon icon={item.icon} width={22} />
              {open && <span className="text-base">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Grupo inferior: configurações e usuário */}
        <div className={`flex flex-col items-center gap-4 mb-2 px-2 ${open ? 'items-start' : 'items-center'}`}>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 w-full h-12 rounded-lg transition-all duration-200 text-red-400 hover:text-white hover:bg-red-400/80 px-4 ${open ? 'justify-start bg-red-50' : 'justify-center'}`}
            title="Sair"
          >
            <Icon icon="solar:logout-2-linear" width={22} />
            {open && <span className="text-base">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
