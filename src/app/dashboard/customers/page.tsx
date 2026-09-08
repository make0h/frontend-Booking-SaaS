'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ClayButton from '@/components/ClayButton'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para la barra de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el Modal de Crear/Editar
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para el formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [credits, setCredits] = useState('4'); 
  const [formError, setFormError] = useState('');

  // Estados para el Modal de Confirmación de Borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{id: number, name: string} | null>(null);

  const router = useRouter();

  const getErrorMessage = (err: any) => {
    const data = err.response?.data;
    if (typeof data === 'string' && !data.includes('<html')) return data;
    return 'Ocurrió un error inesperado al conectar con el servidor.';
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/users/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error("Error al cargar clientes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // LÓGICA DE BÚSQUEDA
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (customer: any) => {
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setCredits(customer.monthlyCredits?.toString() || '0');
    
    setModalMode('edit');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const loadingToast = toast.loading(modalMode === 'create' ? 'Inscribiendo...' : 'Guardando cambios...');

    const payload = {
      name,
      email,
      phone,
      monthlyCredits: parseInt(credits),
      businessId: 1
    };

    try {
      if (modalMode === 'create') {
        await api.post('/users/customers', payload);
        toast.success('¡Alumno inscrito con éxito!', { id: loadingToast });
      } else {
        await api.put(`/users/customers/${editingId}`, payload);
        toast.success('Datos actualizados', { id: loadingToast });
      }
      
      setShowModal(false);
      resetForm();
      fetchCustomers(); 
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setFormError(errorMsg); 
      toast.error('Revisa los datos e intenta de nuevo', { id: loadingToast });
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setCustomerToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!customerToDelete) return;
    
    const loadingToast = toast.loading('Eliminando alumno...');
    
    try {
      await api.delete(`/users/customers/${customerToDelete.id}`);
      toast.success('Alumno eliminado correctamente', { id: loadingToast });
      fetchCustomers();
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error: any) {
      toast.error(getErrorMessage(error), { id: loadingToast, duration: 5000 });
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCredits('4');
    setEditingId(null);
  };

  const generateAndCopyMagicLink = async (customerId: number, currentToken: string | null) => {
    const loadingToast = toast.loading('Preparando enlace mágico...');
    try {
      let tokenToUse = currentToken;
      
      if (!tokenToUse) {
        const response = await api.post(`/users/customers/${customerId}/generate-magic-link`);
        tokenToUse = response.data.magicToken;
        fetchCustomers(); 
      }

      const url = `${window.location.origin}/portal/${tokenToUse}`;
      await navigator.clipboard.writeText(url);
      
      toast.success('¡Enlace del Portal copiado!', { 
        id: loadingToast, 
        icon: '🔗',
        duration: 4000 
      });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el enlace', { id: loadingToast });
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
      
      {/* HEADER CON BUSCADOR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Directorio de Alumnos</h2>
          <p className="text-slate-400 mt-2 font-medium text-lg">Gestiona las inscripciones y el saldo de clases de cada niño.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Efecto hundido (shadow-inner) para el input de búsqueda
              className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800 w-8 h-8 rounded-full shadow-clay text-slate-400 hover:text-white font-bold flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            )}
          </div>
          
          <ClayButton 
            onClick={openCreateModal}
            colorClass="bg-cyan-500 text-white"
            className="w-full sm:w-auto"
          >
            <span className="text-2xl leading-none">+</span> Nuevo Alumno
          </ClayButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {customers.length === 0 ? (
          <div className="col-span-full bg-slate-800 rounded-[3rem] p-16 text-center shadow-clay border-2 border-dashed border-slate-600">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-2xl font-black text-white">No hay alumnos registrados</h3>
            <p className="text-slate-400 font-medium mt-2 text-lg">Registra a tu primer alumno y asígnale su paquete de clases.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-slate-800 rounded-[3rem] p-16 text-center shadow-clay border-2 border-slate-700">
            <div className="text-6xl mb-4">🔎</div>
            <h3 className="text-2xl font-black text-white">No hay resultados</h3>
            <p className="text-slate-400 font-medium mt-2 text-lg">No encontramos ningún alumno llamado "{searchTerm}".</p>
          </div>
        ) : (
          filteredCustomers.map((customer: any, index: number) => (
            <motion.div 
              key={customer.id} 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
              className="bg-slate-800 rounded-[2rem] p-6 shadow-clay flex flex-col justify-between relative group border-2 border-slate-700/50"
            >
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-900 text-cyan-400 border border-slate-700 rounded-2xl flex items-center justify-center font-black text-3xl shadow-inner">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight truncate max-w-[150px]">{customer.name}</h3>
                    <p className="text-sm text-slate-400 font-bold">{customer.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEditModal(customer)} className="bg-slate-700 text-amber-400 w-10 h-10 rounded-xl shadow-clay flex items-center justify-center text-lg">✏️</motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => confirmDelete(customer.id, customer.name)} className="bg-slate-700 text-red-400 w-10 h-10 rounded-xl shadow-clay flex items-center justify-center text-lg">🗑️</motion.button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30 flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Créditos Disponibles</span>
                <div className={`px-4 py-1.5 rounded-xl font-black shadow-clay ${
                  (customer.monthlyCredits || 0) > 0 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {customer.monthlyCredits || 0} Clases
                </div>
              </div>

              <ClayButton 
                onClick={() => generateAndCopyMagicLink(customer.id, customer.magicToken)}
                colorClass="bg-indigo-600 text-white w-full"
                className="py-3 text-sm"
              >
                <span>🔗</span> Copiar Link del Portal
              </ClayButton>

            </motion.div>
          ))
        )}
      </div>

      {/* MODAL DINÁMICO (Crear y Editar) */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay w-full max-w-md overflow-hidden border-2 border-slate-700">
              <div className="px-8 py-6 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">
                  {modalMode === 'create' ? 'Inscribir Alumno' : 'Editar Alumno'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-red-400 transition-colors">&times;</button>
              </div>
              
              {formError && (
                <div className="mx-8 mt-2 bg-red-900/40 border border-red-500/50 p-4 rounded-2xl shadow-inner">
                  <p className="text-sm text-red-400 font-bold text-center">{formError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Nombre Completo del Niño/a</label>
                  <input 
                    type="text" placeholder="Ej. Mateo García" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold placeholder-slate-600 rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Teléfono del Acudiente</label>
                  <input 
                    type="tel" placeholder="Ej. 300 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold placeholder-slate-600 rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Correo del Acudiente (Opcional)</label>
                  <input 
                    type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold placeholder-slate-600 rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                  />
                </div>
                
                <div className="bg-slate-900/60 p-5 rounded-3xl shadow-inner border border-slate-700/50">
                  <label className="block text-sm font-black text-cyan-400 mb-2 flex items-center gap-2">
                    <span>🎟️</span> {modalMode === 'create' ? 'Paquete Inicial (Créditos)' : 'Ajustar Créditos'}
                  </label>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    {modalMode === 'create' 
                      ? 'Cuántas clases está pagando en su primera mensualidad.' 
                      : 'Modifica el saldo actual si el cliente renovó o necesita un ajuste.'}
                  </p>
                  <input 
                    type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min="0"
                    className="w-full bg-slate-800 shadow-inner border border-cyan-800/50 text-white font-black text-xl rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none text-center" required
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <ClayButton type="button" onClick={() => { setShowModal(false); resetForm(); }} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1">Cancelar</ClayButton>
                  <ClayButton type="submit" colorClass="bg-cyan-600 text-white w-full" className="flex-1">
                    {modalMode === 'create' ? 'Inscribir' : 'Guardar'}
                  </ClayButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-sm overflow-hidden p-8 text-center">
              
              <div className="w-20 h-20 bg-slate-900 text-red-500 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                ⚠️
              </div>
              
              <h3 className="text-2xl font-black text-white mb-3">
                ¿Eliminar a <br/><span className="text-red-400">{customerToDelete?.name}</span>?
              </h3>
              <p className="text-slate-400 mb-8 font-medium">
                Esta acción no se puede deshacer y el alumno perderá acceso a su portal.
              </p>
              
              <div className="flex gap-4">
                <ClayButton onClick={() => setShowDeleteModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1 py-3 text-sm">Cancelar</ClayButton>
                <ClayButton onClick={executeDelete} colorClass="bg-red-600 text-white w-full" className="flex-1 py-3 text-sm">Sí, eliminar</ClayButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}