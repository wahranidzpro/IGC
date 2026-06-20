'use client';

import { Calendar, Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Member, Program } from '@/lib/db/dexie-db';

interface MemberSubscriptionProps {
  member: Member;
  program?: Program;
}

export function MemberSubscription({ member, program }: MemberSubscriptionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-yellow-400';
      case 'expired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      '1_mois': '1 mois',
      '2_mois': '2 mois',
      '3_mois': '3 mois',
      '6_mois': '6 mois',
      '12_mois': '12 mois',
    };
    return labels[duration] || duration;
  };

  const getSubscriptionLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Abonnement';
      case 'free_session': return 'Session gratuite';
      default: return type;
    }
  };

  // Calculate progress
  const totalSessions = member.sessionsLeft + (member.programAmount ? Math.round(member.programAmount / 100 * 10) : 0);
  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-orange-400" />
        </span>
        Mon Abonnement
      </h3>

      <div className="space-y-4">
        {/* Program */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Programme</p>
              <p className="text-white font-medium">{program?.name || 'Non défini'}</p>
            </div>
          </div>
          <span className={`font-bold ${getStatusColor(member.status)}`}>
            {member.status === 'active' ? '✓ Actif' : member.status === 'inactive' ? '⚠ Inactif' : '✕ Expiré'}
          </span>
        </div>

        {/* Duration & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">Type</p>
            </div>
            <p className="text-white font-medium">{getSubscriptionLabel(member.subscriptionType)}</p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">Durée</p>
            </div>
            <p className="text-white font-medium">{member.subscriptionDuration ? getDurationLabel(member.subscriptionDuration) : '-'}</p>
          </div>
        </div>

        {/* Sessions Progress */}
        <div className="p-4 bg-gray-800/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Sessions restantes</span>
            <span className="text-white font-bold">{member.sessionsLeft} / {totalSessions || 24}</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - (member.sessionsLeft / (totalSessions || 24) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {member.sessionsLeft > 10 ? '👍 Plenty de sessions restantes' : 
             member.sessionsLeft > 0 ? '⚠️ Bientôt besoin de renouvellement' : 
             '❌ Plus de sessions - Renouvellement nécessaire'}
          </p>
        </div>

        {/* Financial */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">Montant</p>
            </div>
            <p className="text-white font-bold">{member.programAmount || 0} DA</p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">Payé</p>
            </div>
            <p className="text-green-400 font-bold">{member.amountPaid || 0} DA</p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-red-400" />
              <p className="text-xs text-gray-400">Reste</p>
            </div>
            <p className="text-red-400 font-bold">{member.balanceDue || 0} DA</p>
          </div>
        </div>

        {/* Advance */}
        {member.advance > 0 && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-xs text-green-400">Avance disponible</p>
            <p className="text-white font-bold">{member.advance} DA</p>
          </div>
        )}
      </div>
    </div>
  );
}