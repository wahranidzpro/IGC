'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import {
  Shield, RefreshCw, Clock, LogIn, Filter,
  Users, Search, ChevronLeft, ChevronRight,
  Activity,
} from 'lucide-react';
import AdminStatsCard from '@/components/admin/AdminStatsCard';

interface StaffSession {
  id: string;
  gym_user_id: string;
  username: string;
  name: string;
  role: string;
  device_info: string | null;
  ip_address: string | null;
  login_at: string;
  logout_at: string | null;
  last_heartbeat_at: string | null;
  status: 'active' | 'closed' | 'expired';
  duration: string;
}

interface SessionsResponse {
  sessions: StaffSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  activeCount: number;
  todayCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  reception: 'Réception',
  coach: 'Coach',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-[#C89B3C] bg-[#C89B3C]/10 border-[#C89B3C]/30',
  reception: 'text-[#0A84FF] bg-[#0A84FF]/10 border-[#0A84FF]/30',
  coach: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/30',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  closed: 'Fermé',
  expired: 'Expiré',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border-[rgba(16,185,129,0.2)]',
  closed: 'bg-[rgba(168,178,199,0.1)] text-[#A8B2C7] border-[rgba(168,178,199,0.2)]',
  expired: 'bg-[rgba(255,107,53,0.1)] text-[#FF6B35] border-[rgba(255,107,53,0.2)]',
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function StaffSessionsPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchUsername, setSearchUsername] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSessions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchUsername) params.set('username', searchUsername);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/staff-session/history?${params.toString()}`);
      const data: SessionsResponse = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
        setActiveCount(data.activeCount);
        setTodayCount(data.todayCount);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [searchUsername, roleFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (role === 'admin') fetchSessions(1);
  }, [role, fetchSessions]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchSessions(1);
  };

  const activeSessions = activeCount;
  const todaySessions = todayCount;

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C89B3C] to-[#E0B85D] flex items-center justify-center shadow-lg shadow-[#C89B3C]/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              SESSIONS STAFF
            </h1>
          </div>
          <p className="text-[#A8B2C7] text-sm ml-[52px]">Historique des connexions du personnel</p>
        </div>
        <button
          onClick={() => fetchSessions(currentPage)}
          className="px-5 py-2.5 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)] self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-2xl p-5 border border-[rgba(255,255,255,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Utilisateur</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B2C7]" />
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Nom d'utilisateur..."
                className="w-full h-10 pl-10 pr-4 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] placeholder-[#A8B2C7] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
            >
              <option value="">Tous</option>
              <option value="admin">Administrateur</option>
              <option value="reception">Réception</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all"
            >
              <option value="">Tous</option>
              <option value="active">Actif</option>
              <option value="closed">Fermé</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A8B2C7] mb-1.5">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl glass-light text-white text-sm border border-[rgba(255,255,255,0.06)] focus:outline-none focus:border-[#0A84FF]/50 transition-all [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleFilter}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-sm font-semibold shadow-lg shadow-[#0A84FF]/20 hover:shadow-xl transition-all flex items-center gap-2 justify-center"
          >
            <Filter className="w-4 h-4" />
            Filtrer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminStatsCard
          label="Sessions Actives"
          value={activeSessions}
          icon={Activity}
          color="green"
        />
        <AdminStatsCard
          label="Sessions Aujourd'hui"
          value={todaySessions}
          icon={LogIn}
          color="blue"
        />
        <AdminStatsCard
          label="Total Sessions"
          value={total}
          icon={Users}
          color="gold"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-[#A8B2C7]/30 mx-auto mb-3" />
            <p className="text-[#A8B2C7]">Aucune session trouvée</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#A8B2C7] border-b border-[rgba(255,255,255,0.06)]">
              <div className="col-span-2">Nom d'utilisateur</div>
              <div className="col-span-1">Rôle</div>
              <div className="col-span-2">Connexion</div>
              <div className="col-span-2">Déconnexion</div>
              <div className="col-span-1">Durée</div>
              <div className="col-span-2">Appareil</div>
              <div className="col-span-1">Statut</div>
            </div>

            {sessions.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-6 py-4 items-center border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${ROLE_COLORS[s.role] || 'bg-[rgba(168,178,199,0.1)]'} flex items-center justify-center`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.username}</p>
                    <p className="text-xs text-[#A8B2C7]">{s.name}</p>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${ROLE_COLORS[s.role] || 'text-[#A8B2C7] bg-[rgba(168,178,199,0.1)]'}`}>
                    {ROLE_LABELS[s.role] || s.role}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-white">
                  {formatDateTime(s.login_at)}
                </div>
                <div className="col-span-2 text-sm text-[#A8B2C7]">
                  {s.logout_at ? formatDateTime(s.logout_at) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                      En cours
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-sm text-[#A8B2C7]">
                  {s.duration}
                </div>
                <div className="col-span-2 text-sm text-[#A8B2C7] truncate" title={s.device_info || ''}>
                  {s.device_info || '—'}
                </div>
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[s.status] || ''}`}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              const prev = Math.max(1, currentPage - 1);
              setCurrentPage(prev);
              fetchSessions(prev);
            }}
            disabled={currentPage <= 1}
            className="h-10 px-4 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>
          <span className="text-sm text-[#A8B2C7]">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => {
              const next = Math.min(totalPages, currentPage + 1);
              setCurrentPage(next);
              fetchSessions(next);
            }}
            disabled={currentPage >= totalPages}
            className="h-10 px-4 rounded-xl glass-light text-[#A8B2C7] hover:text-white hover:bg-[rgba(255,255,255,0.08)] text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-[rgba(255,255,255,0.06)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
