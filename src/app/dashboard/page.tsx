'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast'; 
import ClayButton from '@/components/ClayButton'; 
import { motion, AnimatePresence } from 'framer-motion';

const CalendarWidget = dynamic(() => import('./CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 font-bold bg-slate-900/50 rounded-3xl shadow-inner border border-slate-800">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-500 mb-4"></div>
      Cargando agenda interactiva...
    </div>
  )
});

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [formError, setFormError] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDates, setSelectedDates] = useState<{id: string, value: string}[]>([]);
  const [tempDateOnly, setTempDateOnly] = useState('');
  const [tempTimeOnly, setTempTimeOnly] = useState('');

  const [bookingMode, setBookingMode] = useState<'single' | 'package'>('single');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);

  const [editDateOnly, setEditDateOnly] = useState('');
  const [editTimeOnly, setEditTimeOnly] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  
  const router = useRouter();

  const getErrorMessage = (err: any) => {
    const data = err.response?.data;
    if (typeof data === 'string' && !data.includes('<html')) return data;
    return 'Ocurrió un error inesperado al conectar con el servidor.';
  };

  const fetchData = async () => {
    try {
      const [aptRes, teachRes, servRes, custRes, pkgRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/users/employees'),
        api.get('/services'),
        api.get('/users/customers'),
        api.get('/packages').catch(() => ({ data: [] }))
      ]);
      setAppointments(aptRes.data);
      setTeachers(teachRes.data);
      setServices(servRes.data);
      setCustomers(custRes.data);
      setPackages(pkgRes.data);
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
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  useEffect(() => {
    if (selectedAppointment) {
      setEditTeacher(selectedAppointment.employeeId?.toString() || '');
      const date = new Date(selectedAppointment.startTime);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditDateOnly(`${yyyy}-${mm}-${dd}`);
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      setEditTimeOnly(`${hh}:${min}`);
    }
  }, [selectedAppointment]);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectCustomerFromSearch = (id: number, name: string) => {
    setSelectedCustomer(id.toString());
    setSearchTerm(name);
    setShowDropdown(false);
  };

  const toggleWeekDay = (dayIndex: number) => {
    if (selectedWeekDays.includes(dayIndex)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== dayIndex));
    } else {
      setSelectedWeekDays([...selectedWeekDays, dayIndex]);
    }
  };

  const addDateToCart = () => {
    if (!tempDateOnly || !tempTimeOnly) return setFormError("Ingresa la fecha y la hora exacta");
    const localDate = new Date(`${tempDateOnly}T${tempTimeOnly}:00`);
    const dateTimeString = localDate.toISOString();
    const selectedDateObj = new Date(dateTimeString);
    if (selectedDateObj < new Date()) return setFormError("No puedes agendar clases en el pasado");
    
    setFormError('');
    setSelectedDates([...selectedDates, { id: Math.random().toString(), value: dateTimeString }]);
    setTempTimeOnly('');
  };

  const generatePackageDates = () => {
    if (!tempDateOnly || !tempTimeOnly) return setFormError("Ingresa la fecha inicial y la hora");
    if (!selectedPackageId) return setFormError("Selecciona un paquete primero");
    if (selectedWeekDays.length === 0) return setFormError("Selecciona al menos un día de la semana");

    const pkg = packages.find(p => p.id.toString() === selectedPackageId);
    if (!pkg) return setFormError("Paquete inválido");

    let currentDate = new Date(`${tempDateOnly}T00:00:00`); 
    if (currentDate < new Date(new Date().setHours(0,0,0,0))) return setFormError("La fecha de inicio no puede estar en el pasado");

    const newDates: {id: string, value: string}[] = [];
    let classesAdded = 0;
    let safetyLoop = 0; 

    while (classesAdded < pkg.classCount && safetyLoop < 365) {
      const currentDayOfWeek = currentDate.getDay(); 
      if (selectedWeekDays.includes(currentDayOfWeek)) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const localDate = new Date(`${yyyy}-${mm}-${dd}T${tempTimeOnly}:00`);
        newDates.push({ id: Math.random().toString(), value: localDate.toISOString() });
        classesAdded++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      safetyLoop++;
    }

    setFormError('');
    setSelectedDates([...selectedDates, ...newDates]);
    toast.success(`Se generaron ${newDates.length} fechas automáticamente.`);
  };

  const removeDate = (idToRemove: string) => {
    setSelectedDates(selectedDates.filter(d => d.id !== idToRemove));
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); 

    if (!selectedCustomer) return setFormError('Debes buscar y seleccionar un alumno');
    if (selectedDates.length === 0) return setFormError('Añade al menos una fecha a la lista');

    const loadingToast = toast.loading(`Agendando ${selectedDates.length} clase(s)...`);

    try {
      await api.post('/appointments/bulk', {
        businessId: 1,
        customerId: parseInt(selectedCustomer),
        serviceId: parseInt(selectedService),
        employeeId: parseInt(selectedTeacher),
        startTimes: selectedDates.map(d => d.value)
      });
      
      toast.success('¡Clases agendadas con éxito!', { id: loadingToast });
      setShowCreateModal(false);
      setSelectedDates([]);
      setTempDateOnly('');
      setTempTimeOnly('');
      setSelectedTeacher('');
      setSelectedService('');
      setSelectedCustomer('');
      setSearchTerm('');
      setBookingMode('single');
      setSelectedPackageId('');
      setSelectedWeekDays([]);
      fetchData(); 
    } catch (error: any) {
      setFormError(getErrorMessage(error));
      toast.error('Hubo un problema al agendar', { id: loadingToast });
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDateOnly || !editTimeOnly) return toast.error("Ingresa la fecha y la hora válida");
    const localDate = new Date(`${editDateOnly}T${editTimeOnly}:00`);
    const fullDateTime = localDate.toISOString();
    const loadingToast = toast.loading('Guardando cambios...');
    try {
      await api.put(`/appointments/${selectedAppointment.id}`, {
        id: selectedAppointment.id,
        businessId: selectedAppointment.businessId,
        customerId: selectedAppointment.customerId,
        serviceId: selectedAppointment.serviceId,
        employeeId: parseInt(editTeacher),
        startTime: fullDateTime,
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
    if (window.confirm('¿Estás totalmente seguro de cancelar esta clase? Esta acción notificará al sistema y devolverá el crédito.')) {
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

  const handleDeleteAppointment = async () => {
    if (window.confirm('🚨 ¿Seguro que deseas ELIMINAR esta clase del sistema? La clase desaparecerá y se le devolverá 1 crédito al alumno.')) {
      const loadingToast = toast.loading('Borrando clase y devolviendo crédito...');
      try {
        await api.delete(`/appointments/${selectedAppointment.id}`);
        toast.success('Clase eliminada con éxito', { id: loadingToast, duration: 5000 });
        setShowEditModal(false);
        fetchData(); 
      } catch (error: any) {
        toast.error(getErrorMessage(error), { id: loadingToast, duration: 5000 });
      }
    }
  };

  const handleCompleteAppointment = async () => {
    if (window.confirm('¿Confirmas que esta clase ya fue impartida? Se enviará a la nómina del instructor.')) {
      const loadingToast = toast.loading('Procesando clase...');
      try {
        await api.put(`/appointments/${selectedAppointment.id}/complete`);
        toast.success('Clase completada exitosamente', { id: loadingToast, duration: 5000 });
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
    const endDate = apt.endTime ? new Date(apt.endTime) : new Date(startDate.getTime() + (duration * 60 * 1000)); 
    const teacher = teachers.find(t => t.id === apt.employeeId)?.name || 'Profe';
    const customer = customers.find(c => c.id === apt.customerId)?.name || 'Alumno';

    let color = '#0891B2'; 
    if (apt.status === 1 || apt.status === 'Confirmed') color = '#F59E0B'; 
    if (apt.status === 3 || apt.status === 'Cancelled') color = '#EF4444'; 
    if (apt.status === 2 || apt.status === 'Completed') color = '#10B981'; 

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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
      </div>
    );
  }

  const classesToday = appointments.filter((a: any) => new Date(a.startTime).toDateString() === new Date().toDateString());

  const canEdit = selectedAppointment && (
    selectedAppointment.status === 0 || selectedAppointment.status === 'Pending' ||
    selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed'
  );

  const DAYS_OF_WEEK = [
    { label: 'Lu', value: 1 }, { label: 'Ma', value: 2 }, { label: 'Mi', value: 3 },
    { label: 'Ju', value: 4 }, { label: 'Vi', value: 5 }, { label: 'Sa', value: 6 }, { label: 'Do', value: 0 }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto pb-10">
      <div className="w-full lg:w-3/4 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Centro de Control</h2>
            <p className="text-slate-400 mt-2 font-medium text-lg">Gestiona las clases, asigna profesores y revisa horarios.</p>
          </div>
        </div>
        
        {/* WIDGET DEL CALENDARIO (3D) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800 p-6 rounded-[2rem] shadow-clay border-2 border-slate-700/50 flex-grow">
          <div className="flex flex-wrap gap-4 text-xs font-black text-slate-400 mb-6 bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
            <span className="flex items-center gap-2"><span className="w-4 h-4 bg-[#0891B2] rounded-full shadow-clay"></span> PENDIENTE</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 bg-[#F59E0B] rounded-full shadow-clay"></span> CONFIRMADA</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 bg-[#10B981] rounded-full shadow-clay"></span> IMPARTIDA</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 bg-[#EF4444] rounded-full shadow-clay"></span> CANCELADA</span>
          </div>
          <CalendarWidget events={calendarEvents} onEventClick={handleEventClick} />
        </motion.div>
      </div>

      <div className="w-full lg:w-1/4 flex flex-col gap-8 pt-2">
        <ClayButton 
          onClick={() => { setFormError(''); setShowCreateModal(true); }}
          colorClass="bg-cyan-500 text-white w-full"
          className="py-5 text-xl"
        >
          <span className="text-3xl leading-none">+</span> Agendar Clase
        </ClayButton>

        {/* TARJETA RESUMEN */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-800 p-6 rounded-[2.5rem] shadow-clay border-2 border-slate-700/50">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-5">Resumen del Día</h3>
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl shadow-inner border border-slate-700/30">
            <span className="text-slate-300 font-bold">Clases Hoy</span>
            <span className="bg-cyan-500 text-white shadow-clay font-black py-1.5 px-4 rounded-xl text-lg">{classesToday.length}</span>
          </div>
        </motion.div>

        {/* TARJETA PROFESORES */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800 p-6 rounded-[2.5rem] shadow-clay border-2 border-slate-700/50 flex-grow">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-5">Profesores</h3>
          <div className="space-y-4">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-2xl shadow-inner border border-slate-700/30">
                <div className="w-12 h-12 rounded-xl bg-slate-800 shadow-clay text-cyan-400 border border-slate-700 flex items-center justify-center font-black text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{t.name}</p>
                  <p className="text-xs text-cyan-400 font-bold">Activo</p>
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-sm font-bold text-slate-500 text-center">No hay profesores.</p>}
          </div>
        </motion.div>
      </div>

      {/* ============================================== */}
      {/* MODAL PRINCIPAL DE AGENDAMIENTO                */}
      {/* ============================================== */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between items-center z-10">
                <h3 className="text-2xl font-black text-white">Agendar Clases</h3>
                <button onClick={() => setShowCreateModal(false)} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-red-400 transition-colors flex items-center justify-center">&times;</button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-8 pt-4">
                {formError && (
                  <div className="mb-6 bg-red-900/40 border border-red-500/50 p-4 rounded-2xl shadow-inner">
                    <p className="text-sm text-red-400 font-bold text-center">{formError}</p>
                  </div>
                )}
                
                <form onSubmit={handleCreateAppointment} className="space-y-6">
                  
                  {/* BUSCADOR */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Buscar Alumno</label>
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
                      className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold placeholder-slate-600 rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                    />
                    
                    {showDropdown && searchTerm && (
                      <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-clay max-h-48 overflow-y-auto p-2">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => (
                            <div 
                              key={c.id} 
                              onClick={() => selectCustomerFromSearch(c.id, c.name)}
                              className="p-3 hover:bg-slate-700 rounded-xl cursor-pointer flex justify-between items-center transition-colors mb-1"
                            >
                              <span className="text-white text-sm font-bold">{c.name}</span>
                              <span className="text-xs font-black text-cyan-400 bg-slate-900 shadow-inner px-3 py-1.5 rounded-lg border border-slate-700">
                                {c.monthlyCredits || 0} Créditos
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-slate-400 text-sm font-bold text-center">No se encontraron alumnos</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Servicio / Nivel</label>
                      <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" required>
                        <option value="" disabled>Seleccionar...</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Instructor</label>
                      <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" required>
                        <option value="" disabled>Seleccionar...</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* SELECTOR DE MODO */}
                  <div className="flex bg-slate-900 shadow-inner p-2 rounded-[1.25rem] border border-slate-700/50">
                    <button 
                      type="button" 
                      onClick={() => setBookingMode('single')} 
                      className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${bookingMode === 'single' ? 'bg-cyan-500 text-white shadow-clay' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Clases Sueltas
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setBookingMode('package')} 
                      className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${bookingMode === 'package' ? 'bg-emerald-500 text-white shadow-clay' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Paquete Mensual
                    </button>
                  </div>

                  {/* MODO PAQUETE */}
                  <AnimatePresence>
                    {bookingMode === 'package' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900/60 shadow-inner border border-emerald-900/30 p-5 rounded-3xl overflow-hidden">
                        <label className="block text-sm font-black text-emerald-400 mb-3 pl-2">1. Selecciona el Paquete</label>
                        <select 
                          value={selectedPackageId} 
                          onChange={(e) => setSelectedPackageId(e.target.value)} 
                          className="w-full bg-slate-800 shadow-clay border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none mb-5"
                        >
                          <option value="">-- Elige un Paquete --</option>
                          {packages.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.classCount} clases)</option>
                          ))}
                        </select>

                        <label className="block text-sm font-black text-emerald-400 mb-3 pl-2">2. Días de la semana</label>
                        <div className="flex gap-2 justify-between bg-slate-800 p-2 rounded-2xl shadow-inner border border-slate-700/50">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleWeekDay(day.value)}
                              className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                                selectedWeekDays.includes(day.value) ? 'bg-emerald-500 text-white shadow-clay' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* CARRITO DE FECHAS */}
                  <div className="bg-slate-900/60 shadow-inner p-5 rounded-3xl border border-slate-700/30">
                    <label className="block text-sm font-black text-cyan-400 mb-3 pl-2">
                      {bookingMode === 'single' ? 'Añadir Fecha y Hora al Carrito' : '3. Fecha de Inicio y Hora'}
                    </label>
                    <div className="flex gap-3 mb-5">
                      <input 
                        type="date" 
                        value={tempDateOnly} 
                        onChange={(e) => setTempDateOnly(e.target.value)} 
                        className="w-[45%] bg-slate-800 shadow-clay border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none [color-scheme:dark]"
                      />
                      <input 
                        type="time" 
                        value={tempTimeOnly} 
                        onChange={(e) => setTempTimeOnly(e.target.value)} 
                        className="w-[35%] bg-slate-800 shadow-clay border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none [color-scheme:dark]"
                      />
                      
                      {bookingMode === 'single' ? (
                        <ClayButton type="button" onClick={addDateToCart} colorClass="bg-cyan-600 text-white" className="w-[20%] text-sm px-0">
                          Añadir
                        </ClayButton>
                      ) : (
                        <ClayButton type="button" onClick={generatePackageDates} colorClass="bg-emerald-600 text-white" className="w-[20%] text-xs px-0">
                          Generar
                        </ClayButton>
                      )}
                    </div>

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                      {selectedDates.length === 0 ? (
                        <p className="text-slate-500 text-sm font-bold text-center py-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
                          El carrito de clases está vacío.
                        </p>
                      ) : (
                        selectedDates.map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl shadow-clay border border-slate-700/50">
                            <span className="text-white font-bold text-sm">
                              {new Date(item.value).toLocaleString('es-CO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button type="button" onClick={() => removeDate(item.id)} className="bg-slate-700 w-8 h-8 rounded-full shadow-inner text-red-400 hover:text-red-300 font-bold flex items-center justify-center transition-colors">✖</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <ClayButton type="button" onClick={() => setShowCreateModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1">Cancelar</ClayButton>
                    <ClayButton type="submit" colorClass="bg-cyan-500 text-white w-full" className="flex-1">
                      Agendar {selectedDates.length} Clase(s)
                    </ClayButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDICIÓN */}
      <AnimatePresence>
        {showEditModal && selectedAppointment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-md overflow-hidden">
              
              <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-800">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-4 h-4 rounded-full shadow-clay ${
                       (selectedAppointment.status === 3 || selectedAppointment.status === 'Cancelled') ? 'bg-red-500' : 
                       (selectedAppointment.status === 2 || selectedAppointment.status === 'Completed') ? 'bg-emerald-500' :
                       (selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}></span>
                    <h3 className="text-2xl font-black text-white">{selectedAppointment.serviceName}</h3>
                  </div>
                  <p className="text-sm text-slate-400 font-bold bg-slate-900 shadow-inner px-3 py-1.5 rounded-xl inline-block border border-slate-700/50">
                    Alumno: {selectedAppointment.customerName}
                  </p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-red-400 transition-colors flex items-center justify-center">&times;</button>
              </div>
              
              <form onSubmit={handleUpdateAppointment} className="p-8 space-y-6">
                
                {(selectedAppointment.status === 3 || selectedAppointment.status === 'Cancelled') && (
                  <div className="bg-red-900/40 p-4 rounded-2xl shadow-inner border border-red-500/30 text-center">
                    <p className="text-sm font-black text-red-400">Esta clase se encuentra cancelada.</p>
                  </div>
                )}

                {(selectedAppointment.status === 2 || selectedAppointment.status === 'Completed') && (
                  <div className="bg-emerald-900/40 p-4 rounded-2xl shadow-inner border border-emerald-500/30 text-center">
                    <p className="text-sm font-black text-emerald-400">Esta clase ya fue impartida y pagada al instructor.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Reasignar Profesor</label>
                  <select 
                    value={editTeacher} 
                    onChange={(e) => setEditTeacher(e.target.value)} 
                    disabled={!canEdit}
                    className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-5">
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Fecha</label>
                    <input type="date" value={editDateOnly} onChange={(e) => setEditDateOnly(e.target.value)} disabled={!canEdit} className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50 [color-scheme:dark]" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-slate-300 mb-2 pl-2">Hora</label>
                    <input type="time" value={editTimeOnly} onChange={(e) => setEditTimeOnly(e.target.value)} disabled={!canEdit} className="w-full bg-slate-900 shadow-inner border border-slate-700 text-white font-bold rounded-2xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50 [color-scheme:dark]" />
                  </div>
                </div>

                <div className="pt-6 flex flex-col gap-4">
                  {canEdit && (
                    <>
                      <ClayButton type="button" onClick={handleCompleteAppointment} colorClass="bg-emerald-600 text-white w-full" className="py-4">
                        ✅ Marcar como Impartida
                      </ClayButton>
                      <ClayButton type="submit" colorClass="bg-cyan-500 text-white w-full" className="py-4">
                        Reagendar / Guardar
                      </ClayButton>
                      
                      {/* Botones secundarios (hundidos) */}
                      <button type="button" onClick={handleCancelAppointment} className="w-full px-4 py-4 bg-red-900/20 shadow-inner text-red-400 font-bold rounded-2xl border border-red-500/20 hover:bg-red-900/40 transition-colors">
                        🚫 Cancelar Clase Definitivamente
                      </button>
                    </>
                  )}
                  {!canEdit && (
                    <ClayButton type="button" onClick={() => setShowEditModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="py-4">Cerrar ventana</ClayButton>
                  )}
                  <div className="border-t-2 border-slate-700/50 mt-4 pt-6">
                    <button type="button" onClick={handleDeleteAppointment} className="w-full px-4 py-4 bg-red-900/40 shadow-inner text-red-500 font-black rounded-2xl border border-red-900 hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2">
                      🗑️ Eliminar Error (Devuelve Crédito)
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}