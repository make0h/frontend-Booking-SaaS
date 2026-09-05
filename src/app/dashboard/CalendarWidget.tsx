'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; // NUEVO: Importamos la vista de lista
import { useEffect, useState } from 'react';

export default function CalendarWidget({ events, onEventClick, onDateClick }: any) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile(); 
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderEventContent = (eventInfo: any) => {
    // Si estamos en vista de lista (móvil), FullCalendar ya maneja la hora a la izquierda, 
    // así que solo renderizamos la info limpia sin el bloque de color.
    if (eventInfo.view.type === 'listWeek' || eventInfo.view.type === 'listDay') {
      const customer = eventInfo.event.extendedProps?.customerName || '';
      const teacher = eventInfo.event.extendedProps?.teacherName || '';
      return (
        <div className="flex flex-col text-white cursor-pointer py-1">
          <div className="font-bold text-sm text-cyan-400">{eventInfo.event.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            👤 Alumno: {customer} | 🛟 Profe: {teacher}
          </div>
        </div>
      );
    }

    // Renderizado normal para la vista de PC (Cuadrícula)
    const start = eventInfo.event.start;
    const end = eventInfo.event.end;
    const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const customer = eventInfo.event.extendedProps?.customerName || '';
    const teacher = eventInfo.event.extendedProps?.teacherName || '';

    const tooltipText = `Horario: ${startTime}\nClase: ${eventInfo.event.title}\nAlumno: ${customer}\nInstructor: ${teacher}`;

    return (
      <div title={tooltipText} className="flex flex-col p-1 w-full h-full text-left overflow-hidden text-white">
        <div className="text-[10px] md:text-[11px] font-bold leading-none mb-0.5 opacity-90">
          {startTime}
        </div>
        <div className="text-[11px] md:text-sm font-extrabold leading-tight truncate">
          {eventInfo.event.title}
        </div>
        {customer && (
          <div className="text-[10px] md:text-xs font-medium leading-tight truncate mt-0.5 opacity-80">
            <span>👤 {customer}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden calendar-container">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin]} // Añadido listPlugin
        initialView={isMobile ? 'listWeek' : 'timeGridWeek'} // En móvil arranca como lista
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        expandRows={true}
        height={isMobile ? "auto" : "700px"} // En móvil deja que la lista fluya
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        eventContent={renderEventContent}
        nowIndicator={true}
        dayHeaderFormat={{ weekday: 'long', day: 'numeric' }}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          // Controles dinámicos según dispositivo
          right: isMobile ? 'listWeek,listDay' : 'timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Hoy',
          week: 'Semana',
          day: 'Día',
          listWeek: 'Agenda', // Texto para el botón de lista
          listDay: 'Día'
        }}
        locale="es" 
      />

      <style jsx global>{`
        .calendar-container .fc {
          --fc-border-color: #334155; 
          --fc-page-bg-color: #0f172a; 
          --fc-neutral-bg-color: #1e293b;
          --fc-today-bg-color: rgba(8, 145, 178, 0.05); 
          font-family: inherit;
        }

        .calendar-container .fc-theme-standard th {
          background-color: #1e293b;
          border-color: #334155;
          padding: 12px 0;
          text-transform: capitalize;
        }

        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th, 
        .calendar-container .fc-scrollgrid {
          border-color: #334155;
        }

        .calendar-container .fc-button-primary {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
          font-weight: 600;
          text-transform: capitalize;
          border-radius: 8px;
          padding: 6px 12px;
        }
        .calendar-container .fc-button-primary:hover {
          background-color: #334155 !important;
        }
        .calendar-container .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #0891b2 !important; 
          color: white !important;
        }

        .calendar-container .fc-timegrid-event {
          border-radius: 6px;
          border: none !important; 
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2);
          margin: 1px 2px !important;
          transition: transform 0.1s ease, filter 0.1s ease;
        }
        .calendar-container .fc-timegrid-event:hover {
          transform: scale(1.02);
          filter: brightness(1.1);
          z-index: 50 !important;
          cursor: pointer;
        }

        /* --- NUEVOS ESTILOS PARA LA VISTA DE LISTA (MÓVIL) --- */
        .calendar-container .fc-list {
          border-color: #334155 !important;
        }
        .calendar-container .fc-list-day-cushion {
          background-color: #1e293b !important;
          color: #cbd5e1 !important;
          padding: 12px 16px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
        }
        .calendar-container .fc-list-event:hover td {
          background-color: #334155 !important;
        }
        .calendar-container .fc-list-event-time {
          color: #94a3b8;
          font-weight: 600;
          padding-left: 16px !important;
        }
        .calendar-container .fc-list-event-graphic {
          padding: 0 8px !important;
        }
        .calendar-container .fc-list-event-title {
          padding-right: 16px !important;
        }
        .calendar-container .fc-list-empty {
          background-color: #0f172a !important;
          color: #64748b !important;
          padding: 3rem !important;
        }
      `}</style>
    </div>
  );
}