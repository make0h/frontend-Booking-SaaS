'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type PayrollStatus = 'Válido para pago' | 'Borrador';

interface ClassDetail {
  id: string;
  date: string;
  className: string;
  plannedDuration: number;
  actualDuration: number | null;
  payoutCop: number;
  status: PayrollStatus;
}

interface PayrollPeriod {
  id: string;
  month: string;
  year: number;
  isCurrent: boolean;
  totalCop: number;
  earnedMtdCop: number;
  hours: number;
  completedLessons: number;
  totalLessons: number;
  classes: ClassDetail[];
}

export default function PayrollPanel({ teacherId }: { teacherId: string }) {
  const [payrollData, setPayrollData] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    const fetchPayroll = async () => {
      if (!teacherId) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/payroll/employee/${teacherId}/year/${selectedYear}`);
        setPayrollData(response.data);
      } catch (error) {
        console.error('Error al cargar la nómina:', error);
        toast.error('No se pudo cargar la información de pagos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [teacherId, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // VISTA 2: DETALLE DEL MES
  if (selectedPeriod) {
    return (
      <div className="flex flex-col gap-6 text-slate-200 animate-in fade-in duration-300">
        
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => setSelectedPeriod(null)}
            className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white"
          >
            ← Volver
          </button>
          <h2 className="text-2xl font-bold">{selectedPeriod.month} de {selectedPeriod.year}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Importe a Pagar</p>
            <h3 className="text-2xl font-bold text-emerald-400">COP {selectedPeriod.earnedMtdCop.toLocaleString('es-CO')}</h3>
            <p className="text-xs text-slate-500 mt-1">De un total proyectado de COP {selectedPeriod.totalCop.toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lecciones Impartidas</p>
            <h3 className="text-2xl font-bold text-white">{selectedPeriod.completedLessons} / {selectedPeriod.totalLessons}</h3>
            <p className="text-sm text-slate-400 mt-1">{selectedPeriod.hours} horas de clase</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Incidencias</p>
            <h3 className="text-2xl font-bold text-white">0</h3>
            <p className="text-sm text-slate-400 mt-1">Sin reportes</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden mt-4">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white">Detalle de Clases</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-950/50">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Clase / Nivel</th>
                  <th className="px-6 py-4">Duración</th>
                  <th className="px-6 py-4">Pago (COP)</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {selectedPeriod.classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">{cls.date}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-300 font-medium" title={cls.className}>
                      {cls.className}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{cls.plannedDuration} min</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      ${cls.payoutCop.toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      {cls.status === 'Válido para pago' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                          Válido para pago
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                          Borrador (Pendiente)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {selectedPeriod.classes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay clases registradas en este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 1: RESUMEN DE MESES
  const currentPeriod = payrollData.find(d => d.isCurrent);
  const pastPeriods = payrollData.filter(d => !d.isCurrent);

  return (
    <div className="flex flex-col gap-8 text-slate-200 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Nóminas y Pagos</h2>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <span className="text-cyan-400 font-bold">Instructor</span>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer font-semibold"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>
      </div>

      {/* Tarjeta del Mes Actual */}
      {currentPeriod ? (
        <div 
          onClick={() => setSelectedPeriod(currentPeriod)}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
        >
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 hidden md:block">
            <span className="text-2xl text-cyan-400">→</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Período Actual · {currentPeriod.month} de {currentPeriod.year}
            </span>
          </div>
          
          <div className="mb-8">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Proyección Total del Mes</p>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight truncate">
              COP {currentPeriod.totalCop.toLocaleString('es-CO')}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-6 border-t border-slate-800/80 pt-6 max-w-2xl">
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1">Pago Asegurado (Ya dictado)</p>
              <p className="text-base md:text-lg font-bold text-emerald-400 truncate">COP {currentPeriod.earnedMtdCop.toLocaleString('es-CO')}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1">Horas Totales</p>
              <p className="text-base md:text-lg font-bold text-white">{currentPeriod.hours}h</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1">Lecciones</p>
              <p className="text-base md:text-lg font-bold text-white">{currentPeriod.completedLessons} / {currentPeriod.totalLessons}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-3">📅</span>
          <p className="text-slate-400 font-medium">No hay clases agendadas para el mes actual.</p>
        </div>
      )}

      {/* Meses Pasados */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Períodos Pasados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {pastPeriods.map((period) => (
            <div 
              key={period.id}
              onClick={() => setSelectedPeriod(period)}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-all flex flex-col justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{period.month} {period.year}</p>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 truncate group-hover:text-cyan-400 transition-colors">
                  COP {period.totalCop.toLocaleString('es-CO')}
                </h3>
              </div>
              <div className="mt-auto self-start">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                  {period.completedLessons} clases impartidas
                </span>
              </div>
            </div>
          ))}

          {pastPeriods.length === 0 && (
             <div className="col-span-full bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center">
               <span className="text-slate-600 text-3xl mb-2">🔍</span>
               <span className="text-slate-500 text-sm font-medium">No hay historial de pagos para el año seleccionado</span>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}