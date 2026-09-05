'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';

export default function CalendarWidget({ events, onEventClick, onDateClick }: any) {
  const [isMobile, setIsMobile] = useState(false);

  // Detector de pantalla para cambiar la vista automáticamente
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile(); // Check inicial
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Así renderizamos la tarjeta dentro del calendario (Igual a la imagen image_01ff08.png)
  const renderEventContent = (eventInfo: any) => {
    const start = eventInfo.event.start;
    const end = eventInfo.event.end;
    
    // Formateamos la hora ej. "19:00-20:30"
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    
    const customer = eventInfo.event.extendedProps?.customerName || '';
    const service = eventInfo.event.extendedProps?.serviceName || '';

    return (
      <div className="flex flex-col p-1.5 md:p-2 w-full h-full text-left overflow-hidden text-white">
        <div className="text-[10px] md:text-xs font-bold leading-tight mb-0.5 opacity-90 tracking-wide">
          {startTime}-{endTime}
        </div>
        <div className="text-xs md:text-sm font-extrabold leading-tight truncate">
          {eventInfo.event.title}
        </div>
        {(customer || service) && (
          <div className="text-[10px] md:text-xs font-medium leading-tight truncate mt-1 opacity-80">
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
        // Ocultamos todo el día y definimos horario de piscina (ajústalo si abren más temprano/tarde)
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        expandRows={true}
        height="700px" // Altura fija para que el scroll funcione bien en móvil
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        eventContent={renderEventContent}
        nowIndicator={true}
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
        locale="es" // Días y meses en español
      />

      {/* ESTILOS GLOBALES PARA IGUALAR TU IMAGEN */}
      <style jsx global>{`
        .calendar-container .fc {
          /* Colores base para igualar el mockup */
          --fc-border-color: #334155; 
          --fc-page-bg-color: #0f172a; 
          --fc-neutral-bg-color: #1e293b;
          --fc-today-bg-color: rgba(8, 145, 178, 0.05); 
          font-family: inherit;
        }

        /* Cabeceras de los días */
        .calendar-container .fc-theme-standard th {
          background-color: #1e293b;
          border-color: #334155;
          padding: 12px 0;
          text-transform: capitalize;
        }

        /* Líneas de la cuadrícula sutiles */
        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th, 
        .calendar-container .fc-scrollgrid {
          border-color: #334155;
        }

        /* Botones superiores */
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
          background-color: #0891b2 !important; /* Cyan para el botón activo */
          color: white !important;
        }

        /* Bloques de Eventos (Clases) */
        .calendar-container .fc-timegrid-event {
          border-radius: 6px;
          border: none !important; /* Sin bordes, color sólido como en tu imagen */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin: 1px 2px !important;
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        .calendar-container .fc-timegrid-event:hover {
          transform: scale(1.02);
          filter: brightness(1.1);
          z-index: 50 !important;
          cursor: pointer;
        }

        /* Textos de los ejes (horas a la izquierda y días arriba) */
        .calendar-container .fc-col-header-cell-cushion, 
        .calendar-container .fc-timegrid-axis-cushion, 
        .calendar-container .fc-timegrid-slot-label-cushion {
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.85rem;
        }

        /* Línea de hora actual */
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