'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { MemberHabits } from '@/components/member/MemberHabits';
import { Search, BarChart3, ChevronRight, X, Clock, DollarSign, Trophy, Medal, RefreshCw, ExternalLink, Download, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

const RANK_COLORS = ['text-yellow-500', 'text-gray-300', 'text-orange-400'];

export default function MembersHabitsPage() {
  const { role, user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recurrence, setRecurrence] = useState<'all' | '7d' | '30d' | '90d'>('all');

  const members = useLiveQuery(() => 
    role === 'coach' && user?.coachId
      ? db.members.where('coachId').equals(user.coachId).toArray()
      : db.members.toArray(),
    [user?.coachId, role, refreshKey]
  );

  const allPayments = useLiveQuery(() => db.payments.toArray(), [refreshKey]);
  const allCheckins = useLiveQuery(() => db.checkins.toArray(), [refreshKey]);

  const cutDate = useMemo(() => {
    if (recurrence === 'all') return new Date(0);
    const d = new Date();
    d.setDate(d.getDate() - parseInt(recurrence));
    return d;
  }, [recurrence]);

  const filteredCheckins = useMemo(() => 
    (allCheckins || []).filter(c => new Date(c.timestamp) >= cutDate),
    [allCheckins, cutDate]
  );
  const filteredPayments = useMemo(() =>
    (allPayments || []).filter(p => new Date(p.date) >= cutDate),
    [allPayments, cutDate]
  );

  const memberMap = useMemo(() => {
    const map = new Map<number, Member>();
    (members || []).forEach(m => map.set(m.id!, m));
    return map;
  }, [members]);

  const topPayments = useMemo(() => {
    if (!filteredPayments || !members) return [];
    const totals = new Map<number, number>();
    for (const p of filteredPayments) totals.set(p.memberId, (totals.get(p.memberId) || 0) + p.amount);
    return Array.from(totals.entries())
      .map(([id, total]) => ({ id, total, member: memberMap.get(id) }))
      .filter(x => x.member)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredPayments, members, memberMap]);

  const topDuration = useMemo(() => {
    if (!filteredCheckins || !members) return [];
    const byMember = new Map<number, { checkin: Date | null; totalMin: number; sessions: number }>();
    const sorted = [...filteredCheckins].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (const c of sorted) {
      const t = (c.type as string).toLowerCase();
      if (!byMember.has(c.memberId)) byMember.set(c.memberId, { checkin: null, totalMin: 0, sessions: 0 });
      const entry = byMember.get(c.memberId)!;
      if (t === 'checkin' || t === 'in') {
        entry.checkin = new Date(c.timestamp);
      } else if ((t === 'checkout' || t === 'out') && entry.checkin) {
        const diff = (new Date(c.timestamp).getTime() - entry.checkin.getTime()) / 60000;
        if (diff > 0 && diff < 600) { entry.totalMin += diff; entry.sessions++; }
        entry.checkin = null;
      }
    }
    return Array.from(byMember.entries())
      .map(([id, data]) => ({ id, totalMin: Math.round(data.totalMin), avgMin: data.sessions > 0 ? Math.round(data.totalMin / data.sessions) : 0, member: memberMap.get(id) }))
      .filter(x => x.member && x.totalMin > 0)
      .sort((a, b) => b.totalMin - a.totalMin)
      .slice(0, 10);
  }, [filteredCheckins, members, memberMap]);

  const selectedMember = useMemo(() => 
    members?.find(m => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.toLowerCase().replace(/[\s\-\+\(\)]/g, '');
    return members.filter(m => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const phone = (m.phone || '').replace(/[\s\-\+\(\)]/g, '');
      return name.includes(q) || phone.includes(q);
    });
  }, [members, search]);

  const formatHours = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${String(m).padStart(2, '0')}`;
  };

  const rankColor = (i: number) => i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500';
  const rankIcon = (i: number) => i === 0 ? <Trophy className="w-4 h-4 text-yellow-400" /> : i === 1 ? <Medal className="w-4 h-4 text-gray-300" /> : i === 2 ? <Medal className="w-4 h-4 text-orange-400" /> : null;

  const exportAll = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const memberRows = (members || []).map(m => ({
      Prénom: m.firstName, Nom: m.lastName, Téléphone: m.phone, 'Date naissance': m.birthDate,
      Statut: m.status === 'active' ? 'Actif' : m.status === 'expired' ? 'Expiré' : 'Inactif',
      'Type abonnement': m.subscriptionType === 'subscription' ? 'Abonnement' : 'Séance libre',
      'Séances restantes': m.sessionsLeft, 'Points fidélité': m.fidelityPoints,
      'Total dépensé': allPayments?.filter(p => p.memberId === m.id).reduce((s, p) => s + p.amount, 0) || 0,
      'Sessions totales': allCheckins?.filter(c => c.memberId === m.id && c.type === 'checkin').length || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberRows), 'Membres');

    if (allCheckins) {
      const checkinRows = allCheckins.map(c => {
        const m = memberMap.get(c.memberId);
        return {
          Membre: m ? `${m.firstName} ${m.lastName}` : `#${c.memberId}`,
          Type: c.type === 'checkin' ? 'Entrée' : c.type === 'checkout' ? 'Sortie' : c.type,
          Date: new Date(c.timestamp).toLocaleDateString('fr-FR'),
          Heure: new Date(c.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checkinRows), 'Pointages');
    }

    if (allPayments) {
      const paymentRows = allPayments.map(p => {
        const m = memberMap.get(p.memberId);
        return {
          Membre: m ? `${m.firstName} ${m.lastName}` : `#${p.memberId}`,
          Montant: p.amount, Type: p.type, Mode: p.mode,
          Date: new Date(p.date).toLocaleDateString('fr-FR'),
          Description: p.description || '',
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Paiements');
    }

    XLSX.writeFile(wb, `InfinityGym_Tous_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [members, allCheckins, allPayments, memberMap]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-orange-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Habitudes & Analytics</h2>
            <p className="text-gray-400 text-sm">Durées, créneaux, régularité, achats · Analyse complète du comportement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Rafraîchir
          </button>
          <button onClick={exportAll} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm text-white transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Export tout
          </button>
        </div>
      </div>

      {/* Recurrence filter */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">Période :</span>
        {(['all', '7d', '30d', '90d'] as const).map(r => (
          <button key={r} onClick={() => setRecurrence(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${recurrence === r ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {r === 'all' ? 'Tout' : r === '7d' ? '7 jours' : r === '30d' ? '30 jours' : '90 jours'}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">
          {(filteredCheckins || []).length} pointages · {(filteredPayments || []).length} paiements
        </span>
      </div>

      {/* Top 10 Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Top 10 Payeurs</h3>
          </div>
          {topPayments.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-1">
              {topPayments.map((x, i) => (
                <button key={x.id} onClick={() => setSelectedMemberId(x.id)} className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/40 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 text-center text-xs font-bold ${rankColor(i)}`}>{rankIcon(i) || <span>{i + 1}</span>}</span>
                    <span className="text-sm text-white truncate">{x.member!.firstName} {x.member!.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs ${RANK_COLORS[i] || 'text-gray-500'}`}>{x.total.toLocaleString()} DA</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                  </div>
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-800/50 flex items-center justify-between text-xs text-gray-500">
                <span>Total période : {topPayments.reduce((s, x) => s + x.total, 0).toLocaleString()} DA</span>
                <span>{topPayments.length} membres</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Top 10 Durée en salle</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
              <span>Par séance</span>
              <span className="w-12 text-right">Total</span>
            </div>
          </div>
          {topDuration.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-1">
              {topDuration.map((x, i) => (
                <button key={x.id} onClick={() => setSelectedMemberId(x.id)} className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/40 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 text-center text-xs font-bold ${rankColor(i)}`}>{rankIcon(i) || <span>{i + 1}</span>}</span>
                    <span className="text-sm text-white truncate">{x.member!.firstName} {x.member!.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{formatHours(x.avgMin)}/séance</span>
                    <span className="text-xs font-semibold text-blue-400">{formatHours(x.totalMin)}</span>
                  </div>
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-800/50 flex items-center justify-between text-xs text-gray-500">
                <span>Total : {formatHours(topDuration.reduce((s, x) => s + x.totalMin, 0))}</span>
                <span>Moy. {formatHours(Math.round(topDuration.reduce((s, x) => s + x.avgMin, 0) / topDuration.length))}/séance</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:col-span-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Aucun membre trouvé</p>
            ) : (
              filtered.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id!)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    selectedMemberId === m.id
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    m.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    m.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {m.firstName[0]}{m.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{m.phone}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">{filtered.length} membre(s)</p>
        </div>

        {/* Analytics panel */}
        <div className="lg:col-span-2">
          {selectedMember ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedMember.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    selectedMember.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedMember.firstName} {selectedMember.lastName}</h3>
                    <p className="text-xs text-gray-500">{selectedMember.phone} · {selectedMember.status === 'active' ? 'Actif' : selectedMember.status === 'expired' ? 'Expiré' : 'Inactif'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/members/profile/${selectedMember.id!}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-orange-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Voir détaillée
                  </Link>
                  <button
                    onClick={() => setSelectedMemberId(null)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <MemberHabits member={selectedMember} />
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Sélectionnez un membre</h3>
              <p className="text-gray-600 text-sm max-w-md">
                Choisissez un membre dans la liste de gauche pour voir ses habitudes : 
                durée des sessions, créneaux préférés, régularité, achats, et export Excel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
