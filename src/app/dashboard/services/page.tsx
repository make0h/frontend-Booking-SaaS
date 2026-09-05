'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Campos del formulario
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(1);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setName('');
    setDuration(45);
    setPrice(0);
    setMaxCapacity(1);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (service: any) => {
    setEditingId(service.id);
    setName(service.name);
    setDuration(service.durationMinutes);
    setPrice(service.price || 0);
    setMaxCapacity(service.maxCapacity || 1);
    
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Armamos el paquete de datos que C# está esperando
    const payload = { 
      name, 
      durationMinutes: duration, 
      price, 
      maxCapacity,
      businessId: 1 // Por defecto, asignado a tu negocio principal
    };
    
    const loadingToast = toast.loading(modalMode === 'create' ? 'Creando...' : 'Guardando cambios...');

    try {
      if (modalMode === 'create') {
        await api.post('/services', payload);
        toast.success('Clase/Servicio creado', { id: loadingToast });
      } else {
        await api.put(`/services/${editingId}`, payload);
        toast.success('Servicio actualizado', { id: loadingToast });
      }
      setShowModal(false);
      fetchServices();
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'string' ? error.response.data : 'Ocurrió un error inesperado';
      toast.error(errorMsg, { id: loadingToast });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta clase?')) {
      const loadingToast = toast.loading('Eliminando...');
      try {
        await api.delete(`/services/${id}`);
        toast.success('Servicio eliminado', { id: loadingToast });
        fetchServices();
      } catch (error: any) {
        const errorMsg = typeof error.response?.data === 'string' ? error.response.data : 'No se pudo eliminar';
        toast.error(errorMsg, { id: loadingToast, duration: 5000 });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Catálogo de Clases</h2>
          <p className="text-slate-400 mt-1">Configura los servicios, duraciones, precios y aforo máximo permitidos.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full md:w-auto bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-cyan-500 transition active:scale-95 flex gap-2 items-center justify-center"
        >
          <span className="text-xl">+</span> Nueva Clase
        </button>
      </div>

      {/* GRILLA DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between">
            
            {/* Opciones ocultas que aparecen al pasar el mouse (o siempre en móvil) */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(service)} className="bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 p-2 rounded-lg border border-slate-700 transition" title="Editar">
                ✏️
              </button>
              <button onClick={() => handleDelete(service.id)} className="bg-slate-800 hover:bg-red-900/50 text-red-400 p-2 rounded-lg border border-slate-700 transition" title="Eliminar">
                🗑️
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-5 pr-16">{service.name}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 text-sm font-medium">⏱️ Duración</span>
                <span className="text-white font-bold">{service.durationMinutes} min</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 text-sm font-medium">👥 Aforo Máximo</span>
                <span className="text-cyan-400 font-bold">{service.maxCapacity} niños</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 text-sm font-medium">💰 Precio Ref.</span>
                <span className="text-emerald-400 font-bold">${service.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-xl">
            <p className="text-slate-400 mb-2">No tienes ninguna clase configurada todavía.</p>
            <p className="text-sm text-slate-500">Haz clic en "Nueva Clase" para empezar.</p>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'create' ? 'Configurar Nueva Clase' : 'Editar Configuración'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Nombre de la Clase</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej. Estimulación Temprana"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Duración (Minutos)</label>
                  <input 
                    type="number" 
                    min="15" 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))} 
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Aforo Máximo</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={maxCapacity} 
                    onChange={(e) => setMaxCapacity(Number(e.target.value))} 
                    className="w-full bg-slate-800 border border-slate-700 text-cyan-400 font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Precio Referencial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))} 
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-cyan-500" 
                    required 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-md transition">
                  {modalMode === 'create' ? 'Crear Clase' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}