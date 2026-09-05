'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
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
    // Diseño para la Agenda (Lista vertical)
    if (eventInfo.view.type === 'listWeek' || eventInfo.view.type === 'listDay') {
      const customer = eventInfo.event.extendedProps?.customerName || '';
      const teacher = eventInfo.event.extendedProps?.teacherName || '';
      return (
        <div className="flex flex-col text-white cursor-pointer py-1.5 w-full">
          <div className="font-extrabold text-[13px] text-cyan-400 mb-0.5">{eventInfo.event.title}</div>
          <div className="text-[11px] text-slate-300 font-medium">
            👤 {customer} &nbsp;|&nbsp; 🛟 {teacher}
          </div>
        </div>
      );
    }

    // Diseño para el Tablero (7 días)
    const start = eventInfo.event.start;
    const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const customer = eventInfo.event.extendedProps?.customerName || '';
    const teacher = eventInfo.event.extendedProps?.teacherName || '';

    return (
      <div className="flex flex-col p-1 md:p-1.5 w-full h-full text-left overflow-hidden text-white">
        <div className="text-[10px] md:text-[11px] font-bold leading-none mb-0.5 opacity-90">
          {startTime}
        </div>
        <div className="text-[11px] md:text-sm font-extrabold leading-tight truncate">
          {eventInfo.event.title}
        </div>
        {customer && (
          <div className="text-[10px] md:text-xs font-medium leading-tight truncate mt-0.5 opacity-90 text-cyan-100">
            👤 {customer}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden calendar-container p-2 md:p-4 shadow-xl">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin]}
        
        // Arrancamos siempre en la vista semanal de 7 días (timeGridWeek)
        initialView="timeGridWeek" 
        
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        expandRows={true}
        height="auto" 
        
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        eventContent={renderEventContent}
        nowIndicator={true}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        
        headerToolbar={{
          left: 'prev,next', 
          center: 'title',
          // Botones estándar: Semana, Día, Agenda
          right: 'timeGridWeek,timeGridDay,listWeek'
        }}
        buttonText={{
          week: 'Tablero', // Renombramos 'Semana' como 'Tablero' para tus usuarios
          day: '1 Día',
          listWeek: 'Agenda'
        }}
        locale="es" 
      />

      <style jsx global>{`
        .calendar-container .fc {
          --fc-border-color: #334155; 
          --fc-page-bg-color: #0f172a; 
          --fc-neutral-bg-color: #1e293b;
          --fc-today-bg-color: rgba(8, 145, 178, 0.1); 
          font-family: inherit;
        }

        /* --- CABECERA SEGURA Y RESPONSIVA --- */
        .calendar-container .fc-toolbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          padding-bottom: 1rem;
        }
        @media (min-width: 768px) {
          .calendar-container .fc-toolbar {
            flex-direction: row;
            justify-content: space-between;
          }
        }
        .calendar-container .fc-toolbar-title {
          font-weight: 700;
          font-size: 1.1rem !important;
          color: #f8fafc;
          text-align: center;
        }

        /* --- BOTONES SUPERIORES --- */
        .calendar-container .fc-toolbar-chunk {
          display: flex;
          gap: 4px;
        }
        .calendar-container .fc-button-primary {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
          font-weight: 600;
          text-transform: capitalize;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }
        .calendar-container .fc-button-primary:hover {
          background-color: #334155 !important;
        }
        .calendar-container .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #0891b2 !important; 
          color: white !important;
          border-color: #0891b2 !important;
        }

        /* --- ESTILOS DE TABLA --- */
        .calendar-container .fc-theme-standard th {
          background-color: #1e293b;
          border-color: #334155;
          padding: 8px 0;
          text-transform: capitalize;
        }
        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th, 
        .calendar-container .fc-scrollgrid {
          border-color: #334155;
        }
        .calendar-container .fc-timegrid-event {
          border-radius: 6px;
          border: none !important; 
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2);
          margin: 1px 2px !important;
        }
        .calendar-container .fc-col-header-cell-cushion, 
        .calendar-container .fc-timegrid-axis-cushion, 
        .calendar-container .fc-timegrid-slot-label-cushion {
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.8rem;
        }

        /* --- REPARACIÓN DE LISTA (AGENDA) --- */
        .calendar-container .fc-list {
          border: 1px solid #334155 !important;
          border-radius: 8px;
          overflow: hidden;
        }
        .calendar-container .fc-list-empty {
          background-color: #0f172a !important;
          color: #64748b !important;
          padding: 40px !important;
        }
        .calendar-container .fc-list-day-cushion {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          font-weight: 700 !important;
          padding: 10px 14px !important;
        }
        .calendar-container .fc-list-event td {
          border-color: #334155 !important;
          background-color: #0f172a;
          padding: 8px 12px !important;
        }
        .calendar-container .fc-list-event:hover td {
          background-color: #1e293b !important;
        }
        .calendar-container .fc-list-event-graphic {
          display: none !important; 
        }
        .calendar-container .fc-list-event-time {
          color: #94a3b8 !important;
          font-weight: 600;
          width: 80px;
        }

        /* ✨ EL SCROLL HORIZONTAL (SOLO PARA MÓVILES) ✨ */
        @media (max-width: 768px) {
          /* fc-view-harness es la caja que envuelve la tabla pero excluye los botones */
          .calendar-container .fc-view-harness {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          /* Forzamos que la tabla semanal tenga 800px para que las columnas respiren */
          .calendar-container .fc-timeGridWeek-view {
            min-width: 800px !important;
          }
        }
      `}</style>
    </div>
  );
}