import React, { useState } from 'react';
import { Building2, Sparkles, Clock, MapPin, Phone } from 'lucide-react';
import { Organization } from '../types';
import { INITIAL_ORG, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS } from '../data/mockData';

interface AuthOnboardingViewProps {
  onComplete: (newOrg: Organization) => void;
  onLoadDemo?: (demoData: {
    org: Organization;
    services: typeof INITIAL_SERVICES;
    barbers: typeof INITIAL_BARBERS;
    appointments: typeof INITIAL_APPOINTMENTS;
  }) => void;
  onCancel?: () => void;
  hasExistingOrg?: boolean;
}

export const AuthOnboardingView: React.FC<AuthOnboardingViewProps> = ({
  onComplete,
  onLoadDemo,
  onCancel,
  hasExistingOrg = false,
}) => {
  const [salonName, setSalonName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openHour, setOpenHour] = useState('08:00');
  const [closeHour, setCloseHour] = useState('20:00');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSalonName(name);
    setSlug(generateSlug(name));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) return;

    const newOrg: Organization = {
      id: 'org-' + Date.now(),
      name: salonName.trim(),
      slug: slug.trim() || generateSlug(salonName),
      phone: phone.trim() || '(11) 99999-9999',
      address: address.trim() || undefined,
      primary_color: '#d97706',
      open_hour: openHour,
      close_hour: closeHour,
    };

    onComplete(newOrg);
  };

  return (
    <div className="max-w-xl mx-auto py-8 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Criar Sua Barbearia</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Configure seu estabelecimento do zero para gerenciar sua equipe, horários e disponibilizar agendamentos online.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              required
              value={salonName}
              onChange={handleNameChange}
              placeholder="Ex: Barbearia Dom Pedro"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Link Personalizado para Clientes (Slug) *
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 focus-within:border-amber-500 transition-colors">
              <span className="text-xs font-mono text-amber-500/80 select-none">agend.ai/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="minha-barbearia"
                className="w-full bg-transparent border-0 text-white py-3 text-sm focus:outline-none font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Este será o link público onde seus clientes agendarão horários.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" /> WhatsApp de Atendimento
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(84) 99999-0000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> Endereço / Localização
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua Central, 100 - Centro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Abre às
              </label>
              <input
                type="time"
                value={openHour}
                onChange={(e) => setOpenHour(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Fecha às
              </label>
              <input
                type="time"
                value={closeHour}
                onChange={(e) => setCloseHour(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-3 space-y-2.5">
            <button
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all text-sm shadow-lg shadow-amber-500/20"
            >
              Criar Barbearia e Acessar Painel
            </button>

            {hasExistingOrg && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Voltar ao painel atual
              </button>
            )}
          </div>
        </form>

        {onLoadDemo && (
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 mb-2">Quer apenas testar a plataforma?</p>
            <button
              type="button"
              onClick={() => {
                onLoadDemo({
                  org: INITIAL_ORG,
                  services: INITIAL_SERVICES,
                  barbers: INITIAL_BARBERS,
                  appointments: INITIAL_APPOINTMENTS,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-amber-400 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Carregar dados de exemplo (Demonstração)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
