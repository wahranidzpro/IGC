'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/lib/auth/context';
import { db } from '@/lib/db/dexie-db';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Activity, DollarSign, BarChart3,
  FileText, Database, Gift, Package,
  RefreshCw, CheckCircle, AlertTriangle,
  UserCheck, TrendingUp,
  Clock, DoorOpen,
} from 'lucide-react';
import AdminStatsCard from '@/components/admin/AdminStatsCard';

interface GymUser {
  id: string;
  username: string;
  role: string;
  name: string;
  phone: string | null;
  is_locked: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { user, role } = useAuth();
  const router = useRouter();

  const members = useLiveQuery(() => db.members.toArray(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const employees = useLiveQuery(() => db.employees.toArray(), []);

  const [gymUsers, setGymUsers] = useState<GymUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (res.ok) setGymUsers(data.users || []);
      else notify('error', 'Erreur chargement utilisateurs: ' + (data.error || ''));
    } catch {
      notify('error', 'Erreur réseau lors du chargement des utilisateurs');
    }
    setUsersLoading(false);
  }, [notify]);

  useEffect(() => {
    if (role === 'admin') Promise.resolve().then(() => fetchUsers());
  }, [role, fetchUsers]);

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const todayCheckins = useMemo(() =>
    checkins?.filter(c => c.type === 'checkin' && new Date(c.timestamp) >= todayStart).length || 0,
    [checkins, todayStart]
  );
  const todayPayments = useMemo(() =>
    payments?.filter(p => new Date(p.date) >= todayStart) || [],
    [payments, todayStart]
  );
  const todayRevenue = useMemo(() =>
    todayPayments.reduce((s, p) => s + p.amount, 0),
    [todayPayments]
  );
  const activeMembers = useMemo(() =>
    members?.filter(m => m.status === 'active').length || 0,
    [members]
  );
  const presentCheckins = useMemo(() => {
    const checkedIn = new Set<number>();
    checkins?.forEach(c => {
      if (c.type === 'checkin') checkedIn.add(c.memberId);
      else if (c.type === 'checkout') checkedIn.delete(c.memberId);
    });
    return checkedIn.size;
  }, [checkins]);

  const occupancyRate = useMemo(() =>
    members?.length ? Math.round((presentCheckins / members.length) * 100) : 0,
    [members, presentCheckins]
  );

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments?.filter(p => new Date(p.date) >= monthStart).reduce((s, p) => s + p.amount, 0) || 0;
  }, [payments]);

  const bestDay = useMemo(() => {
    if (!todayCheckins || todayCheckins === 0) return '-';
    return `${todayCheckins} check-ins`;
  }, [todayCheckins]);

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#0A84FF]/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              TABLEAU DE BORD
            </h1>
          </div>
          <p className="text-[#A8B2C7] text-sm ml-[52px]">Vue d&apos;ensemble du centre</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchUsers} className="px-5 py-2.5 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`px-5 py-4 rounded-2xl text-sm flex items-center gap-3 transition-all duration-300 animate-slide-up ${
          notification.type === 'success'
            ? 'glass border border-[#10B981]/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            : 'glass border border-[#FF4D4D]/30 shadow-[0_0_20px_rgba(255,77,77,0.1)]'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-[#10B981]" />
            : <AlertTriangle className="w-5 h-5 text-[#FF4D4D]" />}
          <span className={notification.type === 'success' ? 'text-[#10B981]' : 'text-[#FF4D4D]'}>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards - Premium Design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          label="Adhérents Actifs"
          value={activeMembers}
          icon={Users}
          color="blue"
          sub={`${members?.length || 0} total`}
        />
        <AdminStatsCard
          label="Check-ins Aujourd'hui"
          value={todayCheckins}
          icon={DoorOpen}
          color="green"
        />
        <AdminStatsCard
          label="Présents en Salle"
          value={presentCheckins}
          icon={Activity}
          color="turquoise"
        />
        <AdminStatsCard
          label="Revenus Aujourd'hui"
          value={`${todayRevenue.toLocaleString('fr-DZ')} DA`}
          icon={DollarSign}
          color="gold"
        />
        <AdminStatsCard
          label="Taux d'Occupation"
          value={`${occupancyRate}%`}
          icon={BarChart3}
          color="green"
        />
        <AdminStatsCard
          label="Revenus du Mois"
          value={`${monthlyRevenue.toLocaleString('fr-DZ')} DA`}
          icon={TrendingUp}
          color="orange"
        />
        <AdminStatsCard
          label="Bénéfices"
          value="-"
          icon={DollarSign}
          color="violet"
          sub="Calcul en cours"
        />
        <AdminStatsCard
          label="Meilleur Jour"
          value={bestDay}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatsCard label="Utilisateurs Système" value={gymUsers.length} icon={Shield} color="violet" />
        <AdminStatsCard label="Produits" value={products?.length || 0} icon={Package} color="gold" />
        <AdminStatsCard label="Coachs" value={coaches?.length || 0} icon={UserCheck} color="turquoise" />
        <AdminStatsCard label="Employés" value={`${employees?.length || 0}`} icon={Users} color="blue" sub={`${employees?.filter(e => e.isActive).length || 0} actifs`} />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7] mb-4">Accès Rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { icon: <Database className="w-5 h-5" />, label: 'Base de données', href: '/admin/database', color: 'from-[#0A84FF] to-[#00D4FF]' },
            { icon: <FileText className="w-5 h-5" />, label: 'Journal Audit', href: '/admin/audit', color: 'from-[#7C3AED] to-[#A855F7]' },
            { icon: <Activity className="w-5 h-5" />, label: 'Monitoring', href: '/admin/monitoring', color: 'from-[#10B981] to-[#34D399]' },
            { icon: <Users className="w-5 h-5" />, label: 'Personnel', href: '/personnel', color: 'from-[#00D4FF] to-[#0A84FF]' },
            { icon: <Gift className="w-5 h-5" />, label: 'Fidélité', href: '/admin/loyalty', color: 'from-[#C89B3C] to-[#E0B85D]' },
            { icon: <BarChart3 className="w-5 h-5" />, label: 'Analyses', href: '/admin/analytics', color: 'from-[#7C3AED] to-[#A855F7]' },
          ].map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className="glass rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-[rgba(255,255,255,0.06)] group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                {link.icon}
              </div>
              <span className="text-sm font-semibold text-white">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
