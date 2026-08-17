import React, { useState } from 'react';
import { Scissors, CheckCircle } from 'lucide-react';
import { Organization, Service, Barber, Appointment } from '../types';

interface TenantBookingViewProps {
  org: Organization;
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  onAddAppointment: (newApp: Omit<Appointment, 'id'>) => void;
  onBackToAdmin: () => void;
}

export const TenantBookingView: React.FC<TenantBookingViewProps> = ({
  org,
  services,
  barbers,
  appointments,
  onAddAppointment,
  onBackToAdmin
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const handleFinishBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber || !selectedTime || !clientName) return;

    onAddAppointment({
      client_name: clientName,
      client_phone: clientPhone,
      service_id: selectedService.id,
      service_name: selectedService.name,
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.full_name,
      start_time: selectedTime,
      price: selectedService.price,
      status: 'scheduled'
    });

    setConfirmed(true);
  };

  return (
    <div className="max-w-xl mx-auto py-4 animate-fadeIn">
      {/* Botão de Regresso para o Admin */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToAdmin}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-colors"
        >
          ← Regressar ao Painel Admin
        </button>
        <span className="text-xs text-slate-500 font-mono">Modo de Visualização do Cliente</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* CABEÇALHO DO SALÃO */}
        <div className="p-6 bg-gradient-to-b from-amber-500/10 to-transparent border-b border-slate-800 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3">
            <Scissors className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{org.name}</h2>
          <p className="text-xs text-slate-400 mt-1">Agende o seu horário em poucos segundos</p>
        </div>

        {confirmed ? (
          /* ECRÃ DE CONFIRMAÇÃO */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Agendamento Confirmado!</h3>
              <p className="text-xs text-slate-400 mt-2">Aguardamos por si na barbearia no horário selecionado.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Serviço:</span> <span className="text-white font-bold">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Barbeiro:</span> <span className="text-white font-bold">{selectedBarber?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Horário:</span> <span className="text-amber-400 font-bold font-mono">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Valor:</span> <span className="text-emerald-400 font-bold">R$ {selectedService?.price.toFixed(2)}</span></div>
            </div>

            <button
              onClick={() => {
                setConfirmed(false);
                setStep(1);
                setSelectedService(null);
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Fazer Novo Agendamento
            </button>
          </div>
        ) : (
          /* PASSO A PASSO DO AGENDAMENTO */
          <div className="p-6 space-y-6">
            {/* ETAPA 1: SERVIÇO */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">1. Selecione o Serviço</h3>
                <div className="space-y-3">
                  {services.filter(s => s.active).map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex justify-between items-center transition-all group"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors">{service.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{service.duration_minutes} minutos</p>
                      </div>
                      <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 2: BARBEIRO */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">2. Escolha o Profissional</h3>
                  <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white">Alterar serviço</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => {
                        setSelectedBarber(barber);
                        setStep(3);
                      }}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex items-center gap-4 transition-all"
                    >
                      <img src={barber.avatar_url} alt={barber.full_name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                      <div>
                        <h4 className="font-bold text-white">{barber.full_name}</h4>
                        <p className="text-xs text-slate-400">{barber.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 3: HORÁRIO */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">3. Escolha o Horário</h3>
                  <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-white">Alterar barbeiro</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => {
                    const isOccupied = appointments.some(a => a.start_time === time && a.barber_id === selectedBarber?.id && a.status !== 'canceled');

                    return (
                      <button
                        key={time}
                        disabled={isOccupied}
                        onClick={() => {
                          setSelectedTime(time);
                          setStep(4);
                        }}
                        className={`py-3 rounded-xl font-mono text-sm font-bold border transition-all ${
                          isOccupied
                            ? 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed line-through'
                            : 'bg-slate-950 text-amber-400 border-slate-800 hover:border-amber-500 hover:bg-amber-500/10'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ETAPA 4: DADOS FINAIS DO CLIENTE */}
            {step === 4 && (
              <form onSubmit={handleFinishBooking} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">4. Os Seus Dados</h3>
                  <button type="button" onClick={() => setStep(3)} className="text-xs text-slate-400 hover:text-white">Alterar horário</button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: João Ferreira"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-colors shadow-lg shadow-amber-500/20 text-base"
                >
                  Confirmar Agendamento
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
