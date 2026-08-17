import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Organization } from '../types';

interface AuthOnboardingViewProps {
  onComplete: (newOrg: Organization) => void;
  onCancel: () => void;
}

export const AuthOnboardingView: React.FC<AuthOnboardingViewProps> = ({
  onComplete,
  onCancel
}) => {
  const [salonName, setSalonName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName || !slug) return;

    onComplete({
      id: 'org-' + Date.now(),
      name: salonName,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      phone: phone || '(11) 90000-0000',
      primary_color: '#d97706'
    });
  };

  return (
    <div className="max-w-md mx-auto py-8 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Registar Nova Barbearia</h2>
          <p className="text-xs text-slate-400">Crie a sua conta no AgendAI para começar a gerir a sua agenda.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Estabelecimento</label>
            <input
              type="text"
              required
              value={salonName}
              onChange={(e) => {
                setSalonName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              placeholder="Ex: Barbearia Dom Pedro"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Link Exclusivo (Slug)</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-500">
              <span>agend.ai/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-transparent border-0 text-white py-3 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Telefone WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 98888-8888"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors text-sm"
            >
              Criar Conta e Entrar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Voltar ao painel atual
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
