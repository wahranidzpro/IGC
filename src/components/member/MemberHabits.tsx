'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { Download, Clock, Calendar, TrendingUp, ShoppingCart, Award, Zap, DoorOpen, DollarSign, AlertTriangle } from 'lucide-react';

interface MemberHabitsProps {
  member: Member;
}


const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SLOTS = [
  { label: 'Matin (6h-10h)', key: 'matin', icon: '🌅', start: 6, end: 10 },
  { label: 'Midi (10h-14h)', key: 'midi', icon: '☀️', start: 10, end: 14 },
  { label: 'Après-midi (14h-18h)', key: 'aprem', icon: '🌤️', start: 14, end: 18 },
  { label: 'Soirée (18h-22h)', key: 'soir', icon: '🌙', start: 18, end: 22 },
];

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#ef4444', '#14b8a6'];

export function MemberHabits({ member }: MemberHabitsProps) {
  const allCheckins = useLiveQuery(() =>
    db.checkins.where('memberId').equals(member.id!).reverse().toArray(), [member.id]);

  const allPayments = useLiveQuery(() =>
    db.payments.where('memberId').equals(member.id!).reverse().toArray(), [member.id]);

  const [now] = useState(() => Date.now());

  // --- Pair checkin/checkout by date ---
  const sessions = useMemo(() => {
    if (!allCheckins || allCheckins.length === 0) return [];
    const byDate = new Map<string, { checkin: Date; checkout: Date | null }>();

    const sorted = [...allCheckins].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const c of sorted) {
      const dateKey = new Date(c.timestamp).toISOString().split('T')[0];
      const type = (c.type as string).toLowerCase();

      if (type === 'checkin' || type === 'in') {
        byDate.set(dateKey, { checkin: new Date(c.timestamp), checkout: null });
      } else if (type === 'checkout' || type === 'out') {
        const existing = byDate.get(dateKey);
        if (existing && !existing.checkout) {
          existing.checkout = new Date(c.timestamp);
        } else if (!existing) {
          byDate.set(dateKey, { checkin: new Date(c.timestamp), checkout: new Date(c.timestamp) });
        }
      }
    }

    return Array.from(byDate.entries()).map(([date, pair]) => ({
      date,
      checkin: pair.checkin,
      checkout: pair.checkout,
      durationMinutes: pair.checkout ? Math.round((pair.checkout.getTime() - pair.checkin.getTime()) / 60000) : 0,
    })).filter(s => s.durationMinutes > 0 || s.checkout === null);
  }, [allCheckins]);

  const validSessions = sessions.filter(s => s.checkout !== null);

  // --- Stats durée ---
  const durationStats = useMemo(() => {
    if (validSessions.length === 0) return { avg: 0, min: 0, max: 0, total: 0, count: 0 };
    const durations = validSessions.map(s => s.durationMinutes);
    return {
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: durations.reduce((a, b) => a + b, 0),
      count: durations.length,
    };
  }, [validSessions]);

  // --- Créneaux horaires préférés ---
  const slotDistribution = useMemo(() => {
    const slots: Record<string, number> = { matin: 0, midi: 0, aprem: 0, soir: 0 };
    for (const s of validSessions) {
      const hour = s.checkin.getHours();
      for (const slot of SLOTS) {
        if (hour >= slot.start && hour < slot.end) {
          slots[slot.key]++;
          break;
        }
      }
    }
    return SLOTS.map(s => ({ ...s, count: slots[s.key] }));
  }, [validSessions]);

  // --- Jours préférés ---
  const dayDistribution = useMemo(() => {
    const days: Record<string, number> = {};
    for (const s of validSessions) {
      const dayName = DAYS_FR[s.checkin.getDay()];
      days[dayName] = (days[dayName] || 0) + 1;
    }
    return DAYS_FR.map(d => ({ day: d, count: days[d] || 0 }));
  }, [validSessions]);

  // --- Streak ---
  const streak = useMemo(() => {
    if (validSessions.length === 0) return { current: 0, longest: 0 };
    const dates = [...new Set(validSessions.map(s => s.date))].sort();
    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === dates.length - 1) currentStreak = tempStreak;
      } else {
        tempStreak = 1;
        if (i === dates.length - 1) currentStreak = 1;
      }
    }
    if (dates.length === 1) { currentStreak = 1; longestStreak = 1; }
    return { current: currentStreak, longest: longestStreak };
  }, [validSessions]);

  // --- Achats ---
  const purchaseStats = useMemo(() => {
    if (!allPayments) return { total: 0, count: 0, products: 0, subscriptions: 0, avgPerMonth: 0 };
    const total = allPayments.reduce((s, p) => s + p.amount, 0);
    const products = allPayments.filter(p => p.type === 'product').length;
    const subscriptions = allPayments.filter(p => p.type === 'subscription').length;
    const monthsActive = Math.max(1, Math.ceil((now - new Date(member.createdAt).getTime()) / (30 * 86400000)));
    return {
      total,
      count: allPayments.length,
      products,
      subscriptions,
      avgPerMonth: Math.round(total / monthsActive),
    };
  }, [allPayments, member.createdAt, now]);

  // --- Top produits achetés ---
  const topProducts = useMemo(() => {
    if (!allPayments) return [];
    const productPayments = allPayments.filter(p => p.type === 'product');
    const counts: Record<string, { qty: number; amount: number }> = {};
    for (const p of productPayments) {
      const name = p.description || 'Produit';
      if (!counts[name]) counts[name] = { qty: 0, amount: 0 };
      counts[name].qty++;
      counts[name].amount += p.amount;
    }
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [allPayments]);

  // --- Export ---
  const exportData = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Sessions
    const sessionRows = sessions.map(s => ({
      Date: s.date,
      'Entrée': s.checkin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      'Sortie': s.checkout ? s.checkout.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non sorti',
      'Durée (min)': s.durationMinutes,
      'Durée (h)': s.checkout ? (s.durationMinutes / 60).toFixed(1) : '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionRows), 'Sessions');

    // Sheet 2: Paiements
    if (allPayments) {
      const paymentRows = allPayments.map(p => ({
        Date: new Date(p.date).toLocaleDateString('fr-FR'),
        Montant: p.amount,
        Type: p.type === 'subscription' ? 'Abonnement' : p.type === 'product' ? 'Produit' : p.type,
        Mode: p.mode === 'cash' ? 'Espèces' : p.mode === 'card' ? 'Carte' : p.mode,
        Description: p.description || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Paiements');
    }

    // Sheet 3: Résumé
    const summary = [
      ['Membre', `${member.firstName} ${member.lastName}`],
      ['Téléphone', member.phone],
      ['Statut', member.status === 'active' ? 'Actif' : member.status === 'expired' ? 'Expiré' : 'Inactif'],
      ['Abonnement', member.subscriptionType === 'subscription' ? 'Abonnement' : 'Séance libre'],
      ['Créé le', new Date(member.createdAt).toLocaleDateString('fr-FR')],
      ['', ''],
      ['Sessions totales', durationStats.count],
      ['Heures totales', (durationStats.total / 60).toFixed(1)],
      ['Durée moyenne', `${Math.floor(durationStats.avg / 60)}h${durationStats.avg % 60}min`],
      ['Plus longue', `${Math.floor(durationStats.max / 60)}h${durationStats.max % 60}min`],
      ['Plus courte', `${Math.floor(durationStats.min / 60)}h${durationStats.min % 60}min`],
      ['', ''],
      ['Plus longue série', `${streak.longest} jours`],
      ['Série actuelle', `${streak.current} jours`],
      ['', ''],
      ['Total dépensé', `${purchaseStats.total} DA`],
      ['Paiements total', purchaseStats.count],
      ['Moyenne/mois', `${purchaseStats.avgPerMonth} DA`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.map(([k, v]) => ({ Métrique: k, Valeur: v }))), 'Résumé');

    XLSX.writeFile(wb, `InfinityGym_${member.firstName}_${member.lastName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-400" />
          Habitudes & Analyse
        </h3>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all text-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HabitCard icon={<DoorOpen className="w-5 h-5" />} label="Sessions" value={durationStats.count.toString()} color="text-blue-400" bg="bg-blue-500/20" />
        <HabitCard icon={<Clock className="w-5 h-5" />} label="Heures totales" value={(durationStats.total / 60).toFixed(1)} color="text-green-400" bg="bg-green-500/20" sub={formatDuration(durationStats.avg) + ' en moyenne'} />
        <HabitCard icon={<Award className="w-5 h-5" />} label="Meilleure série" value={`${streak.longest}j`} color="text-orange-400" bg="bg-orange-500/20" sub={streak.current > 1 ? `${streak.current}j en cours` : ''} />
        <HabitCard icon={<DollarSign className="w-5 h-5" />} label="Dépensé total" value={`${purchaseStats.total.toLocaleString()} DA`} color="text-purple-400" bg="bg-purple-500/20" sub={`${purchaseStats.avgPerMonth.toLocaleString()} DA/mois`} />
      </div>

      {/* Tendance évolution */}
      <div className="bg-gray-800/50 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" /> Tendance des sessions
        </h4>
        {(() => {
          const months: Record<string, { mois: string; sessions: number; heures: number }> = {};
          for (const s of validSessions) {
            const key = s.date.slice(0, 7);
            if (!months[key]) months[key] = { mois: key, sessions: 0, heures: 0 };
            months[key].sessions++;
            months[key].heures += s.durationMinutes / 60;
          }
          const data = Object.values(months).slice(-12);
          if (data.length > 0) {
            return (
              <div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mois" tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v) => { const [y, m] = v.split('-'); return `${m}/${y.slice(2)}`; }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: unknown, n: unknown) => [n === 'sessions' ? `${v} sessions` : `${Number(v).toFixed(1)}h`, n === 'sessions' ? 'Sessions' : 'Heures'] as any} />
                    <Area type="monotone" dataKey="sessions" stroke="#f97316" fill="url(#trendGradient)" strokeWidth={2} />
                    <Line type="monotone" dataKey="heures" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-end gap-4 mt-1 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> Sessions</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed" /> Heures</span>
                </div>
              </div>
            );
          }
          return <p className="text-gray-500 text-sm text-center py-8">Pas assez de données</p>;
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Durée des sessions */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" /> Durée des sessions
          </h4>
          {validSessions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Moyenne</p>
                  <p className="text-lg font-bold text-white">{formatDuration(durationStats.avg)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Max</p>
                  <p className="text-lg font-bold text-green-400">{formatDuration(durationStats.max)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Min</p>
                  <p className="text-lg font-bold text-blue-400">{formatDuration(durationStats.min)}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={validSessions.slice(-14).map(s => ({
                  label: s.date.slice(5),
                  duree: Math.round(s.durationMinutes / 5) * 5,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(v: unknown) => [formatDuration(Number(v) || 0), 'Durée'] as any} />
                  <Bar dataKey="duree" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 text-center">14 dernières sessions</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune session complète</p>
          )}
        </div>

        {/* Créneaux horaires */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Créneaux préférés
          </h4>
          {slotDistribution.some(s => s.count > 0) ? (
            <div className="space-y-3">
              {slotDistribution.map(slot => {
                const maxCount = Math.max(...slotDistribution.map(s => s.count), 1);
                const pct = (slot.count / maxCount) * 100;
                return (
                  <div key={slot.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{slot.icon} {slot.label}</span>
                      <span className={`font-bold ${slot.count > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{slot.count}×</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>

        {/* Jours préférés */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-400" /> Jours de fréquentation
          </h4>
          {dayDistribution.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dayDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]}>
                  {dayDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>

        {/* Top achats */}
        <div className="bg-gray-800/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-purple-400" /> Achats fréquents
          </h4>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 p-2 bg-gray-900/30 rounded-lg">
                  <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.qty}× achat(s)</p>
                  </div>
                  <span className="text-sm font-bold text-green-400">{p.amount.toLocaleString()} DA</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun achat enregistré</p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between text-sm">
            <span className="text-gray-400">Total achats</span>
            <span className="font-bold text-white">{purchaseStats.products} produit(s)</span>
            <span className="font-bold text-green-400">{allPayments?.filter(p => p.type === 'product').reduce((s, p) => s + p.amount, 0).toLocaleString() || 0} DA</span>
          </div>
        </div>
      </div>

      {/* Dernière session info */}
      {validSessions.length > 0 && (
        <div className="bg-gray-800/30 rounded-xl p-4 flex items-center gap-4 text-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <span className="text-gray-300">
            <strong>Dernière visite :</strong> {new Date(validSessions[validSessions.length - 1].checkin).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}<strong>Durée :</strong> {formatDuration(validSessions[validSessions.length - 1].durationMinutes)}
            {' · '}<strong>Créneau :</strong> {validSessions[validSessions.length - 1].checkin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}

function HabitCard({ icon, label, value, color, bg, sub }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; sub?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
