'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Member } from '@/lib/db/dexie-db';
import { calculateAge } from '@/lib/utils/date';

const AGE_GROUPS = ['-18', '18-25', '26-35', '36-49', '50+'] as const;
const GENDER_COLORS: Record<string, string> = { male: '#0A84FF', female: '#FF4D99', other: '#A8B2C7' };
const GENDER_LABELS: Record<string, string> = { male: 'Hommes', female: 'Femmes', other: 'Autre' };
const AGE_COLORS = ['#7C3AED', '#0A84FF', '#00D4FF', '#10B981', '#C89B3C'];

interface DemographicChartsProps {
  members: Member[];
}

export default function DemographicCharts({ members }: DemographicChartsProps) {
  const ageData = useMemo(() => {
    const buckets: Record<string, number> = { '-18': 0, '18-25': 0, '26-35': 0, '36-49': 0, '50+': 0 };
    members.forEach((m) => {
      const age = calculateAge(m.birthDate);
      const key = age < 18 ? '-18' : age <= 25 ? '18-25' : age <= 35 ? '26-35' : age <= 49 ? '36-49' : '50+';
      buckets[key]++;
    });
    return AGE_GROUPS.map((k) => ({ age: k, count: buckets[k] }));
  }, [members]);

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const g = m.gender === 'male' ? 'male' : m.gender === 'female' ? 'female' : 'other';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  const crossData = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    AGE_GROUPS.forEach((a) => { buckets[a] = { male: 0, female: 0, other: 0 }; });
    members.forEach((m) => {
      const age = calculateAge(m.birthDate);
      const ageKey = age < 18 ? '-18' : age <= 25 ? '18-25' : age <= 35 ? '26-35' : age <= 49 ? '36-49' : '50+';
      const gKey = m.gender === 'male' ? 'male' : m.gender === 'female' ? 'female' : 'other';
      buckets[ageKey][gKey]++;
    });
    return AGE_GROUPS.map((k) => ({ age: k, male: buckets[k].male, female: buckets[k].female, other: buckets[k].other }));
  }, [members]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Age distribution */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Répartition par Âge</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Distribution des membres par tranche d&apos;âge</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="age" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(10,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(12px)' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gender distribution */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-white font-bold mb-1">Répartition par Sexe</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Distribution hommes / femmes</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={genderData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}
            >
              {genderData.map((entry) => (
                <Cell key={entry.name} fill={GENDER_COLORS[entry.name] || '#A8B2C7'} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                      <p className="text-white font-bold text-lg">{payload[0].value}</p>
                      <p className="text-[#A8B2C7] text-xs">{payload[0].name}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          {genderData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GENDER_COLORS[entry.name] || '#A8B2C7' }} />
              <span className="text-sm text-[#A8B2C7]">{GENDER_LABELS[entry.name] || entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Age x Gender cross */}
      <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] lg:col-span-2">
        <h3 className="text-white font-bold mb-1">Âge × Sexe</h3>
        <p className="text-[#A8B2C7] text-xs mb-6">Répartition croisée âge et sexe</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={crossData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="age" stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A8B2C7" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-strong rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                      <p className="text-[#A8B2C7] text-xs font-semibold mb-1">{label} ans</p>
                      {payload.map((p: any) => (
                        <p key={p.name} className="text-white font-bold text-sm" style={{ color: p.color }}>
                          {GENDER_LABELS[p.name] || p.name}: {p.value}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="male" name="male" fill="#0A84FF" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="female" name="female" fill="#FF4D99" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="other" name="other" fill="#A8B2C7" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
