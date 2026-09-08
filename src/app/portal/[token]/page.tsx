'use client';

import { useEffect, useState, use, useRef } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ClayButton from '@/components/ClayButton'; 
import { motion, AnimatePresence } from 'framer-motion';

// Reutilizamos el widget del calendario
const CalendarWidget = dynamic(() => import('../../dashboard/CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[40vh] flex flex-col items-center justify-center text-slate-400 font-bold bg-slate-900/50 rounded-3xl shadow-inner border border-slate-800">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
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
  
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 font-black text-amber-400 text-lg">
                  <span>🚨</span> ¡Tienes una clase hoy!
                </div>
                <p className="text-sm font-bold text-slate-300">Hay una clase programada para hoy que aún no ha sido confirmada.</p>
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
                  className="mt-2 py-2 px-4 bg-amber-500 text-slate-900 font-black rounded-xl shadow-clay hover:bg-amber-400 transition-colors"
                >
                  Ver y Confirmar Ahora
                </button>
              </div>
            ),
            { id: uniqueToastId, duration: Infinity, position: 'top-center', style: { background: '#1e293b', color: '#fff', border: '2px solid #f59e0b', padding: '20px', borderRadius: '24px', boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.4)' } }
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
        toast('¡Asistencia confirmada! ⚠️ ATENCIÓN: Solo te queda 1 clase.', { duration: 5000, icon: '⚠️', style: { background: '#1E293B', color: '#F59E0B', border: '2px solid #F59E0B' } });
      } else {
        toast('¡Asistencia confirmada! ❌ Has agotado tus clases. Recuerda recargar.', { duration: 6000, icon: '🛑', style: { background: '#1E293B', color: '#EF4444', border: '2px solid #EF4444' } });
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

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setShowStoreModal(false);
    setShowPaymentModal(true);
  };

  const openWhatsApp = () => {
    const phoneNumber = "573150663546"; 
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

  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div></div>;
  
  if (error || !customer) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4 text-center">
        <div className="bg-slate-800 p-10 rounded-[3rem] border-2 border-slate-700 max-w-md w-full shadow-clay">
          <div className="text-6xl mb-6 drop-shadow-lg">🔗</div>
          <h2 className="text-2xl font-black text-white mb-3">Acceso Denegado</h2>
          <p className="text-slate-400 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const endDate = apt.endTime ? new Date(apt.endTime) : new Date(startDate.getTime() + (apt.durationMinutes * 60 * 1000));
    let color = '#0891B2'; 
    if (apt.status === 1 || apt.status === 'Confirmed') color = '#F59E0B'; 
    if (apt.status === 2 || apt.status === 'Completed') color = '#10B981'; 
    if (apt.status === 3 || apt.status === 'Cancelled') color = '#EF4444'; 
    return { id: apt.id.toString(), title: apt.serviceName, start: startDate, end: endDate, backgroundColor: color, borderColor: color, extendedProps: { ...apt } };
  });

  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans pb-12 selection:bg-indigo-500/30">
      <header className="bg-slate-900/60 backdrop-blur-xl border-b-2 border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.4)] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-clay">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-indigo-400 font-black uppercase tracking-wider mb-0.5">Portal de Alumno</p>
              <h1 className="text-xl font-black text-white truncate max-w-[200px] sm:max-w-xs">{customer.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4 space-y-8">
        
        {/* TARJETA DE CRÉDITOS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800 rounded-[2.5rem] p-8 border-2 border-slate-700/50 shadow-clay relative overflow-hidden">
          {customer.credits <= 1 && <div className="absolute top-0 left-0 w-full h-2 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Clases Disponibles</h2>
              <div className="flex items-end gap-3">
                <span className={`text-6xl font-black ${customer.credits > 1 ? 'text-white' : 'text-red-400 animate-pulse drop-shadow-md'}`}>{customer.credits}</span>
                <span className="text-slate-500 font-bold mb-2 text-lg">clases</span>
              </div>
              {customer.credits === 1 && <p className="text-sm font-black text-red-400 mt-3 bg-red-900/20 inline-block px-3 py-1 rounded-lg border border-red-500/20">⚠️ ¡Solo te queda 1 clase! Recuerda recargar pronto.</p>}
              {customer.credits <= 0 && <p className="text-sm font-black text-red-400 mt-3 bg-red-900/20 inline-block px-3 py-1 rounded-lg border border-red-500/20">❌ Se agotaron tus clases. Recarga para seguir agendando.</p>}
            </div>
            
            <ClayButton 
              onClick={() => setShowStoreModal(true)}
              colorClass="bg-indigo-600 text-white w-full sm:w-auto"
              className="py-5 px-8 text-lg"
            >
              <span>🛒</span> Tienda de Clases
            </ClayButton>
          </div>
        </motion.div>

        {/* CALENDARIO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-2 border-slate-700/50 shadow-clay">
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="text-2xl font-black text-white">Tu Horario</h3>
            <div className="flex flex-wrap gap-3 text-[11px] sm:text-xs font-black text-slate-400 bg-slate-900/60 p-3 rounded-2xl shadow-inner border border-slate-700/30">
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#0891B2] rounded-full shadow-clay"></span> Pendiente</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#F59E0B] rounded-full shadow-clay"></span> Confirmada</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#10B981] rounded-full shadow-clay"></span> Completada</span>
            </div>
          </div>
          <CalendarWidget events={calendarEvents} onEventClick={handleEventClick} />
        </motion.div>
      </main>

      {/* ============================================================ */}
      {/* ✨ MODAL: TIENDA / CATÁLOGO                                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              
              <div className="px-8 py-6 border-b-2 border-slate-700/50 flex justify-between items-center bg-slate-800 z-10">
                <div>
                  <h3 className="text-3xl font-black text-white">Adquirir Clases</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">Elige el plan que mejor se adapte a ti</p>
                </div>
                <button onClick={() => setShowStoreModal(false)} className="bg-slate-700 w-12 h-12 rounded-full shadow-clay text-slate-300 font-bold text-2xl hover:text-white transition-colors flex items-center justify-center">&times;</button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-10 flex-1">
                
                {/* PAQUETES MENSUALES */}
                {availablePackages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-5">🌟 Paquetes Mensuales (Mejor Precio)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {availablePackages.map(pkg => (
                        <div key={`pkg-${pkg.id}`} className="bg-slate-900 shadow-inner border border-slate-700/50 p-6 rounded-[2rem] flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                          <div>
                            <div className="inline-block bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-lg mb-4 shadow-clay">
                              {pkg.classCount} CLASES
                            </div>
                            <h5 className="text-xl font-black text-white mb-2">{pkg.name}</h5>
                            <p className="text-sm font-medium text-slate-400 mb-6">{pkg.description || 'Paquete completo de clases.'}</p>
                          </div>
                          <div className="mt-auto">
                            <p className="text-3xl font-black text-emerald-400 mb-4">${pkg.totalPrice.toLocaleString('es-CO')}</p>
                            <ClayButton 
                              onClick={() => handleSelectProduct({ type: 'package', id: pkg.id, name: pkg.name, price: pkg.totalPrice, count: pkg.classCount })}
                              colorClass="bg-emerald-600 text-white w-full"
                              className="py-3.5"
                            >
                              Comprar Paquete
                            </ClayButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CLASES INDIVIDUALES */}
                {availableServices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-5">📘 Clases Individuales</h4>
                    <div className="space-y-4">
                      {availableServices.map(srv => (
                        <div key={`srv-${srv.id}`} className="bg-slate-900 shadow-inner border border-slate-700/50 p-5 rounded-[1.5rem] flex items-center justify-between hover:border-cyan-500/30 transition-colors">
                          <div>
                            <h5 className="text-lg font-black text-white mb-1">{srv.name}</h5>
                            <p className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-md inline-block">Duración: {srv.durationMinutes} min</p>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <p className="text-2xl font-black text-cyan-400">${srv.price.toLocaleString('es-CO')}</p>
                            <ClayButton 
                              onClick={() => handleSelectProduct({ type: 'service', id: srv.id, name: srv.name, price: srv.price, count: 1 })}
                              colorClass="bg-slate-700 text-white"
                              className="py-2.5 px-6 text-sm"
                            >
                              Seleccionar
                            </ClayButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL DE CHECKOUT MANUAL                                     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showPaymentModal && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-md overflow-hidden">
              
              <div className="px-8 py-6 border-b-2 border-slate-700/50 flex justify-between items-center bg-slate-800">
                <h3 className="text-2xl font-black text-white truncate">Detalle de Pago</h3>
                <button onClick={() => { setShowPaymentModal(false); setShowStoreModal(true); }} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-white transition-colors flex items-center justify-center">&times;</button>
              </div>
              
              <div className="p-8">
                
                <div className="bg-slate-900 shadow-inner border border-slate-700 p-6 rounded-[2rem] mb-8 text-center">
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Estás adquiriendo:</p>
                  <p className="text-xl font-black text-white mb-2">{selectedProduct.name}</p>
                  <p className="text-4xl font-black text-emerald-400 drop-shadow-md">${selectedProduct.price.toLocaleString('es-CO')}</p>
                </div>

                <p className="text-sm font-bold text-slate-300 mb-6 text-center leading-relaxed">
                  Realiza la transferencia a una de nuestras cuentas y envíanos el comprobante. <strong className="text-white">Tus créditos se activarán al instante.</strong>
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="bg-slate-900 shadow-inner p-4 rounded-2xl border border-slate-700/50 flex items-center gap-5">
                    <div className="w-12 h-12 bg-[#392061] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-clay">N</div>
                    <div>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-0.5">Nequi</p>
                      <p className="text-lg font-black text-white">3150663546</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 shadow-inner p-4 rounded-2xl border border-slate-700/50 flex items-center gap-5">
                    <div className="w-12 h-12 bg-[#FDE213] rounded-xl flex items-center justify-center shadow-clay"><span className="font-black text-2xl text-black">B</span></div>
                    <div>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-wider mb-0.5">Bancolombia Ahorros</p>
                      <p className="text-lg font-black text-white">123-456789-00</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <ClayButton 
                    onClick={openWhatsApp}
                    colorClass="bg-emerald-600 text-white"
                    className="py-4 w-full flex justify-center items-center gap-3 text-lg"
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"></path></svg>
                    Enviar Comprobante
                  </ClayButton>
                  <ClayButton 
                    onClick={() => { setShowPaymentModal(false); setShowStoreModal(true); }} 
                    colorClass="bg-slate-700 text-slate-300"
                    className="py-4 w-full"
                  >
                    Volver a la Tienda
                  </ClayButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalles de Clase */}
      <AnimatePresence>
        {showModal && selectedAppointment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-sm overflow-hidden">
              <div className="px-8 py-6 border-b-2 border-slate-700/50 flex justify-between items-center bg-slate-800">
                <h3 className="text-2xl font-black text-white truncate pr-4">Detalle de Clase</h3>
                <button onClick={() => setShowModal(false)} className="bg-slate-700 w-10 h-10 rounded-full shadow-clay text-slate-300 font-bold text-xl hover:text-white transition-colors flex items-center justify-center">&times;</button>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-black text-white mb-6 text-center">{selectedAppointment.serviceName}</h4>
                
                <div className="bg-slate-900 shadow-inner rounded-2xl border border-slate-700/50 p-5 space-y-5 mb-8">
                  <div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">📅 Fecha de la Clase</p>
                    <p className="text-base font-bold text-white capitalize">{formatDate(selectedAppointment.startObj)}</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700/50 shadow-clay">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Inicio</p>
                      <p className="text-base font-black text-indigo-400">{formatTime(selectedAppointment.startObj)}</p>
                    </div>
                    <div className="text-slate-600 font-bold">→</div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fin</p>
                      <p className="text-base font-black text-indigo-400">{formatTime(selectedAppointment.endObj)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending') && (
                    <ClayButton onClick={handleConfirmClass} colorClass="bg-amber-500 text-slate-900" className="py-4 text-base w-full flex justify-center items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> 
                      Confirmar Asistencia
                    </ClayButton>
                  )}
                  {(selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <div className="w-full px-4 py-4 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 font-black rounded-2xl text-center shadow-inner">✅ Asistencia Confirmada</div>
                  )}
                  {(selectedAppointment.status === 0 || selectedAppointment.status === 'Pending' || selectedAppointment.status === 1 || selectedAppointment.status === 'Confirmed') && (
                    <button onClick={handleCancelClass} className="w-full px-4 py-4 bg-slate-900 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-900/40 shadow-inner transition-colors flex justify-center items-center gap-2">
                      <span className="text-xl leading-none">✖</span> Cancelar Clase
                    </button>
                  )}
                  <ClayButton onClick={() => setShowModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="py-4">Cerrar Detalles</ClayButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirmación de Cancelación */}
      <AnimatePresence>
        {showCancelConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 rounded-[2.5rem] shadow-clay border-2 border-slate-700 w-full max-w-sm overflow-hidden p-8 text-center">
              <div className="w-20 h-20 bg-slate-900 text-red-500 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">⚠️</div>
              <h3 className="text-2xl font-black text-white mb-3">¿Cancelar esta clase?</h3>
              <p className="text-slate-400 mb-8 font-bold text-sm leading-relaxed">Recuperarás tu crédito si lo haces con más de <strong className="text-white">8 horas</strong> de anticipación.</p>
              <div className="flex gap-4">
                <ClayButton onClick={() => setShowCancelConfirmModal(false)} colorClass="bg-slate-700 text-slate-300 w-full" className="flex-1 py-3 text-sm">Volver</ClayButton>
                <ClayButton onClick={executeCancellation} colorClass="bg-red-600 text-white w-full" className="flex-1 py-3 text-sm">Sí, cancelar</ClayButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}