'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'classes' | 'packages'>('classes');

  // ================= ESTADOS PARA CLASES (SERVICES) =================
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<'create' | 'edit'>('create');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(0);
  const [instructorPayout, setInstructorPayout] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(1);

  // ================= ESTADOS PARA PAQUETES =================
  const [packages, setPackages] = useState<any[]>([]);
  
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageModalMode, setPackageModalMode] = useState<'create' | 'edit'>('create');
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);

  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [classCount, setClassCount] = useState(4);
  const [pricePerClass, setPricePerClass] = useState(0);

  // ================= FETCH DE DATOS =================
  const fetchData = async () => {
    try {
      const [servicesRes, packagesRes] = await Promise.all([
        api.get('/services'),
        api.get('/packages').catch(() => ({ data: [] })) // Fallback temporal si no existe el endpoint aún
      ]);
      setServices(servicesRes.data);
      setPackages(packagesRes.data);
    } catch (error) {
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= LÓGICA DE CLASES (SERVICES) =================
  const resetServiceForm = () => {
    setName('');
    setDuration(45);
    setPrice(0);
    setInstructorPayout(0);
    setMaxCapacity(1);
    setEditingServiceId(null);
  };

  const openCreateServiceModal = () => {
    resetServiceForm();
    setServiceModalMode('create');
    setShowServiceModal(true);
  };

  const openEditServiceModal = (service: any) => {
    setEditingServiceId(service.id);
    setName(service.name);
    setDuration(service.durationMinutes);
    setPrice(service.price || 0);
    setInstructorPayout(service.instructorPayout || 0);
    setMaxCapacity(service.maxCapacity || 1);
    
    setServiceModalMode('edit');
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, durationMinutes: duration, price, instructorPayout, maxCapacity, businessId: 1 };
    const loadingToast = toast.loading(serviceModalMode === 'create' ? 'Creando clase...' : 'Guardando cambios...');

    try {
      if (serviceModalMode === 'create') {
        await api.post('/services', payload);
        toast.success('Clase creada con éxito', { id: loadingToast });
      } else {
        await api.put(`/services/${editingServiceId}`, payload);
        toast.success('Clase actualizada', { id: loadingToast });
      }
      setShowServiceModal(false);
      fetchData();
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'string' ? error.response.data : 'Ocurrió un error inesperado';
      toast.error(errorMsg, { id: loadingToast });
    }
  };

  const handleDeleteService = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta clase?')) {
      const loadingToast = toast.loading('Eliminando...');
      try {
        await api.delete(`/services/${id}`);
        toast.success('Servicio eliminado', { id: loadingToast });
        fetchData();
      } catch (error: any) {
        toast.error('No se pudo eliminar la clase', { id: loadingToast });
      }
    }
  };

  // ================= LÓGICA DE PAQUETES =================
  const resetPackageForm = () => {
    setPackageName('');
    setPackageDescription('');
    setClassCount(4);
    setPricePerClass(0);
    setEditingPackageId(null);
  };

  const openCreatePackageModal = () => {
    resetPackageForm();
    setPackageModalMode('create');
    setShowPackageModal(true);
  };

  const openEditPackageModal = (pkg: any) => {
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name);
    setPackageDescription(pkg.description || '');
    setClassCount(pkg.classCount);
    setPricePerClass(pkg.pricePerClass);
    
    setPackageModalMode('edit');
    setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      name: packageName, 
      description: packageDescription, 
      classCount, 
      pricePerClass, 
      businessId: 1 
    };
    const loadingToast = toast.loading(packageModalMode === 'create' ? 'Creando paquete...' : 'Guardando cambios...');

    try {
      if (packageModalMode === 'create') {
        await api.post('/packages', payload);
        toast.success('Paquete creado con éxito', { id: loadingToast });
      } else {
        await api.put(`/packages/${editingPackageId}`, payload);
        toast.success('Paquete actualizado', { id: loadingToast });
      }
      setShowPackageModal(false);
      fetchData();
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'string' ? error.response.data : 'Ocurrió un error inesperado';
      toast.error(errorMsg, { id: loadingToast });
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este paquete mensual?')) {
      const loadingToast = toast.loading('Eliminando paquete...');
      try {
        await api.delete(`/packages/${id}`);
        toast.success('Paquete eliminado', { id: loadingToast });
        fetchData();
      } catch (error: any) {
        toast.error('No se pudo eliminar el paquete', { id: loadingToast });
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
    <div className="flex flex-col gap-6">
      
      {/* HEADER Y PESTAÑAS */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Catálogo y Tarifas</h2>
        <p className="text-slate-400 mt-1 mb-6">Configura las clases individuales y los paquetes mensuales que ofreces a tus alumnos.</p>
        
        <div className="flex gap-4 border-b border-slate-800 pb-px">
          <button 
            onClick={() => setActiveTab('classes')}
            className={`pb-3 px-2 font-bold text-lg transition-colors border-b-2 ${activeTab === 'classes' ? 'text-cyan-400 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            Clases y Servicios
          </button>
          <button 
            onClick={() => setActiveTab('packages')}
            className={`pb-3 px-2 font-bold text-lg transition-colors border-b-2 ${activeTab === 'packages' ? 'text-cyan-400 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            Paquetes Mensuales
          </button>
        </div>
      </div>

      {/* ================= VISTA DE CLASES ================= */}
      {activeTab === 'classes' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-end mb-4">
            <button 
              onClick={openCreateServiceModal}
              className="bg-cyan-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg hover:bg-cyan-500 transition active:scale-95 flex gap-2 items-center"
            >
              <span className="text-lg leading-none">+</span> Nueva Clase
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between">
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditServiceModal(service)} className="bg-slate-800 hover:bg-cyan-900/50 text-cyan-400 p-2 rounded-lg border border-slate-700 transition" title="Editar">✏️</button>
                  <button onClick={() => handleDeleteService(service.id)} className="bg-slate-800 hover:bg-red-900/50 text-red-400 p-2 rounded-lg border border-slate-700 transition" title="Eliminar">🗑️</button>
                </div>

                <h3 className="text-xl font-bold text-white mb-5 pr-16">{service.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <span className="text-slate-400 text-xs font-medium">⏱️ Duración</span>
                    <span className="text-white font-bold text-sm">{service.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <span className="text-slate-400 text-xs font-medium">👥 Aforo Máximo</span>
                    <span className="text-cyan-400 font-bold text-sm">{service.maxCapacity} niños</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                    <span className="text-slate-400 text-xs font-medium">💰 Cobro / Pago</span>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-xs block">${service.price?.toLocaleString('es-CO')}</span>
                      <span className="text-cyan-400 font-semibold text-[11px] block">Profe: ${service.instructorPayout?.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-xl">
                <p className="text-slate-400 mb-2">No tienes ninguna clase configurada todavía.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VISTA DE PAQUETES ================= */}
      {activeTab === 'packages' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-end mb-4">
            <button 
              onClick={openCreatePackageModal}
              className="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition active:scale-95 flex gap-2 items-center"
            >
              <span className="text-lg leading-none">+</span> Nuevo Paquete
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditPackageModal(pkg)} className="bg-slate-800 hover:bg-indigo-900/50 text-indigo-400 p-2 rounded-lg border border-slate-700 transition" title="Editar">✏️</button>
                  <button onClick={() => handleDeletePackage(pkg.id)} className="bg-slate-800 hover:bg-red-900/50 text-red-400 p-2 rounded-lg border border-slate-700 transition" title="Eliminar">🗑️</button>
                </div>

                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-2xl mb-4">
                  🎟️
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1 pr-16">{pkg.name}</h3>
                <p className="text-sm text-slate-400 mb-5 min-h-[40px]">{pkg.description || 'Sin descripción'}</p>
                
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Clases Incluidas:</span>
                    <span className="bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-lg border border-indigo-500/30">
                      {pkg.classCount} Clases
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">Precio por clase:</span>
                    <span className="text-slate-300 font-bold">${pkg.pricePerClass?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                    <span className="text-slate-300 text-sm font-bold">PRECIO TOTAL:</span>
                    <span className="text-emerald-400 font-black text-lg">${(pkg.classCount * pkg.pricePerClass).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-xl">
                <p className="text-slate-400 mb-2">Aún no has creado paquetes mensuales.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL DE CLASES ================= */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-bold text-white">
                {serviceModalMode === 'create' ? 'Configurar Nueva Clase' : 'Editar Clase'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-500 hover:text-white font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Nombre de la Clase</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Duración (Minutos)</label>
                  <input type="number" min="15" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Aforo Máximo</label>
                  <input type="number" min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-cyan-400 font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Precio Cliente</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold rounded-xl p-3 pl-7 outline-none focus:ring-2 focus:ring-cyan-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Pago Instructor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" min="0" value={instructorPayout} onChange={(e) => setInstructorPayout(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-cyan-400 font-bold rounded-xl p-3 pl-7 outline-none focus:ring-2 focus:ring-cyan-500" required />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-md transition">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE PAQUETES ================= */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-bold text-white">
                {packageModalMode === 'create' ? 'Crear Paquete Mensual' : 'Editar Paquete'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-slate-500 hover:text-white font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handlePackageSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Nombre del Paquete</label>
                <input type="text" placeholder="Ej: Plan Mensual - 8 Clases" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Descripción Breve</label>
                <input type="text" placeholder="Ej: Ideal para entrenar 2 veces por semana" value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Total de Clases</label>
                  <input type="number" min="1" value={classCount} onChange={(e) => setClassCount(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Precio por Clase</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" min="0" value={pricePerClass} onChange={(e) => setPricePerClass(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 text-white font-bold rounded-xl p-3 pl-7 outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl mt-2 flex justify-between items-center">
                <span className="text-indigo-200 font-medium">PRECIO TOTAL DEL PAQUETE:</span>
                <span className="text-emerald-400 font-black text-xl">${(classCount * pricePerClass).toLocaleString('es-CO')}</span>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPackageModal(false)} className="flex-1 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 shadow-md transition">Guardar Paquete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}