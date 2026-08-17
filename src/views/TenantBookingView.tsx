import React, { useState, useMemo } from 'react';
import { 
  Scissors, CheckCircle, Clock, Calendar, 
  MapPin, Phone, MessageSquare, ArrowLeft, User
} from 'lucide-react';
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
  onBackToAdmin,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Gerar slots de horários com base no horário de funcionamento
  const timeSlots = useMemo(() => {
    const startHour = parseInt(org.open_hour?.split(':')[0] || '8', 10);
    const endHour = parseInt(org.close_hour?.split(':')[0] || '20', 10);
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      const hourStr = h.toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:30`);
    }
    return slots.length > 0 ? slots : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  }, [org.open_hour, org.close_hour]);

  const activeServices = services.filter(s => s.active);
  const activeBarbers = barbers.filter(b => b.active !== false);

  const handleFinishBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber || !selectedTime || !clientName.trim()) return;

    onAddAppointment({
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      service_id: selectedService.id,
      service_name: selectedService.name,
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.full_name,
      start_time: selectedTime,
      price: selectedService.price,
      status: 'scheduled',
    });

    setConfirmed(true);
  };

  const getWhatsAppLink = () => {
    if (!selectedService || !selectedBarber) return '#';
    const cleanPhone = org.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Acabei de agendar um horário na ${org.name}:
` +
      `📌 *Serviço:* ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})
` +
      `💈 *Profissional:* ${selectedBarber.full_name}
` +
      `⏰ *Horário:* Hoje às ${selectedTime}
` +
      `👤 *Cliente:* ${clientName}`
    );
    return `https://wa.me/55${cleanPhone}?text=${message}`;
  };

  return (
    <div className="max-w-xl mx-auto py-4 animate-fadeIn">
      {/* BOTÃO DE VOLTA AO PAINEL */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToAdmin}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Regressar ao Painel Admin
        </button>
        <span className="text-xs text-slate-500 font-mono">Modo de Visualização do Cliente</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* CABEÇALHO DO ESTABELECIMENTO */}
        <div className="p-6 bg-gradient-to-b from-amber-500/15 to-transparent border-b border-slate-800 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <Scissors className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{org.name}</h2>
          {org.address && (
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" /> {org.address}
            </p>
          )}
          <p className="text-xs text-amber-400/90 font-medium mt-1">Agendamento Online 24h</p>
        </div>

        {/* VERIFICAÇÃO SE HÁ SERVIÇOS E BARBEIROS CADASTRADOS */}
        {activeServices.length === 0 || activeBarbers.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Barbearia em Configuração</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                O administrador ainda está cadastrando a equipe e os serviços oferecidos.
              </p>
            </div>
            <button
              onClick={onBackToAdmin}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Configurar no Painel
            </button>
          </div>
        ) : confirmed ? (
          /* TELA DE CONFIRMAÇÃO DO AGENDAMENTO */
          <div className="p-8 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Agendamento Confirmado!</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Seu horário foi reservado com sucesso no sistema da barbearia.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Serviço:</span>
                <span className="text-white font-bold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profissional:</span>
                <span className="text-white font-bold">{selectedBarber?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Horário:</span>
                <span className="text-amber-400 font-bold font-mono text-sm">{selectedTime}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Valor total:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">R$ {selectedService?.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Comprovante no WhatsApp
              </a>

              <button
                onClick={() => {
                  setConfirmed(false);
                  setStep(1);
                  setSelectedService(null);
                  setSelectedBarber(null);
                  setSelectedTime('');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
              >
                Fazer Outro Agendamento
              </button>
            </div>
          </div>
        ) : (
          /* PASSO A PASSO (1 a 4) */
          <div className="p-6 space-y-6">
            {/* ETAPA 1: ESCOLHA DO SERVIÇO */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">1</span>
                    Selecione o Serviço
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{activeServices.length} opções</span>
                </div>

                <div className="space-y-2.5">
                  {activeServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(2);
                      }}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex justify-between items-center transition-all group hover:bg-slate-950/80"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm">{service.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {service.duration_minutes} min • {service.category}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-mono">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 2: ESCOLHA DO BARBEIRO */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                    Escolha o Profissional
                  </h3>
                  <button onClick={() => setStep(1)} className="text-xs text-amber-400 hover:underline">
                    Alterar serviço
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {activeBarbers.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => {
                        setSelectedBarber(barber);
                        setStep(3);
                      }}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex items-center gap-3.5 transition-all group"
                    >
                      <img 
                        src={barber.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'} 
                        alt={barber.full_name} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700" 
                      />
                      <div>
                        <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm">{barber.full_name}</h4>
                        <p className="text-xs text-slate-400">{barber.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 3: ESCOLHA DO HORÁRIO */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">3</span>
                    Escolha o Horário
                  </h3>
                  <button onClick={() => setStep(2)} className="text-xs text-amber-400 hover:underline">
                    Alterar barbeiro
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {timeSlots.map((time) => {
                    const isOccupied = appointments.some(
                      a => a.start_time === time && a.barber_id === selectedBarber?.id && a.status !== 'canceled'
                    );

                    return (
                      <button
                        key={time}
                        disabled={isOccupied}
                        onClick={() => {
                          setSelectedTime(time);
                          setStep(4);
                        }}
                        className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
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

            {/* ETAPA 4: DADOS DO CLIENTE */}
            {step === 4 && (
              <form onSubmit={handleFinishBooking} className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs flex items-center justify-center font-bold">4</span>
                    Seus Dados de Contato
                  </h3>
                  <button type="button" onClick={() => setStep(3)} className="text-xs text-amber-400 hover:underline">
                    Alterar horário
                  </button>
                </div>

                {/* Resumo Rápido da Escolha */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1 text-slate-300">
                  <p><span className="text-slate-500">Serviço:</span> <strong className="text-white">{selectedService?.name}</strong></p>
                  <p><span className="text-slate-500">Profissional:</span> <strong className="text-white">{selectedBarber?.full_name}</strong></p>
                  <p><span className="text-slate-500">Horário:</span> <strong className="text-amber-400 font-mono">{selectedTime}</strong> (R$ {selectedService?.price.toFixed(2)})</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(84) 99999-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 text-sm mt-2"
                >
                  Finalizar e Confirmar Agendamento
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
