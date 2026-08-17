import React, { useState } from 'react';
import { User, Scissors } from 'lucide-react';

interface BarberAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BarberAvatar: React.FC<BarberAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-sm',
    lg: 'w-14 h-14 rounded-2xl text-base',
    xl: 'w-16 h-16 rounded-2xl text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  // Se tiver URL de imagem válida e não tiver dado erro no carregamento
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} object-cover border border-slate-700 shadow shrink-0 ${className}`}
      />
    );
  }

  // Ícone de perfil padrão (sem ser foto de pessoa humana)
  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-sm shrink-0 ${className}`}
      title={name}
    >
      <User className={`${iconSizes[size]} text-amber-400`} />
    </div>
  );
};
