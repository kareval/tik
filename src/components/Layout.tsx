import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { AppState, Action, Role } from '../types';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  Euro,
  UserCircle,
  LogOut,
  BarChart3,
  Moon,
  Sun,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  BrainCircuit,
  Shield,
  UserCog
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onRoleChange: (role: Role) => void;
}

const getIcon = (path: string) => {
  switch (path) {
    case '/': return <LayoutDashboard size={20} />;
    case '/projects': return <FolderKanban size={20} />;
    case '/timesheets': return <Clock size={20} />;
    case '/financials': return <Euro size={20} />;
    case '/resources': return <Users size={20} />;
    case '/reports': return <BarChart3 size={20} />;
    case '/insights': return <BrainCircuit size={20} />;
    case '/settings': return <SettingsIcon size={20} />;
    case '/admin/users': return <UserCog size={20} />;
    case '/admin/roles': return <Shield size={20} />;
    default: return <LayoutDashboard size={20} />;
  }
};

export const Layout: React.FC<LayoutProps> = ({ children, state, dispatch, onRoleChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  // Filter items based on Role Allowed Paths
  const items = MENU_ITEMS.filter(item => {
    // If no role defined (e.g. initial load or error), maybe hide everything or show dashboard?
    // Assuming role is loaded. If allowedPaths includes '*', allow all.
    // If allowedPaths includes the path, allow.
    if (!role) return false;
    if (role.allowedPaths.includes('*')) return true;
    return role.allowedPaths.includes(item.path);
  });

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${state.theme}`}>
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center h-16">
          {!collapsed ? (
            <img src="/sapimsa-logo-white.png" alt="SAPIMSA" className="h-8 object-contain" />
          ) : (
            <img src="/sapimsa-isotipo.png" alt="S" className="h-8 w-8 object-contain" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {getIcon(item.path)}
                </span>
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}

                {/* Active Indicator */}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          {!collapsed && (
            <div className="mb-4 px-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Perfil</p>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold">
                  {userProfile?.displayName?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate font-medium text-white">{userProfile?.displayName || 'Usuario'}</p>
                  <p className="truncate text-xs text-slate-500">{role?.name || 'Invitado'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
              {!collapsed && <span className="text-sm">Salir</span>}
            </button>

            <button
              onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
              title="Cambiar Tema"
            >
              {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {!collapsed && <span className="text-sm">{state.theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shadow-sm z-10 transition-colors duration-300">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            SAPIMSA Control
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Cambiar Tema">
              {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full border border-brand-100 dark:border-brand-800 uppercase tracking-wide transition-colors">
              {role?.name || 'Invitado'}
            </span>

            {/* Notification Center would go here */}

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};