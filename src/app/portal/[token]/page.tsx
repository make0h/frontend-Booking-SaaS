'use client';

import { useEffect, useState, use, useRef } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
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

  const shownTodayToastId = useRef<string | null>(null);

  const [customer, setCustomer] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // ✨ Estados para el catálogo
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  
  // ✨ Estados para la tienda y el checkout
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        // Cargamos el portal, los paquetes y los servicios en paralelo
        const [portalRes, pkgsRes, servsRes] = await Promise.all([
          api.get(`/portal/${token}`),
          api.get('/packages').catch(() => ({ data: [] })),
          api.get('/services').catch(() => ({ data: [] }))
        ]);

        const fetchedCustomer = portalRes.data.customer;
        const fetchedAppointments = portalRes.data.appointments;

        setCustomer(fetchedCustomer);
        setAppointments(fetchedAppointments);
        setAvailablePackages(pkgsRes.data);
        setAvailableServices(servsRes.data);

        // REVISIÓN DE CLASE HOY
        const todayStr = new Date().toDateString();
        const pendingTodayAppointments = fetchedAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.startTime);
          const isToday = aptDate.toDateString() === todayStr;
          const isPending = apt.status === 0 || apt.status === 'Pending';
          return isToday && isPending;
        });

        if (pendingTodayAppointments.length > 0) {
          const targetAppointment = pendingTodayAppointments[0];
          const uniqueToastId = `today-class-${targetAppointment.id}`;
          if (shownTodayToastId.current === uniqueToastId) return;

          shownTodayToastId.current = uniqueToastId;
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span>🚨</span> ¡Atención! Tienes una clase hoy
                </div>
                <p className="text-xs text-slate-300">Hay una clase programada para hoy que aún no ha sido confirmada. ¡Revisa tu horario!</p>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    setSelectedAppointment({
                      ...targetAppointment,
                      startObj: new Date(targetAppointment.startTime),
                      endObj: new Date(new Date(targetAppointment.startTime).getTime() + (targetAppointment.durationMinutes * 60 * 1000))
                    });
                    setShowModal(true);
                  }}
                  className="mt-1 py-1.5 px-3 bg-amber-500 text-slate-950 font-extrabold rounded-lg text-xs hover:bg-amber-400 transition-colors"
                >
                  Ver y Confirmar Ahora
                </button>
              </div>
            ),
            { id: uniqueToastId, duration: Infinity, position: 'top-center', style: { background: '#1e293b', color: '#fff', border: '1px solid #f59e0b', padding: '16px', borderRadius: '16px' } }
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
      await api.put(`/portal/${token}/appointments/${selectedAppointment.id}/confirm`);
      setShowModal(false);
      
      const response = await api.get(`/portal/${token}`);
      const updatedCustomer = response.data.customer;
      
      setCustomer(updatedCustomer);
      setAppointments(response.data.appointments);
      toast.dismiss(loadingToast);

      if (updatedCustomer.credits > 1) {
        toast.success(`¡Asistencia confirmada! Tienes ${updatedCustomer.credits} clases disponibles.`, { duration: 4000 });
      } else if (updatedCustomer.credits === 1) {
        toast('¡Asistencia confirmada! ⚠️ ATENCIÓN: Solo te queda 1 clase.', { duration: 5000, icon: '⚠️', style: { background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B' } });
      } else {
        toast('¡Asistencia confirmada! ❌ Has agotado tus clases. Recuerda recargar.', { duration: 6000, icon: '🛑', style: { background: '#1E293B', color: '#EF4444', border: '1px solid #EF4444' } });
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data || 'Error al confirmar la clase');
    }
  };

  const handleCancelClass = () => setShowCancelConfirmModal(true);

  const executeCancellation = async () => {
    setShowCancelConfirmModal(false);
    setShowModal(false); 
    const loadingToast = toast.loading('Procesando cancelación...');
    try {
      const res = await api.put(`/portal/${token}/appointments/${selectedAppointment.id}/cancel`);
      toast.dismiss(loadingToast);
      toast.success(res.data.message || 'Clase cancelada exitosamente', { duration: 5000 });
      const response = await api.get(`/portal/${token}`);
      setCustomer(response.data.customer);
      setAppointments(response.data.appointments);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data || 'Error al cancelar la clase', { duration: 6000, icon: '⚠️' });
    }
  };

  // ✨ LÓGICA DE TIENDA Y WHATSAPP LIMPIA (Sin clase de prueba)
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setShowStoreModal(false);
    setShowPaymentModal(true);
  };

  const openWhatsApp = () => {
    const phoneNumber = "573150663546"; // Tu número
    const priceFormatted = selectedProduct.price.toLocaleString('es-CO');
    const messageText = `¡Hola! 👋 Acabo de realizar el pago de *$${priceFormatted}* para adquirir: *${selectedProduct.name}* (Alumno: ${customer?.name}). Aquí te adjunto el comprobante:`;
    
    const message = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps;
    setSelectedAppointment({ ...apt, startObj: info.event.start, endObj: info.event.end });
    setShowModal(true);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  
  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-md w-full shadow-2xl">
          <div className="text-5xl mb-4">🔗</div><h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2><p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime.substring(0, 19));
    const endDate = new Date(apt.endTime ? apt.endTime.substring(0, 19) : startDate.getTime() + (apt.durationMinutes * 60 * 1000));
    let color = '#0891B2'; 
    if (apt.status === 1 || apt.status === 'Confirmed') color = '#F59E0B'; 
    if (apt.status === 2 || apt.status === 'Completed') color = '#10B981'; 
    if (apt.status === 3 || apt.status === 'Cancelled') color = '#EF4444'; 
    return { id: apt.id.toString(), title: apt.serviceName, start: startDate, end: endDate, backgroundColor: color, borderColor: color, extendedProps: { ...apt } };
  });

  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-10 selection:bg-indigo-500/30">
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
          {customer.credits <= 1 && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Clases Disponibles</h2>
              <div className="flex items-end gap-2">
                <span className={`text-5xl font-black ${customer.credits > 1 ? 'text-white' : 'text-red-400 animate-pulse'}`}>{customer.credits}</span>
                <span className="text-slate-500 font-medium mb-1.5">clases</span>
              </div>
              {customer.credits === 1 && <p className="text-xs font-bold text-red-400 mt-2">⚠️ ¡Solo te queda 1 clase! Recuerda recargar pronto.</p>}
              {customer.credits <= 0 && <p className="text-xs font-bold text-red-400 mt-2">❌ Se agotaron tus clases. Recarga para seguir agendando.</p>}
            </div>
            
            <button 
              onClick={() => setShowStoreModal(true)}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🛒</span> Tienda de Clases
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

      {/* ============================================================ */}
      {/* ✨ MODAL: TIENDA / CATÁLOGO                                  */}
      {/* ============================================================ */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-extrabold text-white">Adquirir Clases</h3>
                <p className="text-sm text-slate-400">Elige el plan que mejor se adapte a tus necesidades</p>
              </div>
              <button onClick={() => setShowStoreModal(false)} className="text-slate-500 hover:text-white font-bold text-3xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* PAQUETES MENSUALES */}
              {availablePackages.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">🌟 Paquetes Mensuales (Mejor Precio)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availablePackages.map(pkg => (
                      <div key={`pkg-${pkg.id}`} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-900/30 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                        <div>
                          <div className="inline-block bg-emerald-500/10 text-emerald-400 font-black text-[10px] px-2 py-1 rounded-md mb-2">
                            {pkg.classCount} CLASES
                          </div>
                          <h5 className="text-lg font-bold text-white mb-1">{pkg.name}</h5>
                          <p className="text-xs text-slate-400 mb-4">{pkg.description || 'Paquete completo de clases.'}</p>
                        </div>
                        <div className="mt-auto">
                          <p className="text-2xl font-black text-white mb-3">${pkg.totalPrice.toLocaleString('es-CO')}</p>
                          <button 
                            onClick={() => handleSelectProduct({ type: 'package', id: pkg.id, name: pkg.name, price: pkg.totalPrice, count: pkg.classCount })}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                          >
                            Comprar Paquete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLASES INDIVIDUALES */}
              {availableServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4">📘 Clases Individuales</h4>
                  <div className="space-y-3">
                    {availableServices.map(srv => (
                      <div key={`srv-${srv.id}`} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                        <div>
                          <h5 className="text-base font-bold text-white">{srv.name}</h5>
                          <p className="text-xs text-slate-400">Duración: {srv.durationMinutes} min</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className="text-lg font-black text-cyan-400">${srv.price.toLocaleString('es-CO')}</p>
                          <button 
                            onClick={() => handleSelectProduct({ type: 'service', id: srv.id, name: srv.name, price: srv.price, count: 1 })}
                            className="py-2 px-4 bg-slate-700 hover:bg-cyan-600 text-white font-bold rounded-xl transition-all"
                          >
                            Seleccionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CHECKOUT MANUAL                                     */}
      {/* ============================================================ */}
      {showPaymentModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-lg font-extrabold text-white truncate">Detalle de Pago</h3>
              <button onClick={() => { setShowPaymentModal(false); setShowStoreModal(true); }} className="text-slate-500 hover:text-white font-bold text-2xl">&times;</button>
            </div>
            
            <div className="p-6">
              
              <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl mb-6 text-center">
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Estás adquiriendo:</p>
                <p className="text-lg font-bold text-white">{selectedProduct.name}</p>
                <p className="text-3xl font-black text-emerald-400 mt-2">${selectedProduct.price.toLocaleString('es-CO')}</p>
              </div>

              <p className="text-sm text-slate-300 mb-4 text-center">
                Realiza la transferencia a una de nuestras cuentas y envíanos el comprobante. Tus créditos se activarán al instante.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700 flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#392061] rounded-xl flex items-center justify-center font-bold text-white shadow-md">N</div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nequi</p>
                    <p className="text-base font-black text-white">3150663546</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700 flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FDE213] rounded-xl flex items-center justify-center shadow-md"><span className="font-black text-black">B</span></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bancolombia Ahorros</p>
                    <p className="text-base font-black text-white">123-456789-00</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={openWhatsApp}
                  className="w-full px-4 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"></path></svg>
                  Enviar Comprobante de Pago
                </button>
                <button 
                  onClick={() => { setShowPaymentModal(false); setShowStoreModal(true); }} 
                  className="w-full px-4 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Volver a la Tienda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Clase */}
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
                    <button onClick={handleConfirmClass} className="w-full px-4 py-3.5 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 shadow-lg transition-all flex justify-center items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Confirmar Asistencia
                    </button>
                  )}
                  {(selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <div className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-xl text-center text-sm">✅ Asistencia Confirmada</div>
                  )}
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending' || selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <button onClick={handleCancelClass} className="w-full px-4 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex justify-center items-center gap-2">
                      <span className="text-lg leading-none">✖</span> Cancelar Clase
                    </button>
                  )}
                  <button onClick={() => setShowModal(false)} className="w-full px-4 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-colors">Cerrar Detalles</button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Modal Confirmación de Cancelación */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">⚠️</div>
            <h3 className="text-xl font-extrabold text-white mb-2">¿Cancelar esta clase?</h3>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">Recuperarás tu crédito si lo haces con más de <strong className="text-white">8 horas</strong> de anticipación.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirmModal(false)} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors">Volver</button>
              <button onClick={executeCancellation} className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 shadow-md transition-all active:scale-95">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}