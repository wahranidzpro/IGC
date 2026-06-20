'use client';

import { useMemo } from 'react';
import AdminStatsCard from '@/components/admin/AdminStatsCard';
import { Users, Activity, Calendar, TrendingUp } from 'lucide-react';

interface AnalyticsSummaryCardsProps {
  totalMembers: number;
  totalCheckins: number;
  activeToday: number;
  avgWeekly: number;
}

export default function AnalyticsSummaryCards({
  totalMembers, totalCheckins, activeToday, avgWeekly,
}: AnalyticsSummaryCardsProps) {
  const cards = useMemo(() => [
    { label: 'Membres Total', value: totalMembers, icon: Users, color: 'blue' as const },
    { label: 'Check-ins Total', value: totalCheckins, icon: Activity, color: 'green' as const },
    { label: 'Présents Aujourd\'hui', value: activeToday, icon: Calendar, color: 'turquoise' as const },
    { label: 'Moyenne / Semaine', value: avgWeekly.toFixed(1), icon: TrendingUp, color: 'gold' as const },
  ], [totalMembers, totalCheckins, activeToday, avgWeekly]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <AdminStatsCard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
      ))}
    </div>
  );
}
