'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ClayButton from '@/components/ClayButton'; 
import { motion, AnimatePresence } from 'framer-motion';

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
        api.get('/packages').catch(() => ({ data: [] }))
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

  // ================= LÓGICA DE CLASES =================
  const resetServiceForm = () => {
    setName(''); setDuration(45); setPrice(0); setInstructorPayout(0); setMaxCapacity(1); setEditingServiceId(null);
  };

  const openCreateServiceModal = () => { resetServiceForm(); setServiceModalMode('create'); setShowServiceModal(true); };

  const openEditServiceModal = (service: any) => {
    setEditingServiceId(service.id); setName(service.name); setDuration(service.durationMinutes);
    setPrice(service.price || 0); setInstructorPayout(service.instructorPayout || 0); setMaxCapacity(service.maxCapacity || 1);
    setServiceModalMode('edit'); setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { id: serviceModalMode === 'edit' ? editingServiceId : 0, name, durationMinutes: duration, price, instructorPayout, maxCapacity, businessId: 1 };
    const loadingToast = toast.loading(serviceModalMode === 'create' ? 'Creando clase...' : 'Guardando cambios...');
    try {
      if (serviceModalMode === 'create') {
        await api.post('/services', payload);
        toast.success('Clase creada con éxito', { id: loadingToast });
      } else {
        await api.put(`/services/${editingServiceId}`, payload);
        toast.success('Clase actualizada', { id: loadingToast });
      }
      setShowServiceModal(false); fetchData();
    } catch (error: any) {
      toast.error(typeof error.response?.data === 'string' ? error.response.data : 'Error inesperado', { id: loadingToast });
    }
  };

  const handleDeleteService = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta clase?')) {
      const loadingToast = toast.loading('Eliminando...');
      try { await api.delete(`/services/${id}`); toast.success('Servicio eliminado', { id: loadingToast }); fetchData();
      } catch (error: any) { toast.error('No se pudo eliminar la clase', { id: loadingToast }); }
    }
  };

  // ================= LÓGICA DE PAQUETES =================
  const resetPackageForm = () => {
    setPackageName(''); setPackageDescription(''); setClassCount(4); setPricePerClass(0); setEditingPackageId(null);
  };

  const openCreatePackageModal = () => { resetPackageForm(); setPackageModalMode('create'); setShowPackageModal(true); };

  const openEditPackageModal = (pkg: any) => {
    setEditingPackageId(pkg.id); setPackageName(pkg.name); setPackageDescription(pkg.description || '');
    setClassCount(pkg.classCount); setPricePerClass(pkg.pricePerClass);
    setPackageModalMode('edit'); setShowPackageModal(true);
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { id: packageModalMode === 'edit' ? editingPackageId : 0, name: packageName, description: packageDescription, classCount, pricePerClass, totalPrice: classCount * pricePerClass, businessId: 1 };
    const loadingToast = toast.loading(packageModalMode === 'create' ? 'Creando paquete...' : 'Guardando cambios...');
    try {
      if (packageModalMode === 'create') {
        await api.post('/packages', payload);
        toast.success('Paquete creado con éxito', { id: loadingToast });
      } else {
        await api.put(`/packages/${editingPackageId}`, payload);
        toast.success('Paquete actualizado', { id: loadingToast });
      }
      setShowPackageModal(false); fetchData();
    } catch (error: any) {
      toast.error(typeof error.response?.data === 'string' ? error.response.data : 'Error inesperado', { id: loadingToast });
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar este paquete?')) {
      const loadingToast = toast.loading('Eliminando paquete...');
      try { await api.delete(`/packages/${id}`); toast.success('Paquete eliminado', { id: loadingToast }); fetchData();
      } catch (error: any) { toast.error('No se pudo eliminar el paquete', { id: loadingToast }); }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
      
      {/* HEADER Y PESTAÑAS */}
      <div>
        <h2 className="text-4xl font-black text-white tracking-tight">Catálogo y Tarifas</h2>
        <p className="text-slate-400 mt-2 mb-8 font-medium text-lg">Configura las clases individuales y los paquetes mensuales de La Nutria.</p>
        
        <div className="flex gap-6 border-b-2 border-slate-800 pb-px">
          <button 
            onClick={() => setActiveTab('classes')}
            className={`pb-4 px-2 font-black text-lg transition-colors border-b-4 ${activeTab === 'classes' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            Clases y Servicios
          </button>
          <button 
            onClick={() => setActiveTab('packages')}
            className={`pb-4 px-2 font-black text-lg transition-colors border-b-4 ${activeTab === 'packages' ? 'text-indigo-400 border-indigo-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            Paquetes Mensuales
          </button>
        </div>
      </div>

      {/* ================= VISTA DE CLASES ================= */}
      {activeTab === 'classes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="flex justify-end mb-2">
            <ClayButton onClick={openCreateServiceModal} colorClass="bg-cyan-500 text-white">
              <span className="text-2xl leading-none">+</span> Nueva Clase
            </ClayButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div 
                key={service.id} 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
                className="bg-slate-800 rounded-[2rem] p-6 shadow-clay flex flex-col justify-between relative group border-2 border-slate-700/50"
              >
                <div className="absolute top-6 right-6 flex gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEditServiceModal(service)} className="bg-slate-700 text-amber-400 w-12 h-12 rounded-2xl shadow-clay flex items-center justify-center text-xl">✏️</motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteService(service.id)} className="bg-slate-700 text-red-400 w-12 h-12 rounded-2xl shadow-clay flex items-center justify-center text-xl">🗑️</motion.button>
                </div>

                <div className="w-20 h-20 rounded-3xl bg-slate-900 shadow-clay flex items-center justify-center text-4xl mb-6 text-cyan-400">🏊‍♂️</div>
                <h3 className="text-2xl font-black text-white mb-6 pr-20">{service.name}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">⏱️ Duración</span>
                    <span className="text-white font-black">{service.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">👥 Aforo</span>
                    <span className="text-cyan-400 font-black">{service.maxCapacity} niños</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">💰 Precio</span>
                    <span className="text-emerald-400 font-black text-lg">${service.price?.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {services.length === 0 && (
              <div className="col-span-full bg-slate-800 rounded-[3rem] p-16 text-center shadow-clay border-2 border-dashed border-slate-600">
                <p className="text-slate-400 font-bold text-xl">No tienes ninguna clase configurada todavía 🦦</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= VISTA DE PAQUETES ================= */}
      {activeTab === 'packages' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div className="flex justify-end mb-2">
            <ClayButton onClick={openCreatePackageModal} colorClass="bg-indigo-500 text-white">
              <span className="text-2xl leading-none">+</span> Nuevo Paquete
            </ClayButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div 
                key={pkg.id} 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
                className="bg-slate-800 rounded-[2rem] p-6 shadow-clay flex flex-col justify-between relative group border-2 border-slate-700/50"
              >
                <div className="absolute top-6 right-6 flex gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEditPackageModal(pkg)} className="bg-slate-700 text-amber-400 w-12 h-12 rounded-2xl shadow-clay flex items-center justify-center text-xl">✏️</motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeletePackage(pkg.id)} className="bg-slate-700 text-red-400 w-12 h-12 rounded-2xl shadow-clay flex items-center justify-center text-xl">🗑️</motion.button>
                </div>

                <div className="w-20 h-20 rounded-3xl bg-slate-900 shadow-clay flex items-center justify-center text-4xl mb-6 text-indigo-400">🎟️</div>
                <h3 className="text-2xl font-black text-white mb-2 pr-20">{pkg.name}</h3>
                <p className="text-slate-400 font-medium mb-6 min-h-[48px]">{pkg.description || 'Sin descripción'}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
                    <span className="text-slate-400 font-bold text-sm">Clases Incluidas:</span>
                    <span className="text-indigo-300 font-black bg-indigo-900/50 px-3 py-1 rounded-xl shadow-inner border border-indigo-500/20">{pkg.classCount} Clases</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
                    <span className="text-slate-400 font-bold text-sm">Precio por clase:</span>
                    <span className="text-slate-200 font-black">${pkg.pricePerClass?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center bg-indigo-900/20 p-5 rounded-2xl shadow-inner mt-2 border border-indigo-500/10">
                    <span className="text-indigo-400 font-black">PRECIO TOTAL:</span>
                    <span className="text-indigo-300 font-black text-xl">${(pkg.classCount * pkg.pricePerClass).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full bg-slate-800 rounded-[3rem] p-16 text-center shadow-clay border-2 border-dashed border-slate-600">
                <p className="text-slate-400 font-bold text-xl">Aún no has creado paquetes mensuales.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ================= MODAL DE CLASES ================= */}
      <AnimatePresence>
        {showServiceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay w-full max-w-lg overflow-hidden border-2 border-slate-700">
              <div className="px-8 py-6 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">{serviceModalMode === 'create' ? 'Configurar Nueva Clase' : 'Editar Clase'}</h3>
                <button onClick={() => setShowServiceModal(false)} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-red-400 transition-colors">&times;</button>
              </div>
              
              <form onSubmit={handleServiceSubmit} className="px-8 pb-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Nombre de la Clase</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 shadow-inner text-white font-bold rounded-2xl p-4 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 transition-all" required />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Duración (Min)</label>
                    <input type="number" min="15" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-white font-bold rounded-2xl p-4 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Aforo Máximo</label>
                    <input type="number" min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-cyan-400 font-black rounded-2xl p-4 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 transition-all" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Precio Cliente</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">$</span>
                      <input type="number" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-white font-black rounded-2xl p-4 pl-8 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Pago Instructor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">$</span>
                      <input type="number" min="0" value={instructorPayout} onChange={(e) => setInstructorPayout(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-white font-black rounded-2xl p-4 pl-8 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 transition-all" required />
                    </div>
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <ClayButton type="button" onClick={() => setShowServiceModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1">Cancelar</ClayButton>
                  <ClayButton type="submit" colorClass="bg-cyan-600 text-white w-full" className="flex-1">Guardar</ClayButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL DE PAQUETES ================= */}
      <AnimatePresence>
        {showPackageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay w-full max-w-lg overflow-hidden border-2 border-slate-700">
              <div className="px-8 py-6 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">{packageModalMode === 'create' ? 'Crear Paquete' : 'Editar Paquete'}</h3>
                <button onClick={() => setShowPackageModal(false)} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-red-400 transition-colors">&times;</button>
              </div>
              
              <form onSubmit={handlePackageSubmit} className="px-8 pb-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Nombre del Paquete</label>
                  <input type="text" placeholder="Ej: Plan Mensual - 8 Clases" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="w-full bg-slate-900 shadow-inner text-white font-bold rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Descripción</label>
                  <input type="text" value={packageDescription} onChange={(e) => setPackageDescription(e.target.value)} className="w-full bg-slate-900 shadow-inner text-white font-medium rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Total Clases</label>
                    <input type="number" min="1" value={classCount} onChange={(e) => setClassCount(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-indigo-400 font-black rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Precio por Clase</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">$</span>
                      <input type="number" min="0" value={pricePerClass} onChange={(e) => setPricePerClass(Number(e.target.value))} className="w-full bg-slate-900 shadow-inner text-white font-black rounded-2xl p-4 pl-8 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all" required />
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-900/40 border border-indigo-500/20 p-6 rounded-3xl mt-4 flex justify-between items-center shadow-inner">
                  <span className="text-indigo-300 font-black text-sm">PRECIO TOTAL:</span>
                  <span className="text-indigo-400 font-black text-2xl">${(classCount * pricePerClass).toLocaleString('es-CO')}</span>
                </div>
                <div className="pt-6 flex gap-4">
                  <ClayButton type="button" onClick={() => setShowPackageModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1">Cancelar</ClayButton>
                  <ClayButton type="submit" colorClass="bg-indigo-600 text-white w-full" className="flex-1">Guardar Paquete</ClayButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}