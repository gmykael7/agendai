import React, { useState, useMemo } from 'react';
import { 
  Scissors, CheckCircle, Clock, Calendar, 
  MapPin, Phone, MessageSquare, ArrowLeft, User, 
  Sparkles, Check, ChevronRight, AlertCircle, Share2, Plus, CheckSquare, Square
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
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
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

  // Serviços ativos
  const activeServices = useMemo(() => {
    return services.filter(s => s.active !== false);
  }, [services]);

  // Barbeiros ativos
  const activeBarbers = useMemo(() => {
    return barbers.filter(b => b.active !== false);
  }, [barbers]);

  // Totais calculados dos serviços selecionados
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.duration_minutes || 30), 0);
  }, [selectedServices]);

  // Alternar seleção de serviço (suporte a múltiplos serviços)
  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Gerar link direto do WhatsApp da Barbearia com a mensagem formatada incluindo todos os serviços
  const generateWhatsAppUrl = (app: Appointment) => {
    const cleanPhone = (org.phone || '').replace(/\D/g, '');
    const formattedSelectedDate = new Date((app.date || selectedDate) + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const servicesListText = app.services && app.services.length > 0
      ? app.services.map(s => `• ${s.name} - R$ ${s.price.toFixed(2)} (${s.duration_minutes} min)`).join('
')
      : `• ${app.service_name} - R$ ${app.price.toFixed(2)}`;

    const message = encodeURIComponent(
      `💈 *NOVO AGENDAMENTO ONLINE - ${org.name.toUpperCase()}*

` +
      `👤 *Cliente:* ${app.client_name}
` +
      `📱 *WhatsApp:* ${app.client_phone}

` +
      `✂️ *Serviços Agendados (${app.services?.length || 1}):*
` +
      `${servicesListText}

` +
      `💰 *Valor Total:* R$ ${app.price.toFixed(2)} (${app.duration_minutes || totalDuration} min)
` +
      `💈 *Profissional:* ${app.barber_name}
` +
      `📅 *Data:* ${formattedSelectedDate}
` +
      `⏰ *Horário:* às ${app.start_time}

` +
      `_Agendamento registrado no sistema AgendAI._`
    );

    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  const handleFinishBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !selectedBarber || !selectedTime || !clientName.trim() || !clientPhone.trim()) return;

    const joinedNames = selectedServices.map(s => s.name).join(' + ');

    const newApp: Omit<Appointment, 'id'> = {
      org_id: org.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      service_id: selectedServices[0]?.id || '',
      service_name: joinedNames,
      services: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration_minutes: s.duration_minutes || 30,
        category: s.category,
      })),
      duration_minutes: totalDuration,
      barber_id: selectedBarber.id,
      barber_name: selectedBarber.full_name,
      start_time: selectedTime,
      price: totalPrice,
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

    const waUrl = generateWhatsAppUrl(fullApp);
    try {
      window.open(waUrl, '_blank');
    } catch {
      // Popup bloqueado gerenciado pelo botão
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
                  Seu pedido com {lastCreatedAppointment.services?.length || 1} serviço(s) foi salvo no sistema da barbearia.
                </p>
              </div>

              {/* CARD DETALHADO DO AGENDAMENTO */}
              <div className="bg-[#0B1120] p-5 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="text-white font-bold">{lastCreatedAppointment.client_name}</span>
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

                {/* LISTA DE SERVIÇOS INCLUSOS */}
                <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
                  <span className="text-slate-400 font-semibold block">Serviços Selecionados:</span>
                  {lastCreatedAppointment.services && lastCreatedAppointment.services.length > 0 ? (
                    lastCreatedAppointment.services.map((srv, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                        <span>• {srv.name} <span className="text-[10px] text-slate-500">({srv.duration_minutes} min)</span></span>
                        <span className="font-mono font-bold text-white">R$ {srv.price.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center text-slate-300">
                      <span>• {lastCreatedAppointment.service_name}</span>
                      <span className="font-mono font-bold text-white">R$ {lastCreatedAppointment.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-slate-800/80 pt-2.5">
                  <div>
                    <span className="text-slate-400 block">Total a Pagar:</span>
                    <span className="text-[11px] text-slate-500">Duração aprox: {lastCreatedAppointment.duration_minutes || totalDuration} min</span>
                  </div>
                  <span className="text-emerald-400 font-black font-mono text-lg">R$ {lastCreatedAppointment.price.toFixed(2)}</span>
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
                  Clique no botão acima para abrir o WhatsApp e avisar a barbearia sobre sua reserva.
                </p>

                <button
                  onClick={() => {
                    setConfirmed(false);
                    setStep(1);
                    setSelectedServices([]);
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

              {/* ETAPA 2: SERVIÇOS (MÚLTIPLA ESCOLHA) */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                        Selecione os Serviços
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Você pode selecionar mais de um serviço para o mesmo horário.
                      </p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs text-emerald-400 hover:underline shrink-0">
                      Alterar data
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {activeServices.map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);

                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleService(service)}
                          className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all group ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm'
                              : 'bg-[#0B1120] border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                                : 'border-slate-700 bg-slate-900 text-transparent group-hover:border-slate-500'
                            }`}>
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>

                            <div>
                              <h4 className={`font-bold text-sm transition-colors ${
                                isSelected ? 'text-emerald-300' : 'text-white group-hover:text-emerald-400'
                              }`}>
                                {service.name}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" /> {service.duration_minutes} min • {service.category}
                              </p>
                            </div>
                          </div>

                          <span className={`text-sm font-bold font-mono px-3 py-1 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            R$ {service.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* BARRA DE RESUMO E AVANÇO */}
                  {selectedServices.length > 0 ? (
                    <div className="bg-[#0B1120] p-4 rounded-2xl border border-emerald-500/30 space-y-3 pt-3">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{selectedServices.length} serviço(s) selecionado(s)</span>
                          <p className="text-[11px] text-slate-400">Duração estimada: {totalDuration} min</p>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Total</span>
                          <span className="text-base font-black text-emerald-400 font-mono">R$ {totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        Continuar para Escolha do Barbeiro
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-amber-400/90 py-2">
                      👆 Clique em um ou mais serviços acima para continuar.
                    </p>
                  )}
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
                      Alterar serviços ({selectedServices.length})
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
                      Escolha o Horário de Início
                    </h3>
                    <button onClick={() => setStep(3)} className="text-xs text-emerald-400 hover:underline">
                      Alterar profissional
                    </button>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span>Profissional: <strong className="text-white">{selectedBarber?.full_name}</strong></span>
                    <span className="text-emerald-400 font-medium">Tempo previsto: {totalDuration} min</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Horários para <strong className="text-emerald-400">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong>:
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
                      Seus Dados & Resumo do Pedido
                    </h3>
                    <button type="button" onClick={() => setStep(4)} className="text-xs text-emerald-400 hover:underline">
                      Alterar horário
                    </button>
                  </div>

                  {/* Resumo dos Serviços Escolhidos */}
                  <div className="bg-[#0B1120] p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5 text-slate-300">
                    <p><span className="text-slate-500">Profissional:</span> <strong className="text-white">{selectedBarber?.full_name}</strong></p>
                    <p><span className="text-slate-500">Data e Horário:</span> <strong className="text-emerald-400 font-mono">{selectedTime}</strong> no dia {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>

                    <div className="border-t border-slate-800/80 pt-2 space-y-1">
                      <span className="text-slate-400 font-semibold block">Serviços Inclusos ({selectedServices.length}):</span>
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between text-xs py-0.5">
                          <span className="text-white">• {s.name} ({s.duration_minutes} min)</span>
                          <span className="text-emerald-400 font-mono font-bold">R$ {s.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold">
                      <span className="text-slate-300">Total ({totalDuration} min):</span>
                      <span className="text-emerald-400 font-mono text-sm">R$ {totalPrice.toFixed(2)}</span>
                    </div>
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
                    Confirmar Agendamento (R$ {totalPrice.toFixed(2)})
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
