'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ NUEVO: Estado para la barra de búsqueda
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

  // ✨ LÓGICA DE BÚSQUEDA: Filtramos la lista en tiempo real
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER CON BUSCADOR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Directorio de Alumnos</h2>
          <p className="text-slate-400 mt-1">Gestiona las inscripciones y el saldo de clases (créditos) de cada niño.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar alumno por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-md"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 font-bold"
              >
                &times;
              </button>
            )}
          </div>
          
          <button 
            onClick={openCreateModal}
            className="w-full sm:w-auto bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-cyan-900/50 hover:bg-cyan-500 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-xl leading-none">+</span> Nuevo Alumno
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-700 text-center">
            <div className="text-4xl mb-3">👶</div>
            <h3 className="text-lg font-bold text-white">No hay alumnos registrados</h3>
            <p className="text-slate-400 font-medium mt-1">Registra a tu primer alumno y asígnale su paquete de clases.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center shadow-xl">
            <div className="text-4xl mb-3">🔎</div>
            <h3 className="text-lg font-bold text-white">No hay resultados</h3>
            <p className="text-slate-400 font-medium mt-1">No encontramos ningún alumno llamado "{searchTerm}".</p>
          </div>
        ) : (
          filteredCustomers.map((customer: any) => (
            <div key={customer.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between group">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 text-cyan-400 border border-slate-700 rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight truncate max-w-[150px]">{customer.name}</h3>
                    <p className="text-sm text-slate-400">{customer.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(customer)} 
                    className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-slate-800 md:bg-transparent text-slate-400 md:text-slate-500 hover:text-cyan-400 hover:bg-slate-700 md:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => confirmDelete(customer.id, customer.name)} 
                    className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-slate-800 md:bg-transparent text-slate-400 md:text-slate-500 hover:text-red-400 hover:bg-slate-700 md:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    ✖
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Créditos Disponibles</span>
                <div className={`px-4 py-1.5 rounded-full font-extrabold text-sm border ${
                  (customer.monthlyCredits || 0) > 0 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {customer.monthlyCredits || 0} Clases
                </div>
              </div>

              <button 
                onClick={() => generateAndCopyMagicLink(customer.id, customer.magicToken)}
                className="mt-4 w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2 active:scale-95"
              >
                <span>🔗</span> Copiar Link del Portal
              </button>

            </div>
          ))
        )}
      </div>

      {/* MODAL DINÁMICO (Crear y Editar) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-extrabold text-white">
                {modalMode === 'create' ? 'Inscribir Alumno' : 'Editar Alumno'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-300 font-bold text-2xl">&times;</button>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-md">
                <p className="text-sm text-red-400 font-medium">{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Nombre Completo del Niño/a</label>
                <input 
                  type="text" placeholder="Ej. Mateo García" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Teléfono del Acudiente</label>
                <input 
                  type="tel" placeholder="Ej. 300 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Correo del Acudiente (Opcional)</label>
                <input 
                  type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" 
                />
              </div>
              <div className="bg-cyan-900/20 border border-cyan-800/50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-cyan-400 mb-1.5 flex items-center gap-2">
                  <span>🎟️</span> {modalMode === 'create' ? 'Paquete de Clases (Créditos)' : 'Actualizar Créditos'}
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  {modalMode === 'create' 
                    ? 'Cuántas clases está pagando en su mensualidad actual.' 
                    : 'Modifica el saldo actual si el cliente pagó una nueva mensualidad o necesita un ajuste.'}
                </p>
                <input 
                  type="number" value={credits} onChange={(e) => setCredits(e.target.value)} min="0"
                  className="w-full bg-slate-800 border border-cyan-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3.5 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 shadow-md transition-all">
                  {modalMode === 'create' ? 'Inscribir Alumno' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
              ⚠️
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-2">
              ¿Eliminar a {customerToDelete?.name}?
            </h3>
            <p className="text-slate-400 mb-6 text-sm">
              Esta acción no se puede deshacer. Se eliminarán sus accesos.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 shadow-md shadow-red-900/20 transition-all active:scale-95"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}