'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal dinámico (Crear/Editar)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para el formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  // Estados para el Modal de Confirmación de Borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<{id: number, name: string} | null>(null);

  // FILTRO INTELIGENTE DE ERRORES
  const getErrorMessage = (err: any) => {
    const data = err.response?.data;
    if (typeof data === 'string' && !data.includes('<html')) return data;
    return 'Ocurrió un error inesperado al conectar con el servidor.';
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users/employees');
      setTeachers(response.data);
    } catch (error) {
      console.error("Error al cargar profesores", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (teacher: any) => {
    setEditingId(teacher.id);
    setName(teacher.name);
    setEmail(teacher.email || '');
    setPhone(teacher.phone || '');
    
    setModalMode('edit');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = { name, email, phone };
    const loadingToast = toast.loading(modalMode === 'create' ? 'Registrando instructor...' : 'Guardando cambios...');

    try {
      if (modalMode === 'create') {
        await api.post('/users/employees', payload);
        toast.success('Instructor registrado con éxito', { id: loadingToast });
      } else {
        await api.put(`/users/employees/${editingId}`, payload);
        toast.success('Datos actualizados', { id: loadingToast });
      }
      
      setShowModal(false);
      resetForm();
      fetchTeachers(); 
    } catch (error: any) {
      setFormError(getErrorMessage(error));
      toast.error('Revisa los datos e intenta de nuevo', { id: loadingToast });
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setTeacherToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!teacherToDelete) return;
    
    const loadingToast = toast.loading('Eliminando instructor...');
    
    try {
      await api.delete(`/users/employees/${teacherToDelete.id}`);
      toast.success('Instructor dado de baja', { id: loadingToast });
      fetchTeachers(); 
      setShowDeleteModal(false); 
      setTeacherToDelete(null);
    } catch (error: any) {
      toast.error(getErrorMessage(error), { id: loadingToast, duration: 5000 });
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
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
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Plantilla de Instructores</h2>
          <p className="text-slate-400 mt-1">Administra a los profesionales que imparten las clases en la piscina.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-cyan-900/50 hover:bg-cyan-500 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Instructor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachers.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-700 text-center">
            <div className="text-4xl mb-3">🛟</div>
            <h3 className="text-lg font-bold text-white">No hay instructores registrados</h3>
            <p className="text-slate-400 font-medium mt-1">Añade a tu equipo de trabajo para poder asignarles clases.</p>
          </div>
        ) : (
          teachers.map((teacher: any) => (
            <div key={teacher.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between group">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm rotate-3 group-hover:rotate-0 transition-all">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{teacher.name}</h3>
                    <p className="text-sm text-cyan-400 font-medium mb-1">Instructor</p>
                    <p className="text-xs text-slate-400">✉️ {teacher.email}</p>
                  </div>
                </div>

                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                      onClick={() => openEditModal(teacher)} 
                      className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-slate-800 md:bg-transparent text-slate-400 md:text-slate-500 hover:text-cyan-400 hover:bg-slate-700 md:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar"
                  >
                      ✏️
                  </button>
                  <button 
                      onClick={() => confirmDelete(teacher.id, teacher.name)} 
                      className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 bg-slate-800 md:bg-transparent text-slate-400 md:text-slate-500 hover:text-red-400 hover:bg-slate-700 md:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar"
                  >
                      ✖
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                <Link 
                  href={`/dashboard/teachers/${teacher.id}`}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors border border-slate-700 text-center"
                >
                  Ver Horario
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear/Editar Instructor */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-800">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-extrabold text-white">
                {modalMode === 'create' ? 'Alta de Instructor' : 'Editar Instructor'}
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
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Nombre Completo</label>
                <input 
                  type="text" placeholder="Ej. Carlos Restrepo" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" placeholder="carlos@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Teléfono Móvil</label>
                <input 
                  type="tel" placeholder="Ej. 300 987 6543" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none" required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 px-4 py-3.5 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 shadow-md transition-all">
                  {modalMode === 'create' ? 'Registrar Instructor' : 'Guardar Cambios'}
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
              ¿Dar de baja a {teacherToDelete?.name}?
            </h3>
            <p className="text-slate-400 mb-6 text-sm">
              Esta acción no se puede deshacer. Se eliminará su acceso al sistema.
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
                Sí, dar de baja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}