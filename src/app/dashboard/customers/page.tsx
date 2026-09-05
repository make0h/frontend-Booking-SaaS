'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para el formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [credits, setCredits] = useState('4'); 
  const [formError, setFormError] = useState('');

  const router = useRouter();

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
      } else {
        await api.put(`/users/customers/${editingId}`, payload);
      }
      
      setShowModal(false);
      resetForm();
      fetchCustomers(); 
    } catch (error: any) {
      setFormError(error.response?.data || `Error al ${modalMode === 'create' ? 'registrar' : 'actualizar'} el cliente`);
    }
  };

  const handleDeleteCustomer = async (id: number, customerName: string) => {
    if (confirm(`¿Estás totalmente seguro de eliminar al alumno "${customerName}"? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/users/customers/${id}`);
        fetchCustomers();
      } catch (error: any) {
        alert(error.response?.data || 'Error al eliminar el cliente');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCredits('4');
    setEditingId(null);
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
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Directorio de Alumnos</h2>
          <p className="text-slate-400 mt-1">Gestiona las inscripciones y el saldo de clases (créditos) de cada niño.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-cyan-900/50 hover:bg-cyan-500 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Alumno
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-700 text-center">
            <div className="text-4xl mb-3">👶</div>
            <h3 className="text-lg font-bold text-white">No hay alumnos registrados</h3>
            <p className="text-slate-400 font-medium mt-1">Registra a tu primer alumno y asígnale su paquete de clases.</p>
          </div>
        ) : (
          customers.map((customer: any) => (
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
                
                {/* 
                  BOTONES DE EDICIÓN Y BORRADO (Móvil vs Desktop)
                  - En celular (por defecto): Visibles siempre, fondo oscuro y un poco más grandes para que los dedos los toquen fácil.
                  - En PC (md:): Se esconden (opacity-0) y solo aparecen cuando el mouse pasa por la tarjeta (group-hover).
                */}
                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(customer)} // Usa 'teacher' en el archivo de profesores
                    className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-slate-800 md:bg-transparent text-slate-400 md:text-slate-500 hover:text-cyan-400 hover:bg-slate-700 md:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteCustomer(customer.id, customer.name)} // Usa handleDeleteTeacher en el otro
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
            </div>
          ))
        )}
      </div>

      {/* MODAL DINÁMICO (Sirve para Crear y Editar) */}
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
    </>
  );
}