'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const navItems = [
    { name: 'Agenda', href: '/dashboard', icon: '📅' },
    { name: 'Alumnos', href: '/dashboard/customers', icon: '👶' },
    { name: 'Profes', href: '/dashboard/teachers', icon: '🛟' },
    { name: 'Clases', href: '/dashboard/services', icon: '🌊' },
  ];

  return (
    // Agregamos pb-20 (padding-bottom) para que en móvil el contenido no quede detrás de la barra inferior
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans selection:bg-cyan-500/30 pb-20 md:pb-0">
      
      {/* 1. BARRA LATERAL (SIDEBAR) - Solo visible en PC (md:flex) */}
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800 hidden md:flex flex-col backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-cyan-500/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">BookingSaaS</h1>
            <p className="text-xs text-cyan-400 font-medium">Centro Acuático</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/20' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-300 bg-slate-800/50 hover:bg-red-500/90 hover:text-white rounded-xl transition-colors border border-slate-700/50"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header superior móvil (Solo para el logo y cerrar sesión) */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">B</div>
            <span className="font-extrabold text-lg text-white">BookingSaaS</span>
          </div>
          <button onClick={handleLogout} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-bold">Salir</button>
        </header>

        {/* Aquí se inyectan las páginas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* 3. NAVEGACIÓN INFERIOR (BOTTOM TAB BAR) - Solo visible en Móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around items-center p-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`text-xl ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'} transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}