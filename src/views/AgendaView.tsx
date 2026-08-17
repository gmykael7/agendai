import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, User, Scissors, Plus, CheckCircle, AlertCircle
} from 'lucide-react';
import { Appointment, Barber, Service } from '../types';

interface AgendaViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  barbers: Barber[];
  services: Service[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  setAppointments,
  barbers,
  services,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const slots = useMemo(() => {
    const list: string[] = [];
    for (let h = 8; h <= 19; h++) {
      const hh = h.toString().padStart(2, '0');
      list.push(`${hh}:00`);
      list.push(`${hh}:30`);
    }
    return list;
  }, []);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const formattedDateTitle = useMemo(() => {
    const current = new Date(selectedDate + 'T00:00:00');
    return current.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO DA AGENDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121B2E] p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            Agenda Completa
          </h2>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            {formattedDateTitle}
          </p>
        </div>

        {/* CONTROLES DE DATA E PROFISSIONAL */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Barbeiro */}
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos os Barbeiros</option>
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.full_name}</option>
            ))}
          </select>

          {/* Navegador de Data */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GRADE HORÁRIA */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 gap-2.5">
          {slots.map((time) => {
            const matchingAppointments = appointments.filter(a => {
              const matchesTime = a.start_time === time;
              const matchesBarber = selectedBarberId === 'all' || a.barber_id === selectedBarberId;
              const isNotCanceled = a.status !== 'canceled';
              return matchesTime && matchesBarber && isNotCanceled;
            });

            const isOccupied = matchingAppointments.length > 0;

            return (
              <div
                key={time}
                className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOccupied
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-75 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className={`text-base font-bold font-mono ${isOccupied ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {time}
                    </span>
                  </div>

                  {isOccupied ? (
                    <div className="space-y-1">
                      {matchingAppointments.map(app => (
                        <div key={app.id} className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{app.client_name}</span>
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                            {app.service_name}
                          </span>
                          <span className="text-xs text-slate-400">
                            • Profissional: <strong className="text-slate-300">{app.barber_name}</strong>
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-bold">
                            (R$ {app.price.toFixed(2)})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" /> Horário Disponível
                    </span>
                  )}
                </div>

                <div>
                  {isOccupied ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Ocupado
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Livre
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
