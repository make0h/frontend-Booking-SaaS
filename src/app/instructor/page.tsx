'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';

// Cargamos el nuevo calendario hermoso que acabamos de crear
const CalendarWidget = dynamic(() => import('../dashboard/CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500 font-medium">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-600 mb-4"></div>
      Cargando tu horario...
    </div>
  )
});

export default function InstructorPortalPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de detalles
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  const fetchMyData = async () => {
    try {
      const myUserId = localStorage.getItem('userId'); 

      const [aptRes, servRes, custRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/services'),
        api.get('/users/customers')
      ]);

      // FILTRO: Solo mis clases
      const myAppointments = aptRes.data.filter((a: any) => a.employeeId?.toString() === myUserId);
      
      setAppointments(myAppointments);
      setServices(servRes.data);
      setCustomers(custRes.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const handleCompleteClass = async () => {
    if (confirm('¿Confirmas que ya impartiste esta clase? Esto registrará tu pago.')) {
      try {
        await api.put(`/appointments/${selectedAppointment.id}/complete`);
        setShowModal(false);
        fetchMyData(); 
      } catch (error: any) {
        alert(error.response?.data || 'Error al completar la clase');
      }
    }
  };

  const handleEventClick = (info: any) => {
    // Info extendida que le pasamos al calendario
    const apt = info.event.extendedProps;
    setSelectedAppointment({
      ...apt,
      startObj: info.event.start,
      endObj: info.event.end
    });
    setShowModal(true); 
  };

  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const service = services.find(s => s.id === apt.serviceId);
    const duration = service ? service.durationMinutes : 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000); 

    const customer = customers.find(c => c.id === apt.customerId)?.name || 'Alumno Eliminado';

    let color = '#0891B2'; // Cyan (Pendiente)
    if (apt.status === 2 || apt.status === 'Cancelled') color = '#EF4444'; // Rojo (Cancelada)
    if (apt.status === 1 || apt.status === 'Completed') color = '#10B981'; // Verde (Completada)

    return {
      id: apt.id.toString(),
      title: `${service?.name || 'Clase'}`,
      start: startDate,
      end: endDate,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { 
        ...apt, 
        customerName: customer, 
        serviceName: service?.name || 'Clase General',
        durationMinutes: duration
      }
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const classesToday = appointments.filter((a: any) => new Date(a.startTime).toDateString() === new Date().toDateString());

  // Funciones de formateo para el modal
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20 md:pb-12 selection:bg-cyan-500/30">
      
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-cyan-500/20">
              B
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-white">Portal Instructor</h1>
              <p className="text-xs text-cyan-400 font-medium">Panel de Clases</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs md:text-sm bg-slate-800 border border-slate-700 hover:bg-red-500/90 hover:text-white transition-colors px-3 py-2 rounded-lg font-bold">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-6 px-4 md:px-6 flex flex-col lg:flex-row gap-6">
        
        {/* COLUMNA PRINCIPAL: Calendario */}
        <div className="w-full lg:w-3/4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Mi Horario</h2>
            <p className="text-sm text-slate-400 mt-1">Selecciona una clase para ver la información del alumno.</p>
          </div>
          <CalendarWidget events={calendarEvents} onEventClick={handleEventClick} />
        </div>

        {/* COLUMNA LATERAL: Resumen */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4">
          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 p-5 md:p-6 rounded-2xl shadow-xl border border-cyan-800/30">
            <h3 className="text-xs md:text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Clases de Hoy</h3>
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">{classesToday.length}</div>
            <p className="text-xs md:text-sm text-slate-300">Programadas para esta jornada</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 hidden md:block">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Estado de Clases</h3>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[#0891B2]"></span> Por impartir</div>
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Completada</div>
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Cancelada</div>
            </div>
          </div>
        </div>

      </main>

      {/* MODAL DE DETALLES DE CLASE (SOLO LECTURA) */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             {/* Cabecera del Modal */}
             <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
               <h3 className="text-lg font-extrabold text-white truncate pr-4">
                 {selectedAppointment.serviceName}
               </h3>
               <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 font-bold text-2xl leading-none">&times;</button>
             </div>
             
             <div className="p-6">
                
                {/* Etiqueta de Estado */}
                <div className="mb-6">
                  {(selectedAppointment.status === 2 || selectedAppointment.status === 'Cancelled') && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Clase Cancelada
                    </div>
                  )}
                  {(selectedAppointment.status === 1 || selectedAppointment.status === 'Completed') && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Clase Completada
                    </div>
                  )}
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending') && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Pendiente
                    </div>
                  )}
                </div>

                {/* Tarjeta de Información Detallada */}
                <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 space-y-4 mb-6">
                  
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">👤 Alumno Asignado</p>
                    <p className="text-base font-bold text-white">{selectedAppointment.customerName}</p>
                  </div>

                  <div className="h-px bg-slate-700/50 w-full"></div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">📅 Fecha de la Clase</p>
                    <p className="text-sm font-medium text-slate-300 capitalize">{formatDate(selectedAppointment.startObj)}</p>
                  </div>

                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Inicio</p>
                      <p className="text-sm font-bold text-cyan-400">{formatTime(selectedAppointment.startObj)}</p>
                    </div>
                    <div className="text-slate-600">→</div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Fin</p>
                      <p className="text-sm font-bold text-cyan-400">{formatTime(selectedAppointment.endObj)}</p>
                    </div>
                  </div>

                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-3">
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending') && (
                    <button 
                      onClick={handleCompleteClass}
                      className="w-full px-4 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/50 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Marcar como Completada
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="w-full px-4 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Cerrar Detalles
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}