'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast'; // Importamos la magia

const CalendarWidget = dynamic(() => import('./CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500 font-medium">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-600 mb-4"></div>
      Cargando agenda interactiva...
    </div>
  )
});

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Estados para el Modal de Crear (Paquete / Individual)
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [formError, setFormError] = useState('');

  // Buscador de Alumnos
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carrito de Fechas
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [tempDate, setTempDate] = useState('');

  // Estados para Editar
  const [editDate, setEditDate] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  
  const router = useRouter();

  // FILTRO INTELIGENTE DE ERRORES
  const getErrorMessage = (err: any) => {
    const data = err.response?.data;
    if (typeof data === 'string' && !data.includes('<html')) return data;
    return 'Ocurrió un error inesperado al conectar con el servidor.';
  };

  const fetchData = async () => {
    try {
      const [aptRes, teachRes, servRes, custRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/users/employees'),
        api.get('/services'),
        api.get('/users/customers')
      ]);
      setAppointments(aptRes.data);
      setTeachers(teachRes.data);
      setServices(servRes.data);
      setCustomers(custRes.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Cierra el buscador si haces clic fuera de él
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  useEffect(() => {
    if (selectedAppointment) {
      setEditTeacher(selectedAppointment.employeeId?.toString() || '');
      const date = new Date(selectedAppointment.startTime);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      setEditDate(localISOTime);
    }
  }, [selectedAppointment]);

  // Lógica del Buscador de Alumnos
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectCustomerFromSearch = (id: number, name: string) => {
    setSelectedCustomer(id.toString());
    setSearchTerm(name);
    setShowDropdown(false);
  };

  // Lógica del Carrito de Fechas
  const addDateToCart = () => {
    if (!tempDate) return setFormError("Selecciona una fecha y hora");
    const selectedDateObj = new Date(tempDate);
    if (selectedDateObj < new Date()) return setFormError("No puedes agendar clases en el pasado");
    if (selectedDates.includes(tempDate)) return setFormError("Esa fecha ya está en la lista");
    
    setFormError('');
    setSelectedDates([...selectedDates, tempDate].sort());
    setTempDate('');
  };

  const removeDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); 

    if (!selectedCustomer) return setFormError('Debes buscar y seleccionar un alumno');
    if (selectedDates.length === 0) return setFormError('Añade al menos una fecha a la lista');

    const loadingToast = toast.loading(`Agendando ${selectedDates.length} clase(s)...`);

    try {
      // Llamamos al nuevo endpoint "bulk"
      await api.post('/appointments/bulk', {
        businessId: 1,
        customerId: parseInt(selectedCustomer),
        serviceId: parseInt(selectedService),
        employeeId: parseInt(selectedTeacher),
        startTimes: selectedDates
      });
      
      toast.success('¡Clases agendadas con éxito!', { id: loadingToast });
      
      // Limpiamos el modal
      setShowCreateModal(false);
      setSelectedDates([]);
      setTempDate('');
      setSelectedTeacher('');
      setSelectedService('');
      setSelectedCustomer('');
      setSearchTerm('');
      
      fetchData(); 
    } catch (error: any) {
      setFormError(getErrorMessage(error));
      toast.error('Hubo un problema al agendar', { id: loadingToast });
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Guardando cambios...');
    try {
      await api.put(`/appointments/${selectedAppointment.id}`, {
        id: selectedAppointment.id,
        businessId: selectedAppointment.businessId,
        customerId: selectedAppointment.customerId,
        serviceId: selectedAppointment.serviceId,
        employeeId: parseInt(editTeacher),
        startTime: editDate,
        status: selectedAppointment.status
      });
      toast.success('Clase actualizada', { id: loadingToast });
      setShowEditModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(getErrorMessage(error), { id: loadingToast, duration: 5000 });
    }
  };

  const handleCancelAppointment = async () => {
    if (window.confirm('¿Estás totalmente seguro de cancelar esta clase? Esta acción notificará al sistema.')) {
      const loadingToast = toast.loading('Cancelando clase...');
      try {
        const response = await api.put(`/appointments/${selectedAppointment.id}/cancel`);
        toast.success(response.data || 'Clase cancelada correctamente', { id: loadingToast, duration: 5000 });
        setShowEditModal(false);
        fetchData();
      } catch (error: any) {
        toast.error(getErrorMessage(error), { id: loadingToast, duration: 5000 });
      }
    }
  };

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps;
    setSelectedAppointment(apt);
    setShowEditModal(true); 
  };

  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const service = services.find(s => s.id === apt.serviceId);
    const duration = service ? service.durationMinutes : 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000); 

    const teacher = teachers.find(t => t.id === apt.employeeId)?.name || 'Profe';
    const customer = customers.find(c => c.id === apt.customerId)?.name || 'Alumno';

    let color = '#0891B2'; // Cyan (Pendiente)
    if (apt.status === 2 || apt.status === 'Cancelled') color = '#EF4444'; // Rojo (Cancelada)
    if (apt.status === 1 || apt.status === 'Completed') color = '#10B981'; // Verde (Completada)

    return {
      id: apt.id.toString(),
      title: `${service?.name || 'Clase'} - ${customer} (${teacher})`,
      start: startDate,
      end: endDate,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { ...apt, customerName: customer, teacherName: teacher, serviceName: service?.name }
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const classesToday = appointments.filter((a: any) => new Date(a.startTime).toDateString() === new Date().toDateString());

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      <div className="w-full lg:w-3/4 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Centro de Control</h2>
            <p className="text-slate-400 mt-1">Gestiona las clases, asigna profesores y revisa horarios.</p>
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 flex-grow">
          <CalendarWidget events={calendarEvents} onEventClick={handleEventClick} />
        </div>
      </div>

      <div className="w-full lg:w-1/4 flex flex-col gap-6 pt-2">
        <button 
          onClick={() => { setFormError(''); setShowCreateModal(true); }}
          className="w-full bg-cyan-600 text-white font-bold text-lg px-6 py-4 rounded-2xl shadow-lg shadow-cyan-900/50 hover:bg-cyan-500 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span> Agendar Clase
        </button>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resumen del Día</h3>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Clases programadas</span>
            <span className="bg-cyan-500/20 text-cyan-400 font-bold py-1 px-3 rounded-full border border-cyan-500/30">{classesToday.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 flex-grow">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Profesores Activos</h3>
          <div className="space-y-3">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500">Disponible</p>
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-sm text-slate-500 italic">No hay profesores registrados.</p>}
          </div>
        </div>
      </div>

      {/* MODAL 1: AGENDAR CLASE (CON BUSCADOR Y CARRITO DE FECHAS) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-white">Agendar Clases</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-300 font-bold text-xl">&times;</button>
            </div>
            
            {formError && (
              <div className="mx-6 mt-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-md">
                <p className="text-sm text-red-400 font-medium">{formError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-5">
              
              {/* BUSCADOR DE ALUMNO */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Buscar Alumno</label>
                <input 
                  type="text" 
                  placeholder="Escribe el nombre..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCustomer(''); 
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none" 
                />
                
                {showDropdown && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => selectCustomerFromSearch(c.id, c.name)}
                          className="p-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-700/50 last:border-0"
                        >
                          <span className="text-white text-sm font-medium">{c.name}</span>
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-md">
                            {c.monthlyCredits || 0} Créditos
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-slate-400 text-sm text-center">No se encontraron alumnos</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Servicio / Nivel</label>
                  <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white outline-none" required>
                    <option value="" disabled>Seleccionar...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Instructor</label>
                  <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white outline-none" required>
                    <option value="" disabled>Seleccionar...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              
              {/* CARRITO DE FECHAS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="block text-sm font-semibold text-cyan-400 mb-2">Añadir Fechas al Paquete</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="datetime-local" 
                    value={tempDate} 
                    onChange={(e) => setTempDate(e.target.value)} 
                    className="flex-1 border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={addDateToCart}
                    className="bg-slate-700 text-white font-bold px-4 rounded-xl hover:bg-cyan-600 transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {selectedDates.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-2 italic">Añade fechas para armar el horario del alumno.</p>
                  ) : (
                    selectedDates.map((date, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-slate-200 text-sm">
                          {new Date(date).toLocaleString('es-CO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button type="button" onClick={() => removeDate(date)} className="text-red-400 hover:text-red-300 px-2 font-bold">
                          ✖
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800">Cancelar</button>
                <button type="submit" disabled={selectedDates.length === 0} className="flex-1 px-4 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  Agendar {selectedDates.length} Clase(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETALLES Y EDICIÓN DE CLASE */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-start bg-slate-900">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className={`w-3 h-3 rounded-full ${selectedAppointment.status === 2 || selectedAppointment.status === 'Cancelled' ? 'bg-red-500' : 'bg-cyan-500'}`}></span>
                   <h3 className="text-lg font-bold text-white">{selectedAppointment.serviceName}</h3>
                 </div>
                 <p className="text-sm text-slate-400 font-medium">Alumno: {selectedAppointment.customerName}</p>
               </div>
               <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-300 font-bold text-xl">&times;</button>
             </div>
             
             <form onSubmit={handleUpdateAppointment} className="p-6 space-y-4">
                
                {(selectedAppointment.status === 2 || selectedAppointment.status === 'Cancelled') && (
                  <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-4 text-center">
                    <p className="text-sm font-semibold text-red-400">Esta clase se encuentra cancelada.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Reasignar Profesor</label>
                  <select 
                    value={editTeacher} 
                    onChange={(e) => setEditTeacher(e.target.value)} 
                    disabled={selectedAppointment.status === 2 || selectedAppointment.status === 'Cancelled'}
                    className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white disabled:opacity-50 outline-none"
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Reagendar (Fecha y Hora)</label>
                  <input 
                    type="datetime-local" 
                    value={editDate} 
                    onChange={(e) => setEditDate(e.target.value)} 
                    disabled={selectedAppointment.status === 2 || selectedAppointment.status === 'Cancelled'}
                    className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white disabled:opacity-50 outline-none" 
                  />
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  {(selectedAppointment.status !== 2 && selectedAppointment.status !== 'Cancelled') && (
                    <button type="submit" className="w-full px-4 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-md transition-colors">
                      Guardar Cambios
                    </button>
                  )}
                  
                  {(selectedAppointment.status !== 2 && selectedAppointment.status !== 'Cancelled') ? (
                    <button type="button" onClick={handleCancelAppointment} className="w-full px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold rounded-xl hover:bg-red-500/20 transition-colors">
                      Cancelar Clase Definitivamente
                    </button>
                  ) : (
                     <button type="button" onClick={() => setShowEditModal(false)} className="w-full px-4 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800">
                      Cerrar
                    </button>
                  )}
                </div>
             </form>

           </div>
        </div>
      )}

    </div>
  );
}