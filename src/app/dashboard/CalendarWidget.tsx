'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
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
    const start = eventInfo.event.start;
    const end = eventInfo.event.end;
    
    // Formato amigable de 12 horas para el texto interno
    const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
    
    const customer = eventInfo.event.extendedProps?.customerName || '';
    const service = eventInfo.event.extendedProps?.serviceName || '';
    const teacher = eventInfo.event.extendedProps?.teacherName || '';

    // Tooltip nativo que aparece al hacer hover
    const tooltipText = `Horario: ${startTime} - ${endTime}\nClase: ${eventInfo.event.title}\nAlumno: ${customer}\nInstructor: ${teacher}`;

    return (
      <div 
        title={tooltipText} 
        className="flex flex-col p-1 w-full h-full text-left overflow-hidden text-white"
      >
        <div className="text-[10px] md:text-[11px] font-bold leading-none mb-0.5 opacity-90">
          {startTime}
        </div>
        <div className="text-[11px] md:text-sm font-extrabold leading-tight truncate">
          {eventInfo.event.title}
        </div>
        {(customer || service) && (
          <div className="text-[10px] md:text-xs font-medium leading-tight truncate mt-0.5 opacity-80">
            {customer && <span>👤 {customer}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden calendar-container">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        expandRows={true}
        height="700px" 
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        eventContent={renderEventContent}
        nowIndicator={true}
        // NUEVO: Formato de días claros (ej. "lunes 14")
        dayHeaderFormat={{ weekday: 'long', day: 'numeric' }}
        // NUEVO: Formato de horas claro en el eje izquierdo (ej. "6:00 pm")
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: isMobile ? 'timeGridDay,timeGridWeek' : 'timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Hoy',
          week: 'Semana',
          day: 'Día'
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

        .calendar-container .fc-col-header-cell-cushion, 
        .calendar-container .fc-timegrid-axis-cushion, 
        .calendar-container .fc-timegrid-slot-label-cushion {
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .calendar-container .fc-timegrid-now-indicator-line {
          border-color: #06b6d4;
          border-width: 2px;
        }
        .calendar-container .fc-timegrid-now-indicator-arrow {
          border-color: #06b6d4;
          border-top-color: transparent;
          border-bottom-color: transparent;
        }
      `}</style>
    </div>
  );
}