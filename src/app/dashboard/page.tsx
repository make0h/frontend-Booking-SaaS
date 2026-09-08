'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast'; 

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

  // ✨ NUEVO CARRITO: Ahora usa objetos con ID para permitir horas duplicadas (Hermanos)
  const [selectedDates, setSelectedDates] = useState<{id: string, value: string}[]>([]);
  const [tempDateOnly, setTempDateOnly] = useState('');
  const [tempTimeOnly, setTempTimeOnly] = useState('');

  const [bookingMode, setBookingMode] = useState<'single' | 'package'>('single');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  // ✨ NUEVO: Selector de días de la semana para paquetes (0=Dom, 1=Lun, 2=Mar...)
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

  // Toggle para seleccionar días de la semana
  const toggleWeekDay = (dayIndex: number) => {
    if (selectedWeekDays.includes(dayIndex)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== dayIndex));
    } else {
      setSelectedWeekDays([...selectedWeekDays, dayIndex]);
    }
  };

  const addDateToCart = () => {
    if (!tempDateOnly || !tempTimeOnly) return setFormError("Ingresa la fecha y la hora exacta");
    // Creamos la fecha local y la pasamos a formato universal seguro
    const localDate = new Date(`${tempDateOnly}T${tempTimeOnly}:00`);
    const dateTimeString = localDate.toISOString();
    const selectedDateObj = new Date(dateTimeString);
    if (selectedDateObj < new Date()) return setFormError("No puedes agendar clases en el pasado");
    
    setFormError('');
    // Al generar un ID único, permitimos meter la misma fecha dos veces (para hermanos)
    setSelectedDates([...selectedDates, { id: Math.random().toString(), value: dateTimeString }]);
    setTempTimeOnly('');
  };

  // ✨ EL NUEVO GENERADOR INTELIGENTE (100% Flexible)
  const generatePackageDates = () => {
    if (!tempDateOnly || !tempTimeOnly) return setFormError("Ingresa la fecha inicial y la hora");
    if (!selectedPackageId) return setFormError("Selecciona un paquete primero");
    if (selectedWeekDays.length === 0) return setFormError("Selecciona al menos un día de la semana (Ej: Martes y Jueves)");

    const pkg = packages.find(p => p.id.toString() === selectedPackageId);
    if (!pkg) return setFormError("Paquete inválido");

    let currentDate = new Date(`${tempDateOnly}T00:00:00`); // Solo fecha inicial para empezar a contar
    if (currentDate < new Date(new Date().setHours(0,0,0,0))) return setFormError("La fecha de inicio no puede estar en el pasado");

    const newDates: {id: string, value: string}[] = [];
    let classesAdded = 0;
    let safetyLoop = 0; // Previene bucles infinitos

    while (classesAdded < pkg.classCount && safetyLoop < 365) {
      const currentDayOfWeek = currentDate.getDay(); // 0 es Domingo, 1 es Lunes...
      
      // Si el día actual coincide con uno de los días seleccionados
      if (selectedWeekDays.includes(currentDayOfWeek)) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        
        const localDate = new Date(`${yyyy}-${mm}-${dd}T${tempTimeOnly}:00`);

        newDates.push({
          id: Math.random().toString(),
          value: localDate.toISOString()
        });
        classesAdded++;
      }
      // Avanzamos un día exacto
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
        // Extraemos solo el string de las fechas para enviarlo al backend
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
    // El navegador lee el UTC que manda Postgres y lo pasa a hora de Colombia solito
    const startDate = new Date(apt.startTime);
    const service = services.find(s => s.id === apt.serviceId);
    const duration = service ? service.durationMinutes : 60;
    
    // Si Postgres manda endTime lo usamos, si no, lo calculamos
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
      start: startDate, // 👈 Se pasa el objeto Date directamente
      end: endDate,     // 👈 Se pasa el objeto Date directamente
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

  const canEdit = selectedAppointment && (
    selectedAppointment.status === 0 || selectedAppointment.status === 'Pending' ||
    selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed'
  );

  const DAYS_OF_WEEK = [
    { label: 'Lu', value: 1 }, { label: 'Ma', value: 2 }, { label: 'Mi', value: 3 },
    { label: 'Ju', value: 4 }, { label: 'Vi', value: 5 }, { label: 'Sa', value: 6 }, { label: 'Do', value: 0 }
  ];

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
          <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-400 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0891B2] rounded-full"></span> PENDIENTE</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#F59E0B] rounded-full"></span> CONFIRMADA</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#10B981] rounded-full"></span> IMPARTIDA</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#EF4444] rounded-full"></span> CANCELADA</span>
          </div>
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

      {/* ============================================== */}
      {/* MODAL PRINCIPAL DE AGENDAMIENTO                */}
      {/* ============================================== */}
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
              
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Buscar Alumno (o Familia)</label>
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
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes}m)</option>)}
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

              {/* SELECTOR DE MODO DE AGENDAMIENTO */}
              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mt-2">
                <button 
                  type="button" 
                  onClick={() => setBookingMode('single')} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${bookingMode === 'single' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Clases Sueltas
                </button>
                <button 
                  type="button" 
                  onClick={() => setBookingMode('package')} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${bookingMode === 'package' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Paquete Mensual
                </button>
              </div>

              {/* MODO PAQUETE */}
              {bookingMode === 'package' && (
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">1. Selecciona el Paquete</label>
                  <select 
                    value={selectedPackageId} 
                    onChange={(e) => setSelectedPackageId(e.target.value)} 
                    className="w-full border border-emerald-800/50 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 bg-slate-900 text-white outline-none mb-4"
                  >
                    <option value="">-- Elige un Paquete --</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.classCount} clases)</option>
                    ))}
                  </select>

                  <label className="block text-sm font-semibold text-emerald-400 mb-2">2. Días de la semana (Ej. 2 veces por semana)</label>
                  <div className="flex gap-1.5 mb-2 justify-between">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekDay(day.value)}
                        className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                          selectedWeekDays.includes(day.value) ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">El sistema buscará estos días automáticamente a partir de la fecha de inicio.</p>
                </div>
              )}
              
              {/* CARRITO DE FECHAS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="block text-sm font-semibold text-cyan-400 mb-2">
                  {bookingMode === 'single' ? 'Añadir Fecha y Hora al Carrito' : '3. Fecha de Inicio y Hora'}
                </label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="date" 
                    value={tempDateOnly} 
                    onChange={(e) => setTempDateOnly(e.target.value)} 
                    className="w-[45%] border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white outline-none [color-scheme:dark]"
                  />
                  <input 
                    type="time" 
                    value={tempTimeOnly} 
                    onChange={(e) => setTempTimeOnly(e.target.value)} 
                    className="w-[35%] border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white outline-none [color-scheme:dark]"
                  />
                  
                  {bookingMode === 'single' ? (
                    <button type="button" onClick={addDateToCart} className="w-[20%] bg-slate-700 text-white font-bold px-3 rounded-xl hover:bg-cyan-600 transition-colors text-sm">
                      Añadir
                    </button>
                  ) : (
                    <button type="button" onClick={generatePackageDates} className="w-[20%] bg-emerald-600 text-white font-bold px-3 rounded-xl hover:bg-emerald-500 transition-colors text-xs text-center leading-tight shadow-md">
                      Generar
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {selectedDates.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-2 italic">El carrito de clases está vacío. (Puedes añadir la misma hora 2 veces para hermanos).</p>
                  ) : (
                    selectedDates.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-slate-200 text-sm">
                          {new Date(item.value).toLocaleString('es-CO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button type="button" onClick={() => removeDate(item.id)} className="text-red-400 hover:text-red-300 px-2 font-bold">✖</button>
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

      {/* MODAL DE EDICIÓN */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-start bg-slate-900">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className={`w-3 h-3 rounded-full ${
                      (selectedAppointment.status === 3 || selectedAppointment.status === 'Cancelled') ? 'bg-red-500' : 
                      (selectedAppointment.status === 2 || selectedAppointment.status === 'Completed') ? 'bg-emerald-500' :
                      (selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') ? 'bg-amber-500' : 'bg-cyan-500'
                   }`}></span>
                   <h3 className="text-lg font-bold text-white">{selectedAppointment.serviceName}</h3>
                 </div>
                 <p className="text-sm text-slate-400 font-medium">Alumno: {selectedAppointment.customerName}</p>
               </div>
               <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-300 font-bold text-xl">&times;</button>
             </div>
             
             <form onSubmit={handleUpdateAppointment} className="p-6 space-y-4">
               
               {(selectedAppointment.status === 3 || selectedAppointment.status === 'Cancelled') && (
                 <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-4 text-center">
                   <p className="text-sm font-semibold text-red-400">Esta clase se encuentra cancelada.</p>
                 </div>
               )}

               {(selectedAppointment.status === 2 || selectedAppointment.status === 'Completed') && (
                 <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mb-4 text-center">
                   <p className="text-sm font-semibold text-emerald-400">Esta clase ya fue impartida y pagada al instructor.</p>
                 </div>
               )}

               <div>
                 <label className="block text-sm font-semibold text-slate-300 mb-1">Reasignar Profesor</label>
                 <select 
                   value={editTeacher} 
                   onChange={(e) => setEditTeacher(e.target.value)} 
                   disabled={!canEdit}
                   className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white disabled:opacity-50 outline-none"
                 >
                   {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
               </div>
               
               <div className="flex gap-4">
                 <div className="w-1/2">
                   <label className="block text-sm font-semibold text-slate-300 mb-1">Fecha</label>
                   <input type="date" value={editDateOnly} onChange={(e) => setEditDateOnly(e.target.value)} disabled={!canEdit} className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white disabled:opacity-50 outline-none [color-scheme:dark]" />
                 </div>
                 <div className="w-1/2">
                   <label className="block text-sm font-semibold text-slate-300 mb-1">Hora</label>
                   <input type="time" value={editTimeOnly} onChange={(e) => setEditTimeOnly(e.target.value)} disabled={!canEdit} className="w-full border border-slate-700 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white disabled:opacity-50 outline-none [color-scheme:dark]" />
                 </div>
               </div>

               <div className="pt-6 flex flex-col gap-3">
                 {canEdit && (
                   <>
                     <button type="button" onClick={handleCompleteAppointment} className="w-full px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 shadow-md shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2">
                       ✅ Marcar clase como Impartida
                     </button>
                     <button type="submit" className="w-full px-4 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-500 shadow-md transition-colors">
                       Reagendar / Guardar Cambios
                     </button>
                     <button type="button" onClick={handleCancelAppointment} className="w-full px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold rounded-xl hover:bg-red-500/20 transition-colors">
                       🚫 Cancelar Clase Definitivamente
                     </button>
                   </>
                 )}
                 {!canEdit && (
                    <button type="button" onClick={() => setShowEditModal(false)} className="w-full px-4 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors">Cerrar ventana</button>
                 )}
                 <div className="border-t border-slate-800 mt-2 pt-4">
                   <button type="button" onClick={handleDeleteAppointment} className="w-full px-4 py-3 bg-red-900/30 text-red-500 border border-red-900/50 font-bold rounded-xl hover:bg-red-900/60 transition-colors flex items-center justify-center gap-2">
                     🗑️ Eliminar Error (Devuelve Crédito)
                   </button>
                 </div>
               </div>
             </form>
           </div>
        </div>
      )}

    </div>
  );
}