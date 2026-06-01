'use client';

import { useAuth } from '@/lib/auth/context';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function SubscriptionStatus() {
  const { accessStatus, checkAccess, user } = useAuth();

  if (!accessStatus || !user || !('role' in user)) return null;

  const role = (user as any).role;

  const getBadge = () => {
    if (!accessStatus) return null;
    if (accessStatus.granted) {
      return {
        icon: CheckCircle,
        label: 'Accès autorisé',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
      };
    }
    if (accessStatus.reason?.includes('PENDING')) {
      return {
        icon: Clock,
        label: 'Validation en attente',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
      };
    }
    if (accessStatus.reason?.includes('EXPIRED') || accessStatus.reason?.includes('SUBSCRIPTION')) {
      return {
        icon: AlertTriangle,
        label: 'Abonnement problématique',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
      };
    }
    return {
      icon: XCircle,
      label: 'Accès refusé',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    };
  };

  const badge = getBadge();
  if (!badge) return null;

  const BadgeIcon = badge.icon;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${badge.bg} ${badge.border}`}>
      <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
      <div className="flex-1">
        <p className={`text-xs font-medium ${badge.color}`}>{badge.label}</p>
        {role === 'adherent' && accessStatus?.message && (
          <p className="text-[10px] text-gray-500 mt-0.5">{accessStatus.message}</p>
        )}
      </div>
      <button
        onClick={() => checkAccess()}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        title="Rafraîchir le statut"
      >
        <RefreshCw className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    active: {
      icon: CheckCircle,
      label: 'Actif',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    expired: {
      icon: AlertTriangle,
      label: 'Expiré',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    suspended: {
      icon: XCircle,
      label: 'Suspendu',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    pending: {
      icon: Clock,
      label: 'En attente',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  };

  const cfg = config[status] || config.pending;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}
