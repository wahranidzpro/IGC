'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member, Coach, Program, CheckIn } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import {
  Database, Search, Filter, User, Phone, Mail, MapPin, Activity, Fingerprint, Clock,
  ChevronDown, ChevronRight, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Users, ShoppingCart, BarChart3, Package, DollarSign, Dumbbell, Calendar,
  ChevronLeft, CreditCard, Hash, Syringe,
  Ruler, Weight, Target, FileText, Star, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPhoneDisplay } from '@/lib/whatsapp';

type Tab = 'members' | 'pos' | 'audit';

const DURATION_LABELS: Record<string, string> = {
  '1_mois': '1 mois',
  '2_mois': '2 mois',
  '3_mois': '3 mois',
  '6_mois': '6 mois',
  '12_mois': '12 mois',
};

const DURATION_DAYS: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 360,
};

function formatDate(d: Date | string | undefined): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR');
}

function formatDateTime(d: Date | string | undefined): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function calcAge(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function expiryDate(member: Member): Date | null {
  if (member.subscriptionType !== 'subscription' || !member.subscriptionDuration) return null;
  const days = DURATION_DAYS[member.subscriptionDuration];
  if (!days) return null;
  return new Date(new Date(member.createdAt).getTime() + days * 86400000);
}

function computeMemberStatus(member: Member): { status: 'active' | 'expired' | 'inactive'; label: string; color: string; bg: string } {
  if (member.isBlocked) {
    if (!member.blockedUntil) return { status: 'active', label: 'BANNI', color: 'text-red-400', bg: 'bg-black border border-red-500/30' };
    return { status: 'active', label: 'BLOQUÉ', color: 'text-red-400', bg: 'bg-red-500/20' };
  }
  if (member.subscriptionType === 'free_session') {
    const active = (member.sessionsLeft || 0) > 0;
    return active
      ? { status: 'active', label: 'Actif', color: 'text-green-400', bg: 'bg-green-500/20' }
      : { status: 'expired', label: 'Expiré', color: 'text-red-400', bg: 'bg-red-500/20' };
  }
  if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
    const expiry = expiryDate(member);
    if (!expiry) return { status: 'inactive', label: 'Inactif', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    const now = new Date();
    if (expiry.getTime() <= now.getTime()) return { status: 'expired', label: 'Expiré', color: 'text-red-400', bg: 'bg-red-500/20' };
    return { status: 'active', label: 'Actif', color: 'text-green-400', bg: 'bg-green-500/20' };
  }
  if (member.status === 'inactive') return { status: 'inactive', label: 'Inactif', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  return { status: 'inactive', label: 'Inactif', color: 'text-gray-400', bg: 'bg-gray-500/20' };
}

function getSubscriptionLabel(member: Member): string {
  if (member.subscriptionType === 'free_session') return `Séance libre (${member.sessionsLeft || 0})`;
  if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
    const label = DURATION_LABELS[member.subscriptionDuration] || member.subscriptionDuration;
    const expiry = expiryDate(member);
    if (expiry) return `${label} · J-${Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000))}`;
    return label;
  }
  return '-';
}

interface AuditResult {
  type: 'warning' | 'error' | 'info';
  message: string;
  details: string;
}

export default function AdminDatabasePage() {
  const { role } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Members tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive' | 'blocked'>('all');
  const [sortField, setSortField] = useState<'name' | 'phone' | 'status' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [memberCheckins, setMemberCheckins] = useState<Record<number, CheckIn[]>>({});
  const [loadingCheckins, setLoadingCheckins] = useState<Record<number, boolean>>({});
  const PAGE_SIZE = 15;

  // Audit state
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);

  // POS state
  const [posAnalysis, setPosAnalysis] = useState<{
    topProducts: { id: number; name: string; qty: number; revenue: number; rank: number }[];
    salesByDay: Record<string, { count: number; revenue: number }>;
    totalRevenue: number;
    totalSales: number;
    totalItems: number;
    totalTransactions: number;
    averagePerTransaction: number;
    lowStockProducts: { id?: number; name: string; stock: number }[];
  } | null>(null);

  // Live queries
  const allMembers = useLiveQuery(() => db.members.toArray(), []);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const programs = useLiveQuery(() => db.programs.toArray(), []);

  // Filtering & sorting members
  const filteredMembers = useMemo(() => {
    if (!allMembers) return [];
    let list = [...allMembers];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(m =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.rfidCode && m.rfidCode.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'active') list = list.filter(m => !m.isBlocked && computeMemberStatus(m).status === 'active');
    else if (statusFilter === 'expired') list = list.filter(m => computeMemberStatus(m).status === 'expired');
    else if (statusFilter === 'inactive') list = list.filter(m => m.status === 'inactive' && !m.isBlocked);
    else if (statusFilter === 'blocked') list = list.filter(m => m.isBlocked);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      else if (sortField === 'phone') cmp = a.phone.localeCompare(b.phone);
      else if (sortField === 'status') cmp = computeMemberStatus(a).label.localeCompare(computeMemberStatus(b).label);
      else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allMembers, searchTerm, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const pagedMembers = filteredMembers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleExpand = useCallback(async (memberId: number) => {
    if (expandedMemberId === memberId) {
      setExpandedMemberId(null);
      return;
    }
    setExpandedMemberId(memberId);
    if (!memberCheckins[memberId]) {
      setLoadingCheckins(prev => ({ ...prev, [memberId]: true }));
      const checkins = await db.checkins
        .where('memberId').equals(memberId)
        .reverse()
        .limit(10)
        .toArray();
      setMemberCheckins(prev => ({ ...prev, [memberId]: checkins }));
      setLoadingCheckins(prev => ({ ...prev, [memberId]: false }));
    }
  }, [expandedMemberId, memberCheckins]);

  function getLastCheckin(memberId: number): Date | null {
    const checkins = memberCheckins[memberId];
    if (!checkins || checkins.length === 0) return null;
    const cin = checkins.filter(c => c.type === 'checkin');
    if (cin.length === 0) return null;
    return new Date(Math.max(...cin.map(c => c.timestamp.getTime())));
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
          <p>Seuls les administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg">Retour</button>
        </div>
      </div>
    );
  }

  // --- AUDIT ---
  const doAudit = useCallback(async () => {
    setLoading(true);
    setStatus('Analyse de la base de données...');
    const results: AuditResult[] = [];

    try {
      const members = await db.members.toArray();
      const payments = await db.payments.toArray();
      const checkins = await db.checkins.toArray();
      const sales = await db.sales.toArray();

      const phones = members.map(m => m.phone);
      const dupPhones = phones.filter((p, i) => phones.indexOf(p) !== i);
      if (dupPhones.length > 0) {
        results.push({ type: 'error', message: `Doublons téléphone détectés`, details: `${dupPhones.length} numéros en double` });
      } else {
        results.push({ type: 'info', message: 'Aucun doublon téléphone', details: 'Tous les numéros sont uniques' });
      }

      const emails = members.filter(m => m.email).map(m => m.email);
      const dupEmails = emails.filter((e, i) => emails.indexOf(e) !== i);
      if (dupEmails.length > 0) {
        results.push({ type: 'warning', message: `${dupEmails.length} email(s) en double`, details: 'Des membres partagent la même adresse email' });
      }

      const rfids = members.filter(m => m.rfidCode).map(m => m.rfidCode);
      const dupRfids = rfids.filter((r, i) => rfids.indexOf(r) !== i);
      if (dupRfids.length > 0) {
        results.push({ type: 'error', message: `${dupRfids.length} code(s) RFID en double`, details: 'Doublons critiques pour le check-in' });
      }

      const memberIds = new Set(members.map(m => m.id));
      const orphanPayments = payments.filter(p => !memberIds.has(p.memberId));
      if (orphanPayments.length > 0) {
        results.push({ type: 'error', message: `${orphanPayments.length} paiements orphelins`, details: 'Paiements sans membre correspondant' });
      }

      const orphanCheckins = checkins.filter(c => !memberIds.has(c.memberId));
      if (orphanCheckins.length > 0) {
        results.push({ type: 'error', message: `${orphanCheckins.length} checkins orphelins`, details: 'Check-ins sans membre correspondant' });
      }

      const negBalance = members.filter(m => m.balanceDue && m.balanceDue < 0);
      if (negBalance.length > 0) {
        results.push({ type: 'warning', message: `${negBalance.length} membre(s) avec solde négatif`, details: 'BalanceDue négative détectée' });
      }

      const memberCheckinIds = new Set(checkins.map(c => c.memberId));
      const noCheckinMembers = members.filter(m => !memberCheckinIds.has(m.id!));
      if (noCheckinMembers.length > 0) {
        results.push({ type: 'warning', message: `${noCheckinMembers.length} membre(s) sans aucun check-in`, details: 'Membres sans historique d\'accès' });
      }

      const checkinCount = checkins.filter(c => c.type === 'checkin').length;
      const checkoutCount = checkins.filter(c => c.type === 'checkout').length;
      if (checkinCount !== checkoutCount) {
        results.push({ type: 'info', message: `Déséquilibre check-in/out`, details: `${checkinCount} entrées vs ${checkoutCount} sorties` });
      }

      const badSales = sales.filter(s => s.total <= 0);
      if (badSales.length > 0) {
        results.push({ type: 'error', message: `${badSales.length} vente(s) avec total nul/négatif`, details: 'Anomalie dans les ventes POS' });
      }

      const expiredWithSessions = members.filter(m => m.status === 'expired' && m.sessionsLeft > 0);
      if (expiredWithSessions.length > 0) {
        results.push({ type: 'warning', message: `${expiredWithSessions.length} membre(s) expirés avec séances restantes`, details: 'Incohérence statut/sessions' });
      }

      const now = new Date();
      const yearAgo = new Date(now.getTime() - 365 * 86400000);
      const activeWithoutRecentPayments = members.filter(m => {
        if (m.status !== 'active' || m.createdAt > yearAgo) return false;
        const hasRecentPayment = payments.some(p => p.memberId === m.id && new Date(p.date) > yearAgo);
        return !hasRecentPayment;
      });
      if (activeWithoutRecentPayments.length > 0) {
        results.push({ type: 'warning', message: `${activeWithoutRecentPayments.length} membre(s) actifs sans paiement depuis 1 an`, details: 'Activité suspecte' });
      }

      const permBanned = members.filter(m => m.isBlocked && !m.blockedUntil);
      results.push({ type: 'info', message: `${permBanned.length} membre(s) bannis permanents`, details: 'isBlocked=true sans blockedUntil' });

      const tempBanned = members.filter(m => m.isBlocked && m.blockedUntil && m.blockedUntil > now);
      results.push({ type: 'info', message: `${tempBanned.length} membre(s) bannis temporairement`, details: 'Blocage avec date future' });

      const bannis = members.filter(m => m.isBlocked);
      const checkedOut = members.filter(m => m.status === 'inactive');
      results.push({ type: 'info', message: `Statistiques globales`, details: `${members.length} membres · ${payments.length} paiements · ${checkins.length} checkins · ${sales.length} ventes POS` });
      results.push({ type: 'info', message: `Répartition membres`, details: `Actifs: ${members.filter(m => m.status === 'active' && !m.isBlocked).length} · Expirés: ${members.filter(m => m.status === 'expired').length} · Bannis: ${bannis.length} · Inactifs: ${checkedOut.length}` });

      setAuditResults(results);
      setStatus(`Audit terminé : ${results.length} points analysés`);
    } catch (err) {
      setStatus('Erreur audit: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
    setLoading(false);
  }, []);

  // --- POS ANALYSIS ---
  const doPosAnalysis = useCallback(async () => {
    setLoading(true);
    setStatus('Analyse des ventes POS 7 jours...');
    try {
      const products = await db.products.toArray();
      const sales = await db.sales.toArray();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const weekSales = sales.filter(s => new Date(s.createdAt) >= weekAgo);

      const productSales: Record<number, { name: string; qty: number; revenue: number }> = {};
      let totalRevenue = 0;
      let totalItems = 0;
      let totalTransactions = weekSales.length;

      for (const sale of weekSales) {
        totalRevenue += sale.total;
        for (const item of sale.items) {
          totalItems += item.qty;
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
          }
          productSales[item.productId].qty += item.qty;
          productSales[item.productId].revenue += item.qty * item.price;
        }
      }

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.qty - a.qty)
        .slice(0, 10)
        .map(([id, data], i) => ({ rank: i + 1, id: Number(id), ...data }));

      const salesByDay: Record<string, { count: number; revenue: number }> = {};
      for (let d = 0; d < 7; d++) {
        const day = new Date(now.getTime() - d * 86400000);
        const key = day.toLocaleDateString('fr-FR');
        salesByDay[key] = { count: 0, revenue: 0 };
      }
      for (const sale of weekSales) {
        const key = new Date(sale.createdAt).toLocaleDateString('fr-FR');
        if (salesByDay[key]) {
          salesByDay[key].count++;
          salesByDay[key].revenue += sale.total;
        }
      }

      setPosAnalysis({
        totalRevenue,
        totalSales: totalTransactions,
        totalItems,
        totalTransactions,
        averagePerTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        topProducts,
        salesByDay,
        lowStockProducts: products.filter(p => p.stock <= 10),
      });

      setStatus(`Analyse POS terminée : ${totalTransactions} transactions, ${totalRevenue.toLocaleString()} DA, ${topProducts.length} produits`);
    } catch (err) {
      setStatus('Erreur POS: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
    setLoading(false);
  }, []);

  const tabContent = (tab: Tab) => {
    switch (tab) {
      case 'members':
        return (
          <div className="space-y-4">
            {/* Search + Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, email, RFID..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'all', label: `Tous (${allMembers?.length || 0})` },
                  { key: 'active', label: `Actifs (${allMembers?.filter(m => !m.isBlocked && computeMemberStatus(m).status === 'active').length || 0})` },
                  { key: 'expired', label: `Expirés (${allMembers?.filter(m => computeMemberStatus(m).status === 'expired').length || 0})` },
                  { key: 'inactive', label: `Inactifs (${allMembers?.filter(m => m.status === 'inactive' && !m.isBlocked).length || 0})` },
                  { key: 'blocked', label: `Blacklist (${allMembers?.filter(m => m.isBlocked).length || 0})` },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setStatusFilter(f.key); setPage(0); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      statusFilter === f.key
                        ? f.key === 'blocked' ? 'bg-black text-red-400 border border-red-500' :
                          f.key === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          f.key === 'expired' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          f.key === 'inactive' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="w-8 px-2 py-3"></th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-orange-400 select-none" onClick={() => handleSort('name')}>
                        Membre {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-orange-400 select-none hidden md:table-cell" onClick={() => handleSort('phone')}>
                        Téléphone {sortField === 'phone' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Email</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500">Abonnement</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-orange-400 select-none hidden xl:table-cell" onClick={() => handleSort('createdAt')}>
                        Inscription {sortField === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-orange-400 select-none" onClick={() => handleSort('status')}>
                        Statut {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Dernière activité</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">RFID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">Aucun membre trouvé</td>
                      </tr>
                    ) : (
                      pagedMembers.map((m) => {
                        const statusInfo = computeMemberStatus(m);
                        const isExpanded = expandedMemberId === m.id;
                        const lastCheckin = getLastCheckin(m.id!);
                        return (
                          <>
                            <tr
                              key={m.id}
                              onClick={() => toggleExpand(m.id!)}
                              className={`border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/40 transition-colors ${isExpanded ? 'bg-gray-800/60' : ''}`}
                            >
                              <td className="px-2 py-3 text-center">
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-orange-400 mx-auto" />
                                  : <ChevronRight className="w-4 h-4 text-gray-600 mx-auto" />
                                }
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-700">
                                    {m.photo ? (
                                      <img src={m.photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-full h-full p-2 text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {m.firstName} {m.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{calcAge(m.birthDate)} ans · {m.gender === 'male' ? 'Homme' : m.gender === 'female' ? 'Femme' : 'Autre'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-gray-600" />
                                  <span className="text-sm text-gray-300">{formatPhoneDisplay(m.phone)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 hidden lg:table-cell">
                                {m.email ? (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-gray-600" />
                                    <span className="text-sm text-gray-400 truncate max-w-[150px]">{m.email}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-600">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-white">{getSubscriptionLabel(m)}</span>
                                  {m.sessionsLeft > 0 && (
                                    <span className="text-[10px] text-gray-500">{m.sessionsLeft} séance{m.sessionsLeft > 1 ? 's' : ''} restante{m.sessionsLeft > 1 ? 's' : ''}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 hidden xl:table-cell">
                                <span className="text-sm text-gray-400">{formatDate(m.createdAt)}</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-3 py-3 hidden lg:table-cell">
                                {lastCheckin ? (
                                  <span className="text-sm text-gray-400">{formatDate(lastCheckin)}</span>
                                ) : (
                                  <span className="text-sm text-gray-600">Jamais</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center hidden sm:table-cell">
                                {m.rfidCode ? (
                                  <div className="flex items-center justify-center" title={m.rfidCode}>
                                    <Fingerprint className="w-4 h-4 text-green-500" />
                                  </div>
                                ) : (
                                  <Fingerprint className="w-4 h-4 text-gray-600 mx-auto" />
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${m.id}-detail`}>
                                <td colSpan={9} className="px-0 py-0">
                                  <div className="bg-gray-800/40 border-b border-gray-800/50 px-6 py-5">
                                    {loadingCheckins[m.id!] ? (
                                      <div className="flex items-center gap-2 text-gray-500 py-4">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Chargement...</span>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left: Member Info */}
                                        <div className="space-y-4">
                                          <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden border border-gray-700 flex-shrink-0">
                                              {m.photo ? (
                                                <img src={m.photo} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                <User className="w-full h-full p-3 text-gray-500" />
                                              )}
                                            </div>
                                            <div>
                                              <h4 className="text-base font-semibold text-white">{m.firstName} {m.lastName}</h4>
                                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                                                <span>{calcAge(m.birthDate)} ans</span>
                                                <span>{m.gender === 'male' ? 'Homme' : 'Femme'}</span>
                                                {m.bloodType && <span>{m.bloodType}</span>}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                              <Phone className="w-3.5 h-3.5 text-gray-600" />
                                              <span className="text-gray-300">{formatPhoneDisplay(m.phone)}</span>
                                            </div>
                                            {m.email && (
                                              <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-gray-600" />
                                                <span className="text-gray-400 truncate">{m.email}</span>
                                              </div>
                                            )}
                                            <div className="flex items-center gap-2 col-span-2">
                                              <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                                              <span className="text-gray-400 truncate">{m.address}</span>
                                            </div>
                                            {m.bloodType && (
                                              <div className="flex items-center gap-2">
                                                <Syringe className="w-3.5 h-3.5 text-gray-600" />
                                                <span className="text-gray-300">Groupe: {m.bloodType}</span>
                                              </div>
                                            )}
                                            {m.weight && (
                                              <div className="flex items-center gap-2">
                                                <Weight className="w-3.5 h-3.5 text-gray-600" />
                                                <span className="text-gray-300">{m.weight} kg</span>
                                              </div>
                                            )}
                                            {m.height && (
                                              <div className="flex items-center gap-2">
                                                <Ruler className="w-3.5 h-3.5 text-gray-600" />
                                                <span className="text-gray-300">{m.height} cm</span>
                                              </div>
                                            )}
                                          </div>
                                          {m.allergies && (
                                            <div className="flex items-start gap-2 text-sm">
                                              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                              <span className="text-yellow-400">Allergies: {m.allergies}</span>
                                            </div>
                                          )}
                                          {m.fitnessGoal && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Target className="w-3.5 h-3.5 text-orange-500" />
                                              <span className="text-gray-400">Objectif: <span className="text-gray-300">{m.fitnessGoal}</span></span>
                                            </div>
                                          )}
                                          {m.experienceLevel && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Award className="w-3.5 h-3.5 text-purple-500" />
                                              <span className="text-gray-400">Niveau: <span className="text-gray-300">{m.experienceLevel}</span></span>
                                            </div>
                                          )}
                                          {/* Emergency contact */}
                                          {(m.emergencyContactName || m.emergencyContactPhone) && (
                                            <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                                              <p className="text-xs font-medium text-gray-500 mb-1.5">Contact d'urgence</p>
                                              {m.emergencyContactName && <p className="text-sm text-gray-300">{m.emergencyContactName}</p>}
                                              {m.emergencyContactPhone && (
                                                <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                  <Phone className="w-3 h-3" /> {formatPhoneDisplay(m.emergencyContactPhone)}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Center: Sub + Financial */}
                                        <div className="space-y-4">
                                          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Abonnement</h5>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Type</span>
                                                <span className="text-white font-medium">{m.subscriptionType === 'subscription' ? 'Abonnement' : 'Séance libre'}</span>
                                              </div>
                                              {m.subscriptionDuration && (
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Durée</span>
                                                  <span className="text-white">{DURATION_LABELS[m.subscriptionDuration] || m.subscriptionDuration}</span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Séances restantes</span>
                                                <span className="text-white font-medium">{m.sessionsLeft}</span>
                                              </div>
                                              {(() => {
                                                const exp = expiryDate(m);
                                                return exp ? (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Expire le</span>
                                                    <span className={exp.getTime() <= Date.now() ? 'text-red-400 font-medium' : 'text-white'}>{formatDate(exp)}</span>
                                                  </div>
                                                ) : null;
                                              })()}
                                            </div>
                                          </div>

                                          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Finances</h5>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Montant programme</span>
                                                <span className="text-white">{(m.programAmount || 0).toLocaleString()} DA</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Payé</span>
                                                <span className="text-green-400 font-medium">{(m.amountPaid || 0).toLocaleString()} DA</span>
                                              </div>
                                              {m.balanceDue > 0 && (
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Reste dû</span>
                                                  <span className="text-red-400 font-medium">{(m.balanceDue || 0).toLocaleString()} DA</span>
                                                </div>
                                              )}
                                              {m.discount > 0 && (
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Réduction</span>
                                                  <span className="text-orange-400">{(m.discount || 0).toLocaleString()} DA</span>
                                                </div>
                                              )}
                                              {m.advance > 0 && (
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Avance</span>
                                                  <span className="text-purple-400">{(m.advance || 0).toLocaleString()} DA</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Program & Coach */}
                                          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Programme & Coach</h5>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Programme</span>
                                                <span className="text-white">{programs?.find(p => p.id === m.programId)?.name || '-'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-400">Coach</span>
                                                <span className="text-white">{coaches?.find(c => c.id === m.coachId)?.name || '-'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right: Session History & RFID */}
                                        <div className="space-y-4">
                                          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dernières sessions ({memberCheckins[m.id!]?.length || 0})</h5>
                                            {memberCheckins[m.id!] && memberCheckins[m.id!].length > 0 ? (
                                              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                                                {memberCheckins[m.id!].map((c, i) => (
                                                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-900/50">
                                                    <div className="flex items-center gap-2">
                                                      <Clock className="w-3 h-3 text-gray-600" />
                                                      <span className="text-xs text-gray-400">{formatDateTime(c.timestamp)}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.type === 'checkin' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                      {c.type === 'checkin' ? 'Entrée' : 'Sortie'}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-600 text-center py-4">Aucune session</p>
                                            )}
                                          </div>

                                          <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-700/50">
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Badge RFID</h5>
                                            {m.rfidCode ? (
                                              <div className="flex items-center gap-3">
                                                <Fingerprint className="w-6 h-6 text-green-500" />
                                                <div>
                                                  <p className="text-sm text-white font-mono">{m.rfidCode}</p>
                                                  <p className="text-[10px] text-green-400">Assigné</p>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-3">
                                                <Fingerprint className="w-6 h-6 text-gray-600" />
                                                <div>
                                                  <p className="text-sm text-gray-500">Non assigné</p>
                                                  <p className="text-[10px] text-gray-600">Aucun badge RFID</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                  <p className="text-sm text-gray-500">
                    {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''} · Page {page + 1}/{totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Précédent
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (page < 3) {
                          pageNum = i;
                        } else if (page > totalPages - 3) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              page === pageNum
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Suivant <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'pos':
        return (
          <div className="space-y-4">
            <p className="text-gray-400">Analyse des ventes POS des 7 derniers jours.</p>
            <button
              onClick={doPosAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              <BarChart3 className="w-5 h-5" /> {loading ? 'Analyse...' : 'Analyser les ventes 7 jours'}
            </button>

            {posAnalysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard label="Revenu total 7j" value={posAnalysis.totalRevenue.toLocaleString() + ' DA'} icon={<DollarSign />} color="text-green-400" />
                  <StatCard label="Transactions" value={posAnalysis.totalTransactions.toString()} icon={<ShoppingCart />} color="text-blue-400" />
                  <StatCard label="Articles vendus" value={posAnalysis.totalItems.toString()} icon={<Package />} color="text-orange-400" />
                  <StatCard label="Panier moyen" value={Math.round(posAnalysis.averagePerTransaction).toLocaleString() + ' DA'} icon={<BarChart3 />} color="text-purple-400" />
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Top 10 produits vendus</h3>
                  <div className="space-y-2">
                    {posAnalysis.topProducts.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <span className="text-lg font-bold text-gray-500 w-8">#{p.rank}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.qty} vendu(s)</p>
                        </div>
                        <span className="text-sm font-bold text-green-400">{p.revenue.toLocaleString()} DA</span>
                      </div>
                    ))}
                    {posAnalysis.topProducts.length === 0 && <p className="text-gray-500 text-center py-4">Aucune vente cette semaine</p>}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Ventes par jour</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(posAnalysis.salesByDay).reverse().map(([day, data]) => (
                      <div key={day} className="p-3 bg-gray-900/50 rounded-lg text-center">
                        <p className="text-xs text-gray-400">{day.split(' ')[0]}</p>
                        <p className="text-lg font-bold text-white">{data.count}</p>
                        <p className="text-xs text-green-400">{data.revenue.toLocaleString()} DA</p>
                      </div>
                    ))}
                  </div>
                </div>

                {posAnalysis.lowStockProducts?.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h4 className="font-semibold text-red-400">Stock faible ({posAnalysis.lowStockProducts.length} produits)</h4>
                    </div>
                    <div className="space-y-1">
                      {posAnalysis.lowStockProducts.map((p) => (
                        <p key={p.id} className="text-sm text-gray-400">{p.name} : <span className="text-red-400">{p.stock} restant(s)</span></p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-4">
            <p className="text-gray-400">Analyse complète de la cohérence et de l'intégrité de la base de données.</p>
            <button
              onClick={doAudit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Search className="w-5 h-5" /> {loading ? 'Analyse...' : 'Lancer l\'audit complet'}
            </button>

            {auditResults.length > 0 && (
              <div className="space-y-3">
                {auditResults.map((r, i) => (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${
                    r.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                    r.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    'bg-blue-500/10 border border-blue-500/30'
                  }`}>
                    {r.type === 'error' ? <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /> :
                     r.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" /> :
                     <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium text-white">{r.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-orange-400" />
            Administration Base de Données
          </h2>
          <p className="text-gray-400 mt-1">Outils de gestion, audit et analyse</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{status || 'Prêt'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
        {[
          { id: 'members' as Tab, label: 'BDD Adhérents', icon: <Users className="w-4 h-4" /> },
          { id: 'pos' as Tab, label: 'Analyse POS', icon: <ShoppingCart className="w-4 h-4" /> },
          { id: 'audit' as Tab, label: 'Audit', icon: <Search className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
        {tabContent(activeTab)}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
