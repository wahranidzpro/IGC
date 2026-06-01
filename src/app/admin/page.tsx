'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/lib/auth/context';
import { db } from '@/lib/db/dexie-db';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, CreditCard, Activity, UserPlus, Settings, Database,
  Search, FileText, BarChart3, Gift, Clock, DollarSign, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight,
  MoreVertical, Edit, Trash2, Lock, Unlock, User, Phone, Key,
  Plus, X, Building2, Package, Dumbbell, Calendar
} from 'lucide-react';

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
  admin: 'text-red-400 bg-red-500/10 border-red-500/30',
  reception: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  coach: 'text-green-400 bg-green-500/10 border-green-500/30',
  adherent: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
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

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès réservé</h2>
          <p>Seuls les administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg cursor-pointer">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-orange-400" />
            Administration
          </h2>
          <p className="text-gray-400 mt-1">Gestion des utilisateurs et vue d'ensemble du système</p>
        </div>
      </div>

      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-300'
            : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Membres total" value={members?.length || 0} color="text-blue-400" bg="bg-blue-500/10 border-blue-500/30" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Abonnements actifs" value={activeMembers} color="text-green-400" bg="bg-green-500/10 border-green-500/30" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="En salle" value={presentCheckins} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/30" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenu aujourd'hui" value={`${todayRevenue.toLocaleString('fr-DZ')} DA`} color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/30" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Utilisateurs système" value={gymUsers.length} color="text-purple-400" bg="bg-purple-500/10 border-purple-500/30" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Check-ins aujourd'hui" value={todayCheckins} color="text-cyan-400" bg="bg-cyan-500/10 border-cyan-500/30" />
        <StatCard icon={<Package className="w-5 h-5" />} label="Produits" value={products?.length || 0} color="text-yellow-400" bg="bg-yellow-500/10 border-yellow-500/30" />
        <StatCard icon={<Dumbbell className="w-5 h-5" />} label="Coachs" value={coaches?.length || 0} color="text-pink-400" bg="bg-pink-500/10 border-pink-500/30" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Employés" value={`${employees?.length || 0} · ${employees?.filter(e => e.isActive).length || 0} actifs`} color="text-indigo-400" bg="bg-indigo-500/10 border-indigo-500/30" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink icon={<Database className="w-5 h-5" />} label="Base de données" href="/admin/database" />
        <QuickLink icon={<FileText className="w-5 h-5" />} label="Journal Audit" href="/admin/audit" />
        <QuickLink icon={<Activity className="w-5 h-5" />} label="Monitoring" href="/admin/monitoring" />
        <QuickLink icon={<Users className="w-5 h-5" />} label="Personnel" href="/personnel" />
        <QuickLink icon={<Gift className="w-5 h-5" />} label="Fidélité" href="/admin/loyalty" />
      </div>

      {/* User Management */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Gestion des utilisateurs</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par nom, identifiant, téléphone..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={e => setUserRoleFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Tous les rôles</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-6 py-3 font-medium">Identifiant</th>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Rôle</th>
                <th className="px-6 py-3 font-medium">Téléphone</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Créé le</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  isExpanded={expandedUserId === user.id}
                  onToggle={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  onEdit={() => setShowEditModal(user)}
                  onDelete={() => handleDeleteUser(user.username)}
                  onToggleLock={() => handleToggleLock(user)}
                />
              ))}
            </tbody>
          </table>
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
    <div className={`rounded-xl p-4 border ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function QuickLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all cursor-pointer"
    >
      <span className="text-orange-400">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function UserRow({ user, isExpanded, onToggle, onEdit, onDelete, onToggleLock }: {
  user: GymUser; isExpanded: boolean; onToggle: () => void;
  onEdit: () => void; onDelete: () => void; onToggleLock: () => void;
}) {
  const createdDate = new Date(user.created_at).toLocaleDateString('fr-FR');
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.adherent;

  return (
    <>
      <tr className="hover:bg-white/5 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-white text-sm font-mono">{user.username}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-gray-300 text-sm">{user.name || '-'}</span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColor}`}>
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="text-gray-400 text-sm">{user.phone || '-'}</span>
        </td>
        <td className="px-6 py-4">
          {user.is_locked ? (
            <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> Verrouillé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <Unlock className="w-3 h-3" /> Actif
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          <span className="text-gray-500 text-sm">{createdDate}</span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title={user.is_locked ? 'Déverrouiller' : 'Verrouiller'}>
              {user.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title="Modifier">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-800/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">ID interne</span>
                <p className="text-gray-300 font-mono text-xs mt-1">{user.id}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Email</span>
                <p className="text-gray-300 mt-1">{user.username}@infinitygym.local</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Rôle</span>
                <p className="text-gray-300 mt-1 capitalize">{ROLE_LABELS[user.role] || user.role}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Statut</span>
                <p className="text-gray-300 mt-1">{user.is_locked ? 'Verrouillé' : 'Actif'}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function UserFormModal({ title, user, onClose, onSubmit }: {
  title: string; user?: GymUser; onClose: () => void;
  onSubmit: (data: { username: string; password?: string; pin?: string; role: string; name: string; phone?: string }) => void;
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState(user?.role || 'reception');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Le nom est requis'); return; }
    if (!user && !password.trim()) { setError('Le mot de passe est requis'); return; }
    if (!user && !pin.trim()) { setError('Le code PIN est requis'); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        username: username.trim() || name.trim().toLowerCase().replace(/\s+/g, '.'),
        ...(password ? { password } : {}),
        ...(pin ? { pin } : {}),
        role,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom complet *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="Nom de l'utilisateur" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Identifiant (username)</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="Laissé vide = généré depuis le nom" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">{user ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder={user ? 'Laisser vide pour garder' : 'Mot de passe'} />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">{user ? 'Nouveau code PIN (optionnel)' : 'Code PIN *'}</label>
            <input type="text" value={pin} onChange={e => setPin(e.target.value)} maxLength={6}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder={user ? 'Laisser vide pour garder' : 'PIN (ex: 1234)'} />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Rôle *</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              placeholder="Ex: 0555000011" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all cursor-pointer">
              Annuler
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer">
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
