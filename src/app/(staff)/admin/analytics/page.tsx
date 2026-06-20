'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/lib/auth/context';
import { db } from '@/lib/db/dexie-db';
import { useRouter } from 'next/navigation';
import { BarChart3, Shield } from 'lucide-react';
import AnalyticsSummaryCards from '@/components/admin/analytics/AnalyticsSummaryCards';
import DemographicCharts from '@/components/admin/analytics/DemographicCharts';
import AttendanceFrequency from '@/components/admin/analytics/AttendanceFrequency';

export default function AdminAnalyticsPage() {
  const { role } = useAuth();
  const router = useRouter();

  const members = useLiveQuery(() => db.members.toArray(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);

  const { totalCheckins, activeToday, avgWeekly } = useMemo(() => {
    if (!checkins) return { totalCheckins: 0, activeToday: 0, avgWeekly: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkedIn = new Set<number>();
    let todayCount = 0;
    checkins.forEach((c) => {
      if (c.type === 'checkin') checkedIn.add(c.memberId);
      else if (c.type === 'checkout') checkedIn.delete(c.memberId);
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      if (d >= today) todayCount++;
    });
    const total = checkins.filter((c) => c.type === 'checkin').length;
    const weeks = Math.max(1, Math.ceil((Date.now() - Math.min(...checkins.map((c) =>
      (c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp)).getTime()
    ))) / (7 * 24 * 60 * 60 * 1000)));
    return { totalCheckins: total, activeToday: checkedIn.size, avgWeekly: total / weeks };
  }, [checkins]);

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.2)] flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#FF4D4D]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Accès réservé</h2>
          <p className="text-[#A8B2C7] mb-6">Seuls les administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white font-semibold shadow-lg shadow-[#0A84FF]/20 hover:shadow-xl transition-all">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">ANALYSES</h1>
          <p className="text-[#A8B2C7] text-sm">Statistiques démographiques et fréquentation</p>
        </div>
      </div>

      <AnalyticsSummaryCards
        totalMembers={members?.length || 0}
        totalCheckins={totalCheckins}
        activeToday={activeToday}
        avgWeekly={avgWeekly}
      />

      <DemographicCharts members={members || []} />

      <AttendanceFrequency checkins={checkins || []} />
    </div>
  );
}
