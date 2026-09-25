import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  FilePlus, 
  LogOut, 
  Building2, 
  ShieldAlert,
  HeartPulse,
  Users,
  Briefcase
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard Corporativo', path: '/', icon: LayoutDashboard },
    { name: 'Buzón de Expedientes', path: '/bandejas', icon: Inbox },
    { name: 'Nuevo Trámite / Proyecto', path: '/registrar', icon: FilePlus },
  ];

  // Si es Administrador, agregamos Gestión de Usuarios
  if (user?.rol === 'ADMIN') {
    menuItems.push({ name: 'Gestión de Personal & Consultores', path: '/usuarios', icon: Users });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a2e52] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div>
          {/* Medical Cyan Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-teal-400 to-blue-600"></div>
          
          {/* SnowPoint Logo Header */}
          <div className="p-4 border-b border-blue-950 bg-white flex items-center justify-center">
            <img 
              src="/MKT-3.jpg" 
              alt="SnowPoint Healthcare Logo" 
              className="h-12 w-auto object-contain max-w-full rounded"
              onError={(e: any) => { e.currentTarget.src = '/snowpoint-logo.jpg'; }}
            />
          </div>

          <div className="px-4 py-2 bg-[#0f3d62]/60 border-b border-blue-900/50 flex items-center justify-between text-xs text-sky-200">
            <span className="font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-teal-300" />
              Consultora en Salud
            </span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold">
              v2.0
            </span>
          </div>

          {/* User profile brief */}
          {user && (
            <div className="p-4 bg-blue-950/60 border-b border-blue-900/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0284c7] border border-sky-400/40 flex items-center justify-center font-bold text-white text-base shadow-sm">
                {user.nombre.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-slate-100 truncate">{user.nombre}</p>
                <p className="text-xs text-sky-200/80 truncate">{user.cargo}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-sky-500/20 text-sky-300 font-bold rounded border border-sky-500/30">
                  {user.unidad.sigla}
                </span>
              </div>
            </div>
          )}

          {/* Menu Navigation */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md font-bold' 
                      : 'hover:bg-blue-900/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-950 bg-[#07203b]">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
            <span className="flex items-center gap-1.5 text-sky-200 truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span className="truncate">{user?.unidad.nombre}</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-colors duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f3d62] flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              SnowPoint Healthcare - Consultora en Salud
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-xs font-medium">
              {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Firma Digital & Auditoría Médica Activa
            </div>
            {user?.rol === 'ADMIN' && (
              <span className="flex items-center gap-1 text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full font-bold uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                Admin General
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};
