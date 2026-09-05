'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('45'); 
  const [maxCapacity, setMaxCapacity] = useState('5');
  const [formError, setFormError] = useState('');

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error("Error al cargar servicios", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await api.post('/services', {
        name: name,
        price: parseFloat(price),
        durationMinutes: parseInt(duration),
        maxCapacity: parseInt(maxCapacity),
        businessId: 1 
      });
      
      setShowModal(false);
      resetForm();
      fetchServices(); 
    } catch (error: any) {
      setFormError(error.response?.data || 'Error al crear el servicio');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el nivel "${name}"? Esto podría afectar a clases ya programadas.`)) {
      try {
        await api.delete(`/services/${id}`);
        fetchServices();
      } catch (error: any) {
        alert('No se pudo eliminar. Es posible que tenga clases activas asociadas.');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDuration('45');
    setMaxCapacity('5');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Catálogo de Clases</h2>
          <p className="text-slate-400 mt-1">Define los niveles de natación, duraciones y cupos máximos de la piscina.</p>
        </div>
        <button 
          onClick={() => { setFormError(''); setShowModal(true); }}
          className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-cyan-900/50 hover:bg-cyan-500 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Nivel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-700 text-center">
            <div className="text-4xl mb-3">🏊‍♂️</div>
            <h3 className="text-lg font-bold text-white">No hay clases configuradas</h3>
            <p className="text-slate-400 font-medium mt-1">Crea tu primer nivel de estimulación o natación para empezar.</p>
          </div>
        ) : (
          services.map((svc: any) => (
            <div key={svc.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-cyan-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 text-cyan-400 border border-slate-700 rounded-xl flex items-center justify-center text-xl">
                    🌊
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{svc.name}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(svc.id, svc.name)}
                  className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar clase"
                >
                  ✖
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Costo / Clase</p>
                  <p className="text-lg font-extrabold text-white">${svc.price.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Duración</p>
                  <p className="text-lg font-extrabold text-white">{svc.durationMinutes} min</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Capacidad Máxima:</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold px-3 py-1 rounded-full">
                  {svc.maxCapacity || 'Sin límite'} alumnos
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-extrabold text-white">Crear Nivel de Natación</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-300 font-bold text-2xl">&times;</button>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-md">
                <p className="text-sm text-red-400 font-medium">{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateService} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Nombre del Nivel</label>
                <input 
                  type="text" placeholder="Ej. Estimulación Temprana Nivel 1" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Costo Base ($)</label>
                  <input 
                    type="number" placeholder="50000" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Duración (Min)</label>
                  <input 
                    type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                  />
                </div>
              </div>

              <div className="bg-cyan-900/20 border border-cyan-800/50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-cyan-400 mb-1.5 flex items-center gap-2">
                  <span>🏊‍♂️</span> Capacidad de la Piscina
                </label>
                <p className="text-xs text-slate-400 mb-2">Define el límite máximo de alumnos simultáneos permitidos en esta clase.</p>
                <input 
                  type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} min="1"
                  className="w-full bg-slate-800 border border-cyan-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3.5 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 shadow-md transition-all">
                  Guardar Nivel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}