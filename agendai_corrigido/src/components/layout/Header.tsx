import React, { useState } from 'react';
import { Scissors, Share2, Check, ExternalLink, Bell, Smartphone, Copy } from 'lucide-react';
import { Organization } from '../../types';

interface HeaderProps {
  org: Organization | null;
  onOpenSidebar?: () => void;
  onNavigateToBooking?: () => void;
  pendingAppointmentsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  org, 
  onNavigateToBooking,
  pendingAppointmentsCount = 0 
}) => {
  const [copied, setCopied] = useState(false);

  const publicLink = org ? `${window.location.origin}/#/agendar/${org.slug}` : '';

  const handleCopyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B1120]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 md:py-3.5 shadow-md">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* LADO ESQUERDO: LOGO E NOME DO SALÃO */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-sm shadow-emerald-500/10 shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
          <div className="truncate max-w-[160px] sm:max-w-xs">
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight truncate">
              {org ? org.name : 'AgendAI'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online 24h
            </p>
          </div>
        </div>

        {/* LADO DIREITO: BOTÃO LINK DO CLIENTE E STATUS */}
        <div className="flex items-center gap-2">
          {org && (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all active:scale-95"
              title="Copiar link de agendamento do cliente"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="text-[11px] sm:text-xs">{copied ? 'Link Copiado!' : 'Link Cliente'}</span>
            </button>
          )}

          {onNavigateToBooking && (
            <button
              onClick={onNavigateToBooking}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center transition-colors active:scale-95"
              title="Ver página de agendamento do cliente"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
