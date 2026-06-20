'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { CheckIn } from '@/lib/db/types';

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface AttendanceFrequencyProps {
  checkins: CheckIn[];
}

export default function AttendanceFrequency({ checkins }: AttendanceFrequencyProps) {
  const daily30 = useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    checkins.forEach((c) => {
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      const key = d.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, map.get(key)! + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => {
      const d = new Date(date);
      return { date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), count };
    });
  }, [checkins]);

  const weeklyDist = useMemo(() => {
    const counts = Array(7).fill(0);
    checkins.forEach((c) => {
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      counts[d.getDay()]++;
    });
    return DAY_LABELS_FR.map((day, i) => ({ day, count: counts[i] }));
  }, [checkins]);

  const monthlyTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    checkins.forEach((c) => {
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => {
      const [y, m] = key.split('-');
      return { month: `${MONTH_LABELS_FR[parseInt(m) - 1]} ${y.slice(2)}`, count };
    });
  }, [checkins]);

  const weekPart = useMemo(() => {
    let weekStart = 0, weekEnd = 0;
    checkins.forEach((c) => {
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      const day = d.getDay();
      if (day >= 1 && day <= 4) weekStart++;
      else if (day === 5 || day === 6 || day === 0) weekEnd++;
    });
    return [
      { name: 'Lun-Jeu', count: weekStart },
      { name: 'Ven-Dim', count: weekEnd },
    ];
  }, [checkins]);

  const monthPart = useMemo(() => {
    let firstHalf = 0, secondHalf = 0;
    checkins.forEach((c) => {
      const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
      if (d.getDate() <= 15) firstHalf++;
      else secondHalf++;
    });
    return [
      { name: '1-15', count: firstHalf },
      { name: '16-31', count: secondHalf },
    ];
  }, [checkins]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily attendance (30 days) */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] lg:col-span-2">
        <h3 className="text-white font-bold mb-1">Fréquentation Journalière</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Nombre de check-ins par jour (30 derniers jours)</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily30}>
            <defs>
              <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="#A8B2C7" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                      <p className="text-[#A8B2C7] text-xs font-semibold mb-1">{label}</p>
                      <p className="text-white font-bold text-lg">{payload[0].value} check-ins</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="count" stroke="#0A84FF" strokeWidth={2} fill="url(#dailyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly distribution */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Par Jour de la Semaine</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Total des check-ins par jour</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyDist}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(10,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly trend */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Tendance Mensuelle</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Évolution des check-ins par mois</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" stroke="#A8B2C7" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                      <p className="text-[#A8B2C7] text-xs font-semibold mb-1">{label}</p>
                      <p className="text-white font-bold text-lg">{payload[0].value} check-ins</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#monthlyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Week part vs Month part */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Début vs Fin de Semaine</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Lundi-Jeudi vs Vendredi-Dimanche</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekPart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(10,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" fill="#C89B3C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Début vs Fin de Mois</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">1-15 vs 16-31</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthPart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(10,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
