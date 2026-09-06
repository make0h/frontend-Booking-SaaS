'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

// Reutilizamos el widget del calendario
const CalendarWidget = dynamic(() => import('../../dashboard/CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[40vh] flex flex-col items-center justify-center text-slate-500">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      Cargando horario del alumno...
    </div>
  )
});

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [customer, setCustomer] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const response = await api.get(`/portal/${token}`);
        const fetchedCustomer = response.data.customer;
        const fetchedAppointments = response.data.appointments;

        setCustomer(fetchedCustomer);
        setAppointments(fetchedAppointments);

        // ✨ REVISIÓN AL CARGAR: Verificamos si hay una clase hoy sin confirmar (Estado 0 o 'Pending')
        const todayStr = new Date().toDateString();
        const pendingTodayAppointment = fetchedAppointments.find((apt: any) => {
          const aptDate = new Date(apt.startTime);
          const isToday = aptDate.toDateString() === todayStr;
          const isPending = apt.status === 0 || apt.status === 'Pending';
          return isToday && isPending;
        });

        if (pendingTodayAppointment) {
          // Lanzamos un toast grande y llamativo que se queda en pantalla
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span>🚨</span> ¡Atención! Tienes una clase hoy
                </div>
                <p className="text-xs text-slate-300">
                  Hay una clase programada para hoy que aún no ha sido confirmada. ¡Revisa tu horario!
                </p>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Opcionalmente abrimos el detalle de esa cita de inmediato
                    setSelectedAppointment({
                      ...pendingTodayAppointment,
                      startObj: new Date(pendingTodayAppointment.startTime),
                      endObj: new Date(new Date(pendingTodayAppointment.startTime).getTime() + (pendingTodayAppointment.durationMinutes * 60 * 1000))
                    });
                    setShowModal(true);
                  }}
                  className="mt-1 py-1.5 px-3 bg-amber-500 text-slate-950 font-extrabold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                >
                  Ver y Confirmar Ahora
                </button>
              </div>
            ),
            {
              duration: 8000,
              position: 'top-center',
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #f59e0b',
                padding: '16px',
                borderRadius: '16px',
              },
            }
          );
        }

      } catch (err: any) {
        setError('Enlace inválido. Verifica que hayas copiado el link correctamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [token]);

  const handleConfirmClass = async () => {
    if (!selectedAppointment) return;
    
    const loadingToast = toast.loading('Confirmando asistencia...');
    try {
      // 1. Confirmamos la clase en el backend
      await api.put(`/portal/${token}/appointments/${selectedAppointment.id}/confirm`);
      setShowModal(false);
      
      // 2. Recargamos los datos silenciosamente
      const response = await api.get(`/portal/${token}`);
      const updatedCustomer = response.data.customer;
      
      setCustomer(updatedCustomer);
      setAppointments(response.data.appointments);

      // ✨ 3. LIMPIEZA TOTAL: Borramos el toast de carga antes de mostrar el resultado
      toast.dismiss(loadingToast);

      // 4. Mostramos una sola notificación clara según los créditos restantes
      const creditosRestantes = updatedCustomer.credits;
      
      if (creditosRestantes > 1) {
        toast.success(`¡Asistencia confirmada! Tienes ${creditosRestantes} clases disponibles.`, { 
          duration: 4000 
        });
      } else if (creditosRestantes === 1) {
        toast('¡Asistencia confirmada! ⚠️ ATENCIÓN: Solo te queda 1 clase.', { 
          duration: 5000, 
          icon: '⚠️',
          style: { background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B' }
        });
      } else {
        toast('¡Asistencia confirmada! ❌ Has agotado tus clases. Recuerda recargar.', { 
          duration: 6000, 
          icon: '🛑',
          style: { background: '#1E293B', color: '#EF4444', border: '1px solid #EF4444' }
        });
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data || 'Error al confirmar la clase');
    }
  };

  const handleCancelClass = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta clase? Recuperarás tu crédito si lo haces con más de 8 horas de anticipación.')) return;
    
    const loadingToast = toast.loading('Procesando cancelación...');
    try {
      const res = await api.put(`/portal/${token}/appointments/${selectedAppointment.id}/cancel`);
      toast.success(res.data.message || 'Clase cancelada exitosamente', { id: loadingToast, duration: 5000 });
      setShowModal(false);
      
      const response = await api.get(`/portal/${token}`);
      setCustomer(response.data.customer);
      setAppointments(response.data.appointments);
    } catch (err: any) {
      toast.error(err.response?.data || 'Error al cancelar la clase', { 
        id: loadingToast, 
        duration: 6000,
        icon: '⚠️'
      });
    }
  };

  const handleSimulatePayment = () => {
    toast('Redirigiendo a pasarela de pagos (Wompi/MercadoPago)...', {
      icon: '💳',
      style: { borderRadius: '10px', background: '#1E293B', color: '#fff' }
    });
  };

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps;
    setSelectedAppointment({
      ...apt,
      startObj: info.event.start,
      endObj: info.event.end
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-md w-full shadow-2xl">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const endDate = new Date(startDate.getTime() + (apt.durationMinutes * 60 * 1000)); 

    let color = '#0891B2'; // Cyan: Pendiente
    if (apt.status === 1 || apt.status === 'Confirmed') color = '#F59E0B'; // Ámbar: Confirmada
    if (apt.status === 2 || apt.status === 'Completed') color = '#10B981'; // Verde: Completada
    if (apt.status === 3 || apt.status === 'Cancelled') color = '#EF4444'; // Rojo: Cancelada

    return {
      id: apt.id.toString(),
      title: apt.serviceName,
      start: startDate,
      end: endDate,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { ...apt }
    };
  });

  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-10 selection:bg-indigo-500/30">
      <Toaster position="top-center" />
      
      <header className="bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Portal de Alumno</p>
              <h1 className="text-lg font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">{customer.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6 px-4 space-y-6">
        
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          {customer.credits <= 1 && (
             <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Clases Disponibles</h2>
              <div className="flex items-end gap-2">
                <span className={`text-5xl font-black ${customer.credits > 1 ? 'text-white' : 'text-red-400 animate-pulse'}`}>
                  {customer.credits}
                </span>
                <span className="text-slate-500 font-medium mb-1.5">clases</span>
              </div>
              {customer.credits === 1 && <p className="text-xs font-bold text-red-400 mt-2">⚠️ ¡Solo te queda 1 clase! Recuerda recargar pronto.</p>}
              {customer.credits <= 0 && <p className="text-xs font-bold text-red-400 mt-2">❌ Se agotaron tus clases. Recarga para seguir agendando.</p>}
            </div>
            
            <button 
              onClick={handleSimulatePayment}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>💳</span> Comprar más clases
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl">
          <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="text-xl font-bold text-white">Horario de Clases</h3>
            <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#0891B2] rounded-full"></span> Pendiente</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full"></span> Confirmada</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#10B981] rounded-full"></span> Completada</span>
            </div>
          </div>
          <CalendarWidget events={calendarEvents} onEventClick={handleEventClick} />
        </div>
      </main>

      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
               <h3 className="text-lg font-extrabold text-white truncate pr-4">Detalle de Clase</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white font-bold text-2xl">&times;</button>
             </div>
             
             <div className="p-6">
                
                <h4 className="text-xl font-bold text-white mb-4">{selectedAppointment.serviceName}</h4>
                
                <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 space-y-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">📅 Fecha de la Clase</p>
                    <p className="text-sm font-medium text-slate-300 capitalize">{formatDate(selectedAppointment.startObj)}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Inicio</p>
                      <p className="text-sm font-bold text-indigo-400">{formatTime(selectedAppointment.startObj)}</p>
                    </div>
                    <div className="text-slate-600">→</div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Fin</p>
                      <p className="text-sm font-bold text-indigo-400">{formatTime(selectedAppointment.endObj)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending') && (
                    <button 
                      onClick={handleConfirmClass}
                      className="w-full px-4 py-3.5 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-900/30 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Confirmar Asistencia
                    </button>
                  )}

                  {(selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <div className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-xl text-center text-sm">
                      ✅ Asistencia Confirmada
                    </div>
                  )}
                  
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending' || 
                    selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <button 
                      onClick={handleCancelClass}
                      className="w-full px-4 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                      <span className="text-lg leading-none">✖</span> Cancelar Clase
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