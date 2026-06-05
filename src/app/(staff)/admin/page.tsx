'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/lib/auth/context';
import { db, PinUser } from '@/lib/db/dexie-db';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Activity, DollarSign, BarChart3,
  Search, FileText, Database, Gift, Package, Dumbbell,
  RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ChevronRight,
  MoreVertical, Edit, Trash2, Lock, Unlock, User, Phone, Key,
  Plus, X, Building2, CreditCard, UserCheck, TrendingUp,
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

const ROLES = ['admin', 'reception', 'coach', 'adherent'] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  reception: 'Réception',
  coach: 'Coach',
  adherent: 'Adhérent',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-[#0A84FF] bg-[#0A84FF]/10 border-[#0A84FF]/30',
  reception: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/30',
  coach: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
  adherent: 'text-[#A8B2C7] bg-[#A8B2C7]/10 border-[#A8B2C7]/30',
};

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const router = useRouter();

  const members = useLiveQuery(() => db.members.toArray(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const employees = useLiveQuery(() => db.employees.toArray(), []);

  const [gymUsers, setGymUsers] = useState<GymUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<GymUser | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

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
    if (role === 'admin') fetchUsers();
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

  const filteredUsers = useMemo(() => {
    let list = gymUsers;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }
    if (userRoleFilter !== 'all') list = list.filter(u => u.role === userRoleFilter);
    return list;
  }, [gymUsers, userSearch, userRoleFilter]);

  const handleCreateUser = async (data: { username: string; password?: string; pin?: string; role: string; name: string; phone?: string }) => {
    if (!data.password || !data.pin) { notify('error', 'Mot de passe et PIN requis'); return; }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        notify('success', `Utilisateur ${data.username} créé avec succès`);
        setShowCreateModal(false);
        fetchUsers();
        const passwordHash = await bcrypt.hash(data.password, 10);
        const pinHash = await bcrypt.hash(data.pin, 10);
        await db.pinUsers.add({
          username: data.username,
          password: passwordHash,
          pin: pinHash,
          role: data.role as PinUser['role'],
          name: data.name,
          phone: data.phone || undefined,
          isLocked: false,
          createdAt: new Date(),
        }).catch(() => {});
      } else {
        notify('error', result.error || 'Erreur création utilisateur');
      }
    } catch {
      notify('error', 'Erreur réseau');
    }
  };

  const handleUpdateUser = async (data: { id: string; name?: string; phone?: string; role?: string; is_locked?: boolean; password?: string; pin?: string }) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        notify('success', 'Utilisateur mis à jour');
        setShowEditModal(null);
        fetchUsers();
      } else {
        notify('error', result.error || 'Erreur mise à jour');
      }
    } catch {
      notify('error', 'Erreur réseau');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Supprimer l'utilisateur "${username}" ?`)) return;
    try {
      const res = await fetch(`/api/auth/users?username=${encodeURIComponent(username)}`, { method: 'DELETE' });
      if (res.ok) {
        notify('success', `Utilisateur ${username} supprimé`);
        fetchUsers();
      } else {
        try { const data = await res.json(); notify('error', data.error || 'Erreur suppression'); }
        catch { notify('error', `Erreur ${res.status}: ${res.statusText}`); }
      }
    } catch {
      notify('error', 'Erreur réseau');
    }
  };

  const handleToggleLock = async (user: GymUser) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_locked: !user.is_locked }),
      });
      if (res.ok) {
        notify('success', user.is_locked ? 'Utilisateur débloqué' : 'Utilisateur verrouillé');
        fetchUsers();
      }
    } catch {
      notify('error', 'Erreur réseau');
    }
  };

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
          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-sm font-semibold shadow-lg shadow-[#0A84FF]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
          <button className="px-5 py-2.5 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)]">
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

      {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#A8B2C7]">Gestion des Utilisateurs</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7]" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-48 lg:w-64 h-10 pl-10 pr-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 focus:shadow-[0_0_15px_rgba(10,132,255,0.1)] transition-all"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
            >
              <option value="all">Tous les rôles</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-sm font-semibold shadow-lg shadow-[#0A84FF]/20 hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nouveau
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {usersLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl shimmer" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-[#A8B2C7]/30 mx-auto mb-3" />
              <p className="text-[#A8B2C7]">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A8B2C7] border-b border-[rgba(255,255,255,0.06)]">
                <div className="col-span-3">Utilisateur</div>
                <div className="col-span-2">Rôle</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-1 text-center">PIN</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {filteredUsers.map((u) => (
                <div key={u.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${ROLE_COLORS[u.role] || 'bg-[rgba(168,178,199,0.1)]'} flex items-center justify-center`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{u.name || u.username}</p>
                        <p className="text-xs text-[#A8B2C7]">@{u.username}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${ROLE_COLORS[u.role] || 'text-[#A8B2C7] bg-[rgba(168,178,199,0.1)]'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-[#A8B2C7]">
                      {u.phone || '—'}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                        u.is_locked
                          ? 'bg-[rgba(255,77,77,0.1)] text-[#FF4D4D] border border-[rgba(255,77,77,0.2)]'
                          : 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_locked ? 'bg-[#FF4D4D]' : 'bg-[#10B981]'}`} />
                        {u.is_locked ? 'Verrouillé' : 'Actif'}
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-sm text-[#A8B2C7]">
                      {u.is_locked ? '—' : '••••'}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => setShowEditModal(u)}
                        className="p-2 rounded-lg text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleLock(u)}
                        className="p-2 rounded-lg text-[#A8B2C7] hover:text-[#C89B3C] hover:bg-[rgba(200,155,60,0.1)] transition-all">
                        {u.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteUser(u.username)}
                        className="p-2 rounded-lg text-[#A8B2C7] hover:text-[#FF4D4D] hover:bg-[rgba(255,77,77,0.1)] transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                        className="p-2 rounded-lg text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all lg:hidden">
                        {expandedUserId === u.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Expanded mobile details */}
                  {expandedUserId === u.id && (
                    <div className="lg:hidden px-6 pb-4 space-y-2 animate-slide-up">
                      <div className="flex items-center gap-2 text-xs text-[#A8B2C7]">
                        <Phone className="w-3 h-3" /> {u.phone || '—'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A8B2C7]">
                        <Key className="w-3 h-3" /> PIN: {u.is_locked ? '—' : '••••'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          title="Nouvel utilisateur"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <UserFormModal
          title="Modifier l'utilisateur"
          user={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSubmit={(data) => handleUpdateUser({ ...data, id: showEditModal.id })}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A8B2C7]">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function QuickLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(href)}
      className="glass rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-[rgba(255,255,255,0.06)] group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <span className="text-sm font-semibold text-white">{label}</span>
    </button>
  );
}

function UserFormModal({ title, user, onClose, onSubmit }: {
  title: string;
  user?: GymUser;
  onClose: () => void;
  onSubmit: (data: { username: string; password?: string; pin?: string; role: string; name: string; phone?: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    pin: '',
    role: user?.role || 'reception',
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 border border-[rgba(255,255,255,0.1)] shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center">
              {user ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Nom d&apos;utilisateur</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
              disabled={!!user} required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Nom complet</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">
                {user ? 'Nouveau mot de passe' : 'Mot de passe'}
              </label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
                {...(!user && { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Code PIN</label>
              <input type="password" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
                {...(!user && { required: true })} maxLength={4} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Rôle</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Téléphone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-11 px-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl glass-light text-[#A8B2C7] hover:text-white text-sm font-semibold border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] transition-all">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-sm font-semibold shadow-lg shadow-[#0A84FF]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {user ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
