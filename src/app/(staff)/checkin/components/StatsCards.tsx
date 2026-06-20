'use client';

import type { Member, CheckIn } from '@/lib/db/dexie-db';

export default function StatsCards({ todayCheckins, members }: {
  todayCheckins: CheckIn[] | undefined;
  members: Member[] | undefined;
}) {
  const checkinTimes = todayCheckins?.filter(c => c.type === 'checkin').map(c => new Date(c.timestamp).getHours()) || [];
  const peakHour = checkinTimes.length > 0 ? checkinTimes.sort((a, b) => checkinTimes.filter(v => v === a).length - checkinTimes.filter(v => v === b).length).pop() : null;
  const memberStayDurations: number[] = [];
  const memberStayMap = new Map<number, { ci: number; co: number }[]>();
  todayCheckins?.forEach(c => {
    const ts = new Date(c.timestamp).getTime();
    if (!memberStayMap.has(c.memberId)) memberStayMap.set(c.memberId, []);
    const sessions = memberStayMap.get(c.memberId)!;
    if (c.type === 'checkin') sessions.push({ ci: ts, co: 0 });
    if (c.type === 'checkout') {
      const open = sessions.find(s => s.co === 0);
      if (open) open.co = ts;
    }
  });
  memberStayMap.forEach(sessions => {
    sessions.forEach(s => { if (s.ci && s.co) memberStayDurations.push(s.co - s.ci); });
  });
  const avgStayMinutes = memberStayDurations.length > 0
    ? Math.round(memberStayDurations.reduce((s, t) => s + t, 0) / memberStayDurations.length / 60000)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="bg-gray-800/50 rounded-lg p-2 text-center">
        <p className="text-xs text-gray-500">Pic d&apos;affluence</p>
        <p className="text-sm font-bold text-white">{peakHour !== null ? `${peakHour}h` : '-'}</p>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-2 text-center">
        <p className="text-xs text-gray-500">Séjour moyen</p>
        <p className="text-sm font-bold text-white">{avgStayMinutes > 0 ? `${Math.floor(avgStayMinutes / 60)}h${avgStayMinutes % 60}min` : '-'}</p>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-2 text-center">
        <p className="text-xs text-gray-500">Taux occupation</p>
        <p className="text-sm font-bold text-white">{members?.length ? `${(Math.max(0, new Set(todayCheckins?.filter(c => c.type === 'checkin').map(c => c.memberId)).size - new Set(todayCheckins?.filter(c => c.type === 'checkout').map(c => c.memberId)).size) / members.length * 100).toFixed(0)}%` : '-'}</p>
      </div>
    </div>
  );
}
