import React, { useState, useMemo } from 'react';
import { 
  Scissors, CheckCircle, Clock, Calendar, 
  MapPin, Phone, MessageSquare, ArrowLeft, User, 
  Sparkles, Check, ChevronRight, AlertCircle, Share2
} from 'lucide-react';
import { Organization, Service, Barber, Appointment } from '../types';

interface TenantBookingViewProps {
  org: Organization;
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  onAddAppointment: (newApp: Omit<Appointment, 'id'>) => Appointment | void;
  onBackToAdmin?: () => void;
  isStandalone?: boolean;
}

export const TenantBookingView: React.FC<TenantBookingViewProps> = ({
  org,
  services,
  barbers,
  appointments,
  onAddAppointment,
  onBackToAdmin,
  isStandalone = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [lastCreatedAppointment, setLastCreatedAppointment] = useState<Appointment | null>(null);

  // Próximos 7 dias para escolha de data
  const dateOptions = useMemo(() => {
    const dates: { dateStr: string; label: string; weekday: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dates.push({ dateStr, label, weekday: weekday.toUpperCase() });
    }
    return dates;
  }, []);

  // Slots de horários dinâmicos baseados no horário da barbearia
  const timeSlots = useMemo(() => {
    const startHour = parseInt(org.open_hour?.split(':')[0] || '8', 10);
    const endHour = parseInt(org.close_hour?.split(':')[0] || '20', 10);
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      const hourStr = h.toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
      slots.push(`${hourStr}:30`);
    }
    return slots.length > 0 ? slots : [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
      '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', 
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
    ];
  }, [org.open_hour, org.close_hour]);

  // Considera ativos todos os serviços onde active !== false
  const activeServices = useMemo(() => {
    return services.filter(s => s.active !== false);
  }, [services]);

  // Considera ativos todos os barbeiros onde active !== false
  const activeBarbers = useMemo(() => {
    return barbers.filter(b => b.active !== false);
  }, [barbers]);

  // Gerar link direto do WhatsApp da Barbearia com a mensagem formatada
  const generateWhatsAppUrl = (app: Appointment) => {
    const cleanPhone = (org.phone || '').replace(/\D/g, '');
    const formattedSelectedDate = new Date((app.date || selectedDate) + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const message = encodeURIComponent(
      `💈 *NOVO AGENDAMENTO ONLINE - ${org.name.toUpperCase()}*

` +
      `👤 *Cliente:* ${app.client_name}
` +
      `📱 *WhatsApp:* ${app.client_phone}
` +
      `✂️ *Serviço:* ${app.service_name} (R$ ${app.price.toFixed(2)})
` +
      `💈 *Profissional:* ${app.barber_name}
` +
      `📅 *Data:* ${formattedSelectedDate}
` +
      `⏰ *Horário:* às ${app.start_time}

` +
      `_Agendamento registrado no sistema AgendAI._`
    );

    // Se o telefone começar com código do país (55) ou DDD
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  const handleFinishBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber || !selectedTime || !clientName.trim() || !clientPhone.trim()) return;

    const newApp: Omit<Appointment, 'id'> = {
      org_id: org.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      service_id: selectedService.id,
      service_name: selectedService.name,
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.full_name,
      start_time: selectedTime,
      price: selectedService.price,
      status: 'scheduled',
      date: selectedDate,
    };

    const created = onAddAppointment(newApp);

    const fullApp: Appointment = (created && created.id) ? created : {
      ...newApp,
      id: 'app-' + Date.now(),
    };

    setLastCreatedAppointment(fullApp);
    setConfirmed(true);

    // Redireciona opcionalmente para o WhatsApp
    const waUrl = generateWhatsAppUrl(fullApp);
    try {
      window.open(waUrl, '_blank');
    } catch {
      // Bloqueio de popup gerenciado pelo botão na tela de confirmação
    }
  };

  return (
    <div className={`w-full ${isStandalone ? 'min-h-screen bg-[#070B14] py-8 px-4 flex items-center justify-center' : 'max-w-xl mx-auto py-4 animate-fadeIn'}`}>
      <div className="w-full max-w-lg">
        {/* BOTÃO DE RETORNO AO PAINEL (APENAS PARA O ADMINISTRADOR) */}
        {!isStandalone && onBackToAdmin && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onBackToAdmin}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Regressar ao Painel Admin
            </button>
            <span className="text-[11px] text-slate-500 font-mono">Modo Visualização do Cliente</span>
          </div>
        )}

        <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* CABEÇALHO DO SALÃO */}
          <div className="p-6 bg-gradient-to-b from-emerald-500/15 to-transparent border-b border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <Scissors className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{org.name}</h2>
            {org.address && (
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {org.address}
              </p>
            )}
            <p className="text-xs text-emerald-400 font-semibold mt-1">Agendamento Online Rápido</p>
          </div>

          {/* VERIFICAÇÃO SE HÁ SERVIÇOS E PROFISSIONAIS CADASTRADOS */}
          {activeServices.length === 0 || activeBarbers.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Barbearia em Configuração</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Este estabelecimento ainda está configurando os serviços e a equipe. Tente novamente em alguns minutos.
                </p>
              </div>
              {!isStandalone && onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Configurar no Painel
                </button>
              )}
            </div>
          ) : confirmed && lastCreatedAppointment ? (
            /* TELA DE SUCESSO E ENVIO AO WHATSAPP */
            <div className="p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Agendamento Confirmado!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Seu horário foi salvo com sucesso no sistema da barbearia.
                </p>
              </div>

              {/* CARD DETALHADO DO AGENDAMENTO */}
              <div className="bg-[#0B1120] p-5 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="text-white font-bold">{lastCreatedAppointment.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Serviço:</span>
                  <span className="text-white font-bold">{lastCreatedAppointment.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Barbeiro:</span>
                  <span className="text-white font-bold">{lastCreatedAppointment.barber_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data e Horário:</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">
                    {new Date((lastCreatedAppointment.date || selectedDate) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {lastCreatedAppointment.start_time}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-400">Valor:</span>
                  <span className="text-emerald-400 font-bold font-mono text-base">R$ {lastCreatedAppointment.price.toFixed(2)}</span>
                </div>
              </div>

              {/* BOTÃO EM DESTAQUE DO WHATSAPP DA BARBEARIA */}
              <div className="space-y-3 pt-2">
                <a
                  href={generateWhatsAppUrl(lastCreatedAppointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 text-sm"
                >
                  <MessageSquare className="w-5 h-5 fill-slate-950" />
                  Enviar no WhatsApp da Barbearia
                </a>

                <p className="text-[11px] text-slate-400">
                  Clique no botão acima para abrir o WhatsApp e avisar a barbearia sobre sua chegada.
                </p>

                <button
                  onClick={() => {
                    setConfirmed(false);
                    setStep(1);
                    setSelectedService(null);
                    setSelectedBarber(null);
                    setSelectedTime('');
                    setClientName('');
                    setClientPhone('');
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Fazer Outro Agendamento
                </button>
              </div>
            </div>
          ) : (
            /* PASSO A PASSO (1 a 5) */
            <div className="p-6 space-y-6">
              {/* ETAPA 1: DATA */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">1</span>
                      Escolha a Data
                    </h3>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {dateOptions.map((d) => {
                      const isSelected = selectedDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(d.dateStr);
                            setStep(2);
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                              : 'bg-[#0B1120] text-slate-300 border-slate-800 hover:border-emerald-500/50'
                          }`}
                        >
                          <span className="block text-[10px] opacity-75 font-mono uppercase">{d.weekday}</span>
                          <span className="block text-xs font-bold mt-0.5">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ETAPA 2: SERVIÇO */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                      Selecione o Serviço
                    </h3>
                    <button onClick={() => setStep(1)} className="text-xs text-emerald-400 hover:underline">
                      Alterar data
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activeServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setStep(3);
                        }}
                        className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex justify-between items-center transition-all group hover:bg-slate-950"
                      >
                        <div>
                          <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">{service.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> {service.duration_minutes} min • {service.category}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 font-mono">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 3: BARBEIRO */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">3</span>
                      Escolha o Profissional
                    </h3>
                    <button onClick={() => setStep(2)} className="text-xs text-emerald-400 hover:underline">
                      Alterar serviço
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {activeBarbers.map((barber) => (
                      <div
                        key={barber.id}
                        onClick={() => {
                          setSelectedBarber(barber);
                          setStep(4);
                        }}
                        className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center gap-3.5 transition-all group hover:bg-slate-950"
                      >
                        <img 
                          src={barber.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'} 
                          alt={barber.full_name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow" 
                        />
                        <div>
                          <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">{barber.full_name}</h4>
                          <p className="text-xs text-slate-400">{barber.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 4: HORÁRIO */}
              {step === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">4</span>
                      Escolha o Horário
                    </h3>
                    <button onClick={() => setStep(3)} className="text-xs text-emerald-400 hover:underline">
                      Alterar profissional
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Horários disponíveis para <strong className="text-white">{selectedBarber?.full_name}</strong> no dia <strong className="text-emerald-400">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong>:
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {timeSlots.map((time) => {
                      const isOccupied = appointments.some(
                        a => (a.date || selectedDate) === selectedDate && a.start_time === time && a.barber_id === selectedBarber?.id && a.status !== 'canceled'
                      );

                      return (
                        <button
                          key={time}
                          disabled={isOccupied}
                          onClick={() => {
                            setSelectedTime(time);
                            setStep(5);
                          }}
                          className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                            isOccupied
                              ? 'bg-[#0B1120]/40 text-slate-600 border-slate-900 cursor-not-allowed line-through'
                              : 'bg-[#0B1120] text-emerald-400 border-slate-800 hover:border-emerald-500 hover:bg-emerald-500/10'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ETAPA 5: DADOS DE CONTATO DO CLIENTE */}
              {step === 5 && (
                <form onSubmit={handleFinishBooking} className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">5</span>
                      Seus Dados de Contato
                    </h3>
                    <button type="button" onClick={() => setStep(4)} className="text-xs text-emerald-400 hover:underline">
                      Alterar horário
                    </button>
                  </div>

                  {/* Resumo da Escolha */}
                  <div className="bg-[#0B1120] p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">Serviço:</span> <strong className="text-white">{selectedService?.name}</strong> (R$ {selectedService?.price.toFixed(2)})</p>
                    <p><span className="text-slate-500">Profissional:</span> <strong className="text-white">{selectedBarber?.full_name}</strong></p>
                    <p><span className="text-slate-500">Data e Horário:</span> <strong className="text-emerald-400 font-mono">{selectedTime}</strong> no dia {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
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
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Seu WhatsApp (com DDD) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(84) 99999-0000"
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-slate-950" />
                    Confirmar Agendamento
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
