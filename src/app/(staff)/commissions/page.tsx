'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { Fragment } from 'react';
import {
  DollarSign, Percent, TrendingUp, Users,
  Search, ChevronDown, ChevronUp, Calendar,
  Check, Save, Clock,
  ShoppingBag, Dumbbell, UserPlus,
  Receipt, BadgeCheck
} from 'lucide-react';

interface CommissionRates {
  productSales: number;
  privateCoaching: number;
  newMember: number;
}

const DEFAULT_RATES: CommissionRates = {
  productSales: 10,
  privateCoaching: 30,
  newMember: 500,
};

interface CommissionItem {
  id: string;
  type: 'product' | 'coaching' | 'new_member';
  date: string;
  label: string;
  amount: number;
  commission: number;
  paid: boolean;
}

interface CoachCommission {
  coachId: number;
  coachName: string;
  productSalesTotal: number;
  productCommission: number;
  coachingSessionsCount: number;
  coachingCommission: number;
  newMembersCount: number;
  newMemberCommission: number;
  totalCommission: number;
  paidAmount: number;
  status: 'paid' | 'pending';
  items: CommissionItem[];
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CommissionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [expandedCoachId, setExpandedCoachId] = useState<number | null>(null);
  const [rates, setRates] = useState<CommissionRates>(DEFAULT_RATES);
  const [ratesSaved, setRatesSaved] = useState(false);

  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const allMembers = useLiveQuery(() => db.members.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const completedSessions = useLiveQuery(
    () => db.privateSessions.where('status').equals('completed').toArray(),
    []
  );

  useEffect(() => {
    (async () => {
      const entry = await db.settings.where('key').equals('commission_rates').first();
      if (entry) {
        try { setRates(JSON.parse(entry.value)); }
        catch { /* keep defaults */ }
      }
    })();
  }, []);

  const monthStart = useMemo(() => new Date(selectedMonth + '-01'), [selectedMonth]);

  const monthEnd = useMemo(() => {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    return d;
  }, [monthStart]);

  const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);

  const monthPayments = useMemo(() =>
    (payments || []).filter(p => {
      const d = new Date(p.date);
      return d >= monthStart && d <= monthEnd;
    }),
    [payments, monthStart, monthEnd]
  );

  const commissionPayments = useMemo(() =>
    monthPayments.filter(p => (p as any).type === 'commission'),
    [monthPayments]
  );

  const paidItemsByCoach = useMemo(() => {
    const map = new Map<number, Set<string>>();
    for (const cp of commissionPayments) {
      const coachId = cp.memberId;
      if (!map.has(coachId)) map.set(coachId, new Set());
      const desc = cp.description || '';
      try {
        const parsed = JSON.parse(desc);
        if (parsed.items && Array.isArray(parsed.items)) {
          for (const itemId of parsed.items) map.get(coachId)!.add(itemId);
        }
      } catch {
        if (desc.startsWith('item:')) map.get(coachId)!.add(desc.slice(5));
      }
    }
    return map;
  }, [commissionPayments]);

  const paidAmountByCoach = useMemo(() => {
    const map = new Map<number, number>();
    for (const cp of commissionPayments) {
      const coachId = cp.memberId;
      map.set(coachId, (map.get(coachId) || 0) + cp.amount);
    }
    return map;
  }, [commissionPayments]);

  const membersByCoachId = useMemo(() => {
    const map = new Map<number, typeof allMembers>();
    if (!allMembers) return map;
    for (const m of allMembers) {
      if (m.coachId) {
        const list = map.get(m.coachId) || [];
        list.push(m);
        map.set(m.coachId, list);
      }
    }
    return map;
  }, [allMembers]);

  const breakdown = useMemo((): CoachCommission[] => {
    if (!coaches || !payments || !completedSessions || !allMembers) return [];
    return coaches.map(coach => {
      const cid = coach.id!;
      const coachMembers = membersByCoachId.get(cid) || [];
      const coachMemberIds = new Set(coachMembers.map(m => m.id));
      const paidIds = paidItemsByCoach.get(cid) || new Set();

      const productPayments = monthPayments.filter(p =>
        (p as any).type === 'product' && coachMemberIds.has(p.memberId)
      );
      const productSalesTotal = productPayments.reduce((s, p) => s + p.amount, 0);
      const productCommission = productSalesTotal * (rates.productSales / 100);

      const coachSessions = (completedSessions || []).filter(s =>
        s.coachId === cid && new Date(s.date) >= monthStart && new Date(s.date) <= monthEnd
      );
      const coachingSessionsCount = coachSessions.length;
      const coachingCommission = coachSessions.reduce((s, sess) => s + sess.price * (rates.privateCoaching / 100), 0);

      const newMembers = coachMembers.filter(m =>
        new Date(m.createdAt) >= monthStart && new Date(m.createdAt) <= monthEnd
      );
      const newMembersCount = newMembers.length;
      const newMemberCommission = newMembersCount * rates.newMember;

      const totalCommission = productCommission + coachingCommission + newMemberCommission;
      const paidAmount = paidAmountByCoach.get(cid) || 0;
      const status: 'paid' | 'pending' =
        paidAmount >= totalCommission && totalCommission > 0 ? 'paid' : 'pending';

      const items: CommissionItem[] = [];
      for (const pp of productPayments) {
        const itemId = `product-${pp.id}`;
        items.push({
          id: itemId,
          type: 'product',
          date: new Date(pp.date).toISOString().slice(0, 10),
          label: `Vente produit${pp.description ? ' - ' + pp.description : ''}`,
          amount: pp.amount,
          commission: pp.amount * (rates.productSales / 100),
          paid: paidIds.has(itemId),
        });
      }
      for (const cs of coachSessions) {
        const itemId = `coaching-${cs.id}`;
        items.push({
          id: itemId,
          type: 'coaching',
          date: cs.date,
          label: `Session: ${cs.memberName}`,
          amount: cs.price,
          commission: cs.price * (rates.privateCoaching / 100),
          paid: paidIds.has(itemId),
        });
      }
      for (const nm of newMembers) {
        const itemId = `newmember-${nm.id}`;
        items.push({
          id: itemId,
          type: 'new_member',
          date: new Date(nm.createdAt).toISOString().slice(0, 10),
          label: `${nm.firstName} ${nm.lastName}`,
          amount: 0,
          commission: rates.newMember,
          paid: paidIds.has(itemId),
        });
      }

      return {
        coachId: cid,
        coachName: coach.name,
        productSalesTotal,
        productCommission,
        coachingSessionsCount,
        coachingCommission,
        newMembersCount,
        newMemberCommission,
        totalCommission,
        paidAmount,
        status,
        items,
      };
    });
  }, [coaches, payments, completedSessions, allMembers, membersByCoachId,
      monthPayments, paidItemsByCoach, paidAmountByCoach, monthStart, monthEnd, rates]);

  const filtered = useMemo(() => {
    let result = breakdown;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.coachName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    return result;
  }, [breakdown, search, statusFilter]);

  const summary = useMemo(() => {
    const totalCommissions = breakdown.reduce((s, c) => s + c.totalCommission, 0);
    const totalPaid = breakdown.reduce((s, c) => s + c.paidAmount, 0);
    const totalPending = totalCommissions - totalPaid;
    return { totalCommissions, totalPaid, totalPending };
  }, [breakdown]);

  const handleSaveRates = async () => {
    const existing = await db.settings.where('key').equals('commission_rates').first();
    const value = JSON.stringify(rates);
    if (existing) {
      await db.settings.update(existing.id!, { value } as any);
    } else {
      await db.settings.add({ key: 'commission_rates', value });
    }
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2000);
  };

  const handlePayCommission = async (coachId: number, total: number) => {
    const coachData = breakdown.find(c => c.coachId === coachId);
    const itemIds = coachData?.items.map(i => i.id) || [];
    await db.payments.add({
      memberId: coachId,
      amount: total,
      type: 'commission',
      mode: 'cash',
      date: new Date(),
      description: JSON.stringify({ month: selectedMonth, items: itemIds }),
      createdAt: new Date(),
    } as any);
  };

  const handlePayItem = async (coachId: number, item: CommissionItem) => {
    const existingPayments = commissionPayments.filter(cp => cp.memberId === coachId);
    let updated = false;
    for (const ep of existingPayments) {
      try {
        const desc = JSON.parse(ep.description || '{}');
        if (desc.month === selectedMonth && Array.isArray(desc.items)) {
          desc.items.push(item.id);
          await db.payments.update(ep.id!, { description: JSON.stringify(desc) } as any);
          updated = true;
          break;
        }
      } catch { /* skip */ }
    }
    if (!updated) {
      await db.payments.add({
        memberId: coachId,
        amount: item.commission,
        type: 'commission',
        mode: 'cash',
        date: new Date(),
        description: JSON.stringify({ month: selectedMonth, items: [item.id] }),
        createdAt: new Date(),
      } as any);
    }
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case 'product': return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'coaching': return <Dumbbell className="w-4 h-4 text-purple-400" />;
      case 'new_member': return <UserPlus className="w-4 h-4 text-green-400" />;
      default: return <Receipt className="w-4 h-4 text-gray-400" />;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case 'product': return 'Vente produit';
      case 'coaching': return 'Coaching privé';
      case 'new_member': return 'Nouvel adhérent';
      default: return t;
    }
  };

  const monthLabel = `${MONTHS_FR[monthStart.getMonth()]} ${monthStart.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Commissions</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Gestion des commissions des coaches — {monthLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-48 pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total commissions</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalCommissions.toLocaleString()} DA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Payées</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{summary.totalPaid.toLocaleString()} DA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">En attente</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{summary.totalPending.toLocaleString()} DA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Mois en cours</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {isCurrentMonth ? summary.totalCommissions.toLocaleString() : '…'} DA
          </p>
          {!isCurrentMonth && (
            <p className="text-xs text-gray-600 mt-0.5">Sélectionner le mois actuel</p>
          )}
        </div>
      </div>

      {/* Commission rates card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Taux de commission</h2>
          </div>
          <button
            onClick={handleSaveRates}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {ratesSaved ? (
              <><Check className="w-4 h-4" /> Sauvegardé</>
            ) : (
              <><Save className="w-4 h-4" /> Sauvegarder</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Ventes produits (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={rates.productSales}
                onChange={e => setRates({ ...rates, productSales: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Coaching privé (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={rates.privateCoaching}
                onChange={e => setRates({ ...rates, privateCoaching: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
          Nouvel adhérent (DA)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={rates.newMember}
                onChange={e => setRates({ ...rates, newMember: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un coach..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'paid' ? 'Payés' : 'En attente'}
            </button>
          ))}
        </div>
      </div>

      {/* Per-coach breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune commission pour cette période</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Coach</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Ventes produits</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Coaching privé</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Nouveaux membres</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Total commission</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Payé</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Statut</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const isExpanded = expandedCoachId === c.coachId;
                  return (
                    <Fragment key={c.coachId}>
                      <tr
                        onClick={() => setExpandedCoachId(isExpanded ? null : c.coachId)}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                              {c.coachName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <span className="font-medium text-white">{c.coachName}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{c.productSalesTotal.toLocaleString()} DA</div>
                          <div className="text-xs text-orange-400">+{c.productCommission.toLocaleString()} DA</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{c.coachingSessionsCount} séances</div>
                          <div className="text-xs text-orange-400">+{c.coachingCommission.toLocaleString()} DA</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{c.newMembersCount} membres</div>
                          <div className="text-xs text-orange-400">+{c.newMemberCommission.toLocaleString()} DA</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-lg font-bold text-orange-400">{c.totalCommission.toLocaleString()} DA</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={c.paidAmount > 0 ? 'text-green-400 font-medium' : 'text-gray-500'}>
                            {c.paidAmount > 0 ? `${c.paidAmount.toLocaleString()} DA` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              En attente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status === 'pending' && c.totalCommission > 0 && (
                              <button
                                onClick={e => { e.stopPropagation(); handlePayCommission(c.coachId, c.totalCommission); }}
                                className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition-colors whitespace-nowrap"
                              >
                                Marquer payé
                              </button>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedCoachId(isExpanded ? null : c.coachId); }}
                              className="px-3 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
                            >
                              Voir détail
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail panel */}
                      {isExpanded && (
                        <tr key={`detail-${c.coachId}`}>
                          <td colSpan={8} className="px-4 py-0 bg-gray-950/50">
                            <div className="py-4 space-y-3">
                              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-orange-400" />
                                Détail des commissions — {c.coachName}
                              </h4>
                              {c.items.length === 0 ? (
                                <p className="text-sm text-gray-600 py-2">Aucune transaction pour cette période</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[500px]">
                                    <thead>
                                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-3 py-2">Date</th>
                                        <th className="text-left px-3 py-2">Type</th>
                                        <th className="text-left px-3 py-2">Description</th>
                                        <th className="text-right px-3 py-2">Montant</th>
                                        <th className="text-right px-3 py-2">Commission</th>
                                        <th className="text-center px-3 py-2">Statut</th>
                                        <th className="text-right px-3 py-2">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {c.items.map(item => (
                                        <tr key={item.id} className="border-t border-gray-800/50">
                                          <td className="px-3 py-2.5 text-sm text-gray-400 whitespace-nowrap">{item.date}</td>
                                          <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-1.5 text-sm">
                                              {typeIcon(item.type)}
                                              <span className="text-gray-400">{typeLabel(item.type)}</span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2.5 text-sm text-white">{item.label}</td>
                                          <td className="px-3 py-2.5 text-sm text-right text-white">
                                            {item.amount > 0 ? `${item.amount.toLocaleString()} DA` : '-'}
                                          </td>
                                          <td className="px-3 py-2.5 text-sm text-right text-orange-400 font-medium">
                                            {item.commission.toLocaleString()} DA
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            {item.paid ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                                <BadgeCheck className="w-3 h-3" /> Payé
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                                                <Clock className="w-3 h-3" /> En attente
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            {!item.paid && (
                                              <button
                                                onClick={() => handlePayItem(c.coachId, item)}
                                                className="px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition-colors"
                                              >
                                                Payer
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
