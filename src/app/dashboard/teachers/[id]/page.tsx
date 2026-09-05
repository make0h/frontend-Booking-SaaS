'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

// Reutilizamos el widget que ya tienes creado en la raíz del dashboard
const CalendarWidget = dynamic(() => import('../../CalendarWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[40vh] flex items-center justify-center text-slate-500">
      Cargando agenda del instructor...
    </div>
  )
});

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const [teacher, setTeacher] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // 1. Traemos la información global
        const [empRes, aptRes, servRes] = await Promise.all([
          api.get('/users/employees'),
          api.get('/appointments'),
          api.get('/services')
        ]);

        // 2. Filtramos al profesor por el ID de la URL
        const foundTeacher = empRes.data.find((t: any) => t.id.toString() === params.id);
        
        if (!foundTeacher) {
          alert('Profesor no encontrado');
          router.push('/dashboard/teachers');
          return;
        }
        
        setTeacher(foundTeacher);
        setServices(servRes.data);

        // 3. Filtramos SOLO las citas asignadas a este profesor
        const teacherApts = aptRes.data.filter((a: any) => a.employeeId?.toString() === params.id);
        setAppointments(teacherApts);

      } catch (error) {
        console.error('Error cargando el perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTeacherData();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  // 4. Adaptamos las citas para FullCalendar
  const calendarEvents = appointments.map((apt: any) => {
    const startDate = new Date(apt.startTime);
    const service = services.find(s => s.id === apt.serviceId);
    const duration = service ? service.durationMinutes : 60;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000); 

    // Colores por estado (Pendiente, Completada, Cancelada)
    let color = '#0891B2'; // Cyan-600 por defecto (Pendiente)
    if (apt.status === 2 || apt.status === 'Cancelled') color = '#EF4444'; 
    if (apt.status === 1 || apt.status === 'Completed') color = '#10B981'; 

    return {
      id: apt.id.toString(),
      title: `${service?.name || 'Clase'}`,
      start: startDate,
      end: endDate,
      backgroundColor: color,
      borderColor: color,
    };
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* Botón de regreso y Título */}
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href="/dashboard/teachers" 
          className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors shadow-sm"
        >
          ←
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Perfil del Instructor</h2>
        </div>
      </div>

      {/* BLOQUE SUPERIOR: Estilo Kodland (Dividido en tarjetas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TARJETA 1: Información Personal */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest">
                Activo
              </span>
            </div>
            
            <h3 className="text-2xl font-bold mb-1">{teacher.name}</h3>
            <p className="text-cyan-400 font-medium text-sm mb-6">Instructor de Natación</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-6 text-center opacity-50">✉️</span>
                {teacher.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-6 text-center opacity-50">📞</span>
                {teacher.phone || 'Sin teléfono registrado'}
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Cursos y Capacidades */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Niveles Habilitados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-48 overflow-y-auto pr-2">
            {services.map(svc => (
              <div key={svc.id} className="bg-slate-800 border border-slate-100 p-3 rounded-xl flex flex-col gap-1 hover:border-cyan-200 hover:bg-cyan-50 transition-colors">
                <span className="font-bold text-slate-200 text-sm">[{svc.id}] {svc.name}</span>
                <span className="text-xs text-slate-500">[{svc.durationMinutes} min] [Aforo: {svc.maxCapacity || 'N/A'}]</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE INFERIOR: Calendario Exclusivo */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 mt-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-200">Horario de Clases Asignadas</h3>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#0891B2] rounded-full"></div> Pendiente</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#10B981] rounded-full"></div> Completada</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-[#EF4444] rounded-full"></div> Cancelada</span>
          </div>
        </div>
        
        {/* Usamos el widget de calendario, pero solo con los eventos de ESTE profesor */}
        <CalendarWidget events={calendarEvents} onEventClick={(info: any) => console.log('Clic en cita:', info.event.id)} />
      </div>

    </div>
  );
}