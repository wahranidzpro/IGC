'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { MemberHeader } from '@/components/member/MemberHeader';
import { MemberInfo } from '@/components/member/MemberInfo';
import { MemberSubscription } from '@/components/member/MemberSubscription';
import { MemberPayments } from '@/components/member/MemberPayments';
import { MemberCheckins } from '@/components/member/MemberCheckins';
import { MemberStats } from '@/components/member/MemberStats';
import { MemberHabits } from '@/components/member/MemberHabits';
import { AIChatCoach } from '@/components/member/AIChatCoach';
import { Loader2, BarChart3, ChevronDown, ChevronUp, LogOut, Clock, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import Link from 'next/link';

function computeExpiryInfo(member: Member) {
  if (member.subscriptionType !== 'subscription' || !member.subscriptionDuration) return null;
  const durationDays: Record<string, number> = {
    '1_mois': 30, '2_mois': 60, '3_mois': 90, '6_mois': 180, '12_mois': 360,
  };
  const days = durationDays[member.subscriptionDuration];
  if (!days) return null;
  const created = new Date(member.createdAt);
  const expiry = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  const totalDays = days;
  const usedDays = Math.max(0, totalDays - daysLeft);
  const percentUsed = totalDays > 0 ? Math.min(100, Math.round((usedDays / totalDays) * 100)) : 0;
  return { expiry, daysLeft, totalDays, usedDays, percentUsed, isExpired: diff <= 0 };
}

export default function MemberProfilePage() {
  const { logout, role } = useAuth();
  const params = useParams();
  const nameSlug = params.slug as string;
  const [mounted, setMounted] = useState(false);
  const [showHabits, setShowHabits] = useState(false);

  const member = useLiveQuery(
    async () => {
      if (!nameSlug) return undefined;
      const namePart = nameSlug.toLowerCase().replace(/-/g, ' ');
      const words = namePart.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return undefined;
      const firstNameQuery = words[0];
      return await db.members
        .where('firstName')
        .startsWithIgnoreCase(firstNameQuery)
        .filter(m => {
          const fullName = `${m.firstName} ${m.lastName}`.toLowerCase().replace(/\s+/g, ' ');
          return fullName.includes(namePart);
        })
        .first();
    },
    [nameSlug]
  );

  const program = useLiveQuery(
    () => member?.programId ? db.programs.get(member.programId) : undefined,
    [member?.programId]
  );

  const expiryInfo = member ? computeExpiryInfo(member) : null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!nameSlug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-gray-400">Paramètre manquant</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
        <p className="text-gray-400">Membre non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{member.firstName} {member.lastName}</h1>
          {role === 'adherent' && expiryInfo && (
            <p className="text-sm text-gray-400 mt-1">
              {expiryInfo.isExpired ? "Abonnement expiré" : `Abonnement valide jusqu'au ${expiryInfo.expiry.toLocaleDateString('fr-FR')}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {role !== 'adherent' && (
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Subscription Expiry Banner */}
      {expiryInfo && (
        <div className={`max-w-6xl mx-auto mb-6 p-4 rounded-2xl border ${
          expiryInfo.isExpired
            ? 'bg-red-500/10 border-red-500/30'
            : expiryInfo.daysLeft <= 7
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              expiryInfo.isExpired ? 'bg-red-500/20' : expiryInfo.daysLeft <= 7 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
            }`}>
              {expiryInfo.isExpired
                ? <AlertTriangle className="w-6 h-6 text-red-400" />
                : expiryInfo.daysLeft <= 7
                ? <Clock className="w-6 h-6 text-amber-400" />
                : <CheckCircle className="w-6 h-6 text-emerald-400" />
              }
            </div>
            <div className="flex-1">
              <p className={`text-lg font-bold ${
                expiryInfo.isExpired ? 'text-red-400' : expiryInfo.daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {expiryInfo.isExpired
                  ? 'Abonnement expiré'
                  : expiryInfo.daysLeft <= 7
                  ? `Plus que ${expiryInfo.daysLeft} jour${expiryInfo.daysLeft > 1 ? 's' : ''} avant expiration`
                  : `Abonnement actif — ${expiryInfo.daysLeft} jours restants`
                }
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Expire le {expiryInfo.expiry.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tabular-nums text-white">{expiryInfo.daysLeft}</p>
              <p className="text-xs text-gray-400">jours</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expiryInfo.isExpired ? 'bg-red-500' : expiryInfo.daysLeft <= 7 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, expiryInfo.percentUsed)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with QR & RFID */}
        <MemberHeader member={member} />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <MemberInfo member={member} />
            <MemberSubscription member={member} program={program} />
            
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MemberStats memberId={member.id!} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MemberPayments memberId={member.id!} />
              <MemberCheckins memberId={member.id!} />
            </div>
          </div>
        </div>

        {/* Habits & Analytics Toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHabits(!showHabits)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Habitudes & Analytics</h3>
                <p className="text-sm text-gray-400">Durées, créneaux, régularité, achats · Export Excel</p>
              </div>
            </div>
            {showHabits ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {showHabits && (
            <div className="px-5 pb-5">
              <MemberHabits member={member} />
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Coach - Floating Button */}
      <AIChatCoach 
        memberId={member.id}
        memberName={member.firstName}
        memberGoal={member.fitnessGoal}
        memberLevel={member.experienceLevel}
        sessionsLeft={member.sessionsLeft}
      />
    </div>
  );
}