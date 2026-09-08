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
    <div className="min-h-screen bg-transparent text-slate-200 flex font-sans selection:bg-cyan-500/30 pb-20 md:pb-0">
      
      {/* SIDEBAR OSCURO 3D */}
      <aside className="w-64 bg-slate-900/60 border-r-2 border-slate-800 hidden md:flex flex-col backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-20">
        <div className="p-6 border-b-2 border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-clay">
            🦦
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">La Nutria</h1>
            <p className="text-xs text-cyan-400 font-bold">Centro Acuático</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold ${
                  isActive 
                    ? 'bg-slate-800 text-cyan-400 shadow-clay border border-slate-700' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-cyan-300 hover:shadow-sm'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-400 bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl shadow-clay transition-all duration-300 border border-slate-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-slate-900/80 backdrop-blur-lg border-b-2 border-slate-800 text-white p-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-sm">🦦</div>
            <span className="font-extrabold text-lg">La Nutria</span>
          </div>
          <button onClick={handleLogout} className="text-xs bg-slate-800 shadow-clay text-red-400 px-4 py-2 rounded-xl font-bold">Salir</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* NAVEGACIÓN MÓVIL OSCURA */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t-2 border-slate-800 flex justify-around items-center p-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all ${
                isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-300'
              }`}
            >
              <span className={`text-2xl ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'} transition-transform`}>{item.icon}</span>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0'} transition-all`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}