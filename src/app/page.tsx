'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // Importamos la magia
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      if (role === '1') router.push('/instructor');
      else router.push('/dashboard');
    }
  }, [router]);

  // FILTRO INTELIGENTE DE ERRORES
  const getErrorMessage = (err: any) => {
    const data = err.response?.data;
    // Si es un texto corto que nosotros enviamos desde C# (ej. "Contraseña incorrecta")
    if (typeof data === 'string' && !data.includes('<html')) return data;
    // Si es un error 500 o no hay conexión
    return 'Ocurrió un error inesperado al conectar con el servidor.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/Login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('userRole', response.data.role.toString());

      // Notificación de éxito elegante
      toast.success('¡Bienvenido al sistema!');

      if (response.data.role === 0) { 
        router.push('/dashboard');
      } else if (response.data.role === 1) { 
        router.push('/instructor');
      } else { 
        // Reemplazamos el alert() viejo
        toast('Portal de alumnos en construcción', { icon: '🚧' });
      }

    } catch (err: any) {
      // Usamos el toast de error con el mensaje limpio
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-cyan-500/20">
            B
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">BookingZ</h2>
        <p className="mt-2 text-center text-sm text-slate-400">Inicia sesión para administrar tu centro acuático</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <div className="mt-1">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  placeholder="admin@tuempresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Contraseña</label>
              <div className="mt-1">
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Ingresar al Panel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}