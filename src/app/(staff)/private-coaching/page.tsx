'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { 
  Users, User, Calendar, Clock, DollarSign, Search, X, Plus, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Filter, Download, TrendingUp, BarChart3, Star, Award,
  Phone, Mail, MapPin, Dumbbell, Activity, AlertCircle, Edit, Trash2, Save, Loader2
} from 'lucide-react';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import { exportToXlsx } from '@/components/ui/ImportExportButtons';

type TabType = 'dashboard' | 'coaches' | 'sessions' | 'members';
type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export default function CoachingPage() {
  const { role, user } = useAuth();
  const isAdmin = role === 'admin';
  const coachId = user?.coachId;

  const [tab, setTab] = useState<TabType>('dashboard');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [sessionForm, setSessionForm] = useState({ memberId: 0, memberName: '', coachId: 0, coachName: '', date: '', time: '10:00', price: 2000, status: 'scheduled' as SessionStatus });
  const [memberSearch, setMemberSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const allCoaches = useLiveQuery(() => db.coaches.toArray(), []);
  const allMembers = useLiveQuery(() => db.members.toArray(), []);
  const allSessions = useLiveQuery(() => db.privateSessions.toArray(), []);
  const allPayments = useLiveQuery(() => db.payments.toArray(), []);

  const coaches = useMemo(() => {
    if (isAdmin) return allCoaches || [];
    return (allCoaches || []).filter(c => c.id === coachId);
  }, [allCoaches, isAdmin, coachId]);

  const filteredSessions = useMemo(() => {
    let s = allSessions || [];
    if (selectedCoachId) s = s.filter(x => x.coachId === selectedCoachId);
    else if (!isAdmin && coachId) s = s.filter(x => x.coachId === coachId);
    if (statusFilter !== 'all') s = s.filter(x => x.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      s = s.filter(x => x.memberName?.toLowerCase().includes(q));
    }
    return s.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  }, [allSessions, selectedCoachId, isAdmin, coachId, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const mySessions = allSessions || [];
    const totalSessions = mySessions.length;
    const completed = mySessions.filter(s => s.status === 'completed').length;
    const scheduled = mySessions.filter(s => s.status === 'scheduled').length;
    const cancelled = mySessions.filter(s => s.status === 'cancelled').length;
    const revenue = mySessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.price || 0), 0);
    const uniqueMembers = new Set(mySessions.map(s => s.memberId)).size;
    return { totalSessions, completed, scheduled, cancelled, revenue, uniqueMembers };
  }, [allSessions]);

  const coachStats = useMemo(() => {
    return (coaches || []).map(c => {
      const cs = (allSessions || []).filter(s => s.coachId === c.id);
      const completed = cs.filter(s => s.status === 'completed');
      const revenue = completed.reduce((sum, s) => sum + (s.price || 0), 0);
      const memberIds = new Set(cs.map(s => s.memberId));
      return { coach: c, total: cs.length, completed: completed.length, revenue, members: memberIds.size };
    });
  }, [coaches, allSessions]);

  const handleCreateSession = async () => {
    if (!sessionForm.memberId || !sessionForm.coachId || !sessionForm.date) return;
    const coach = (allCoaches || []).find(c => c.id === sessionForm.coachId);
    const member = (allMembers || []).find(m => m.id === sessionForm.memberId);
    await db.privateSessions.add({
      memberId: sessionForm.memberId,
      memberName: member ? `${member.firstName} ${member.lastName}` : sessionForm.memberName,
      coachId: sessionForm.coachId,
      coachName: coach?.name || sessionForm.coachName,
      date: sessionForm.date,
      time: sessionForm.time,
      duration: 60,
      price: sessionForm.price,
      status: sessionForm.status,
      createdAt: new Date(),
    });
    setShowSessionModal(false);
    resetForm();
  };

  const handleUpdateSession = async () => {
    if (!editingSession?.id) return;
    await db.privateSessions.update(editingSession.id, {
      date: sessionForm.date,
      time: sessionForm.time,
      price: sessionForm.price,
      status: sessionForm.status,
    });
    setEditingSession(null);
    setShowSessionModal(false);
    resetForm();
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm('Supprimer cette session ?')) return;
    await db.privateSessions.delete(id);
  };

  const updateStatus = async (id: number, status: SessionStatus) => {
    await db.privateSessions.update(id, { status });
  };

  const resetForm = () => {
    setSessionForm({ memberId: 0, memberName: '', coachId: 0, coachName: '', date: '', time: '10:00', price: 2000, status: 'scheduled' });
    setMemberSearch('');
  };

  const openEditModal = (session: any) => {
    setEditingSession(session);
    setSessionForm({
      memberId: session.memberId,
      memberName: session.memberName,
      coachId: session.coachId,
      coachName: session.coachName,
      date: session.date?.split('T')[0] || session.date,
      time: session.time || '10:00',
      price: session.price || 2000,
      status: session.status,
    });
    setShowSessionModal(true);
  };

  const openCreateModal = (coachId?: number, memberId?: number) => {
    setEditingSession(null);
    resetForm();
    if (coachId) setSessionForm(f => ({ ...f, coachId }));
    if (memberId) {
      const m = (allMembers || []).find(mm => mm.id === memberId);
      if (m) setSessionForm(f => ({ ...f, memberId, memberName: `${m.firstName} ${m.lastName}` }));
    }
    setShowSessionModal(true);
  };

  const exportSessions = () => {
    const rows = filteredSessions.map(s => ({
      'Membre': s.memberName,
      'Coach': s.coachName,
      'Date': s.date,
      'Heure': s.time,
      'Prix DA': s.price,
      'Statut': s.status === 'completed' ? 'Terminé' : s.status === 'scheduled' ? 'Planifié' : 'Annulé',
    }));
    exportToXlsx(rows, 'coaching-sessions');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Terminé' },
      scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Planifié' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Annulé' },
    };
    const s = map[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const coachRevenue = (allPayments || []).filter(p => p.type === 'commission').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Coaching Privé</h2>
            <p className="text-gray-400 text-sm">{stats.totalSessions} sessions · {stats.uniqueMembers} adhérents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportSessions} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => openCreateModal()} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm text-white font-medium">
            <Plus className="w-4 h-4" /> Nouvelle Session
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['dashboard', 'coaches', 'sessions', 'members'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {t === 'dashboard' ? 'Tableau de bord' : t === 'coaches' ? 'Coachs' : t === 'sessions' ? 'Sessions' : 'Adhérents'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">Total sessions</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalSessions}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">Terminées</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">Planifiées</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{stats.scheduled}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">Revenu total</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{stats.revenue.toLocaleString()} DA</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">Adhérents</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.uniqueMembers}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Top Coachs</h3>
              {coachStats.length === 0 ? <p className="text-gray-500 text-sm">Aucun coach</p> : (
                <div className="space-y-3">
                  {coachStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((cs, i) => (
                    <div key={cs.coach.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-500 w-6">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{cs.coach.name}</p>
                          <p className="text-xs text-gray-400">{cs.completed} sessions · {cs.members} adhérents</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-orange-400">{cs.revenue.toLocaleString()} DA</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Prochaines sessions</h3>
              {filteredSessions.filter(s => s.status === 'scheduled').slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune session planifiée</p>
              ) : (
                <div className="space-y-2">
                  {filteredSessions.filter(s => s.status === 'scheduled').slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                      <div>
                        <p className="text-sm text-white font-medium">{s.memberName}</p>
                        <p className="text-xs text-gray-400">{s.date} à {s.time} · {s.coachName}</p>
                      </div>
                      <span className="text-xs text-orange-400 font-medium">{s.price.toLocaleString()} DA</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'coaches' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">{coaches.length} Coach(s)</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {coachStats.map(cs => (
              <div key={cs.coach.id} className="p-5 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{cs.coach.name}</p>
                      <p className="text-sm text-gray-400">{formatPhoneDisplay(cs.coach.phone || '')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{cs.total}</p>
                      <p className="text-xs text-gray-500">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">{cs.completed}</p>
                      <p className="text-xs text-gray-500">Terminées</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-400">{cs.revenue.toLocaleString()} DA</p>
                      <p className="text-xs text-gray-500">Revenu</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">{cs.members}</p>
                      <p className="text-xs text-gray-500">Adhérents</p>
                    </div>
                    <button onClick={() => { setSelectedCoachId(cs.coach.id ?? null); setTab('sessions'); }} className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700">Voir sessions</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Rechercher par nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 max-w-xs" />
            <Filter className="w-4 h-4 text-gray-500 ml-2" />
            {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${statusFilter === f ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {f === 'all' ? 'Toutes' : f === 'scheduled' ? 'Planifiées' : f === 'completed' ? 'Terminées' : 'Annulées'}
              </button>
            ))}
            {isAdmin && (
              <select value={selectedCoachId || ''} onChange={e => setSelectedCoachId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm ml-auto">
                <option value="">Tous les coachs</option>
                {coaches.map(c => <option key={c.id} value={c.id!}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900">
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Membre</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Coach</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Heure</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Montant</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Statut</th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">Aucune session</td></tr>
                  ) : filteredSessions.map(s => (
                    <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-white">{s.memberName}</td>
                      <td className="px-4 py-3 text-gray-400">{s.coachName}</td>
                      <td className="px-4 py-3 text-gray-300">{s.date}</td>
                      <td className="px-4 py-3 text-gray-300">{s.time}</td>
                      <td className="px-4 py-3 text-orange-400 font-medium">{s.price.toLocaleString()} DA</td>
                      <td className="px-4 py-3">{statusBadge(s.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {s.status === 'scheduled' && (
                            <>
                              <button onClick={() => { if (s.id) updateStatus(s.id, 'completed'); }} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg" title="Terminer"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => { if (s.id) updateStatus(s.id, 'cancelled'); }} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg" title="Annuler"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => openEditModal(s)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg" title="Modifier"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { if (s.id) handleDeleteSession(s.id); }} className="p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Rechercher un adhérent..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 max-w-sm" />
              <span className="text-xs text-gray-500">{allMembers?.length || 0} adhérents</span>
            </div>
          </div>
          <div className="divide-y divide-gray-800">
            {(allMembers || []).filter(m => {
              if (!searchTerm) return true;
              const q = searchTerm.toLowerCase();
              return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.phone.includes(q);
            }).map(m => {
              const ms = (allSessions || []).filter(s => s.memberId === m.id);
              const completedSessions = ms.filter(s => s.status === 'completed').length;
              const totalSpent = ms.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.price || 0), 0);
              const isExpanded = expandedRow === m.id;
              return (
                <div key={m.id}>
                  <button onClick={() => setExpandedRow(isExpanded ? null : (m.id || null))}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                        {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-gray-400">{formatPhoneDisplay(m.phone)} · {ms.length} session(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-orange-400 font-medium">{totalSpent.toLocaleString()} DA</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-800/30 space-y-3">
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Programme</p>
                          <p className="text-sm text-white font-medium">{(allMembers?.find(p => (allSessions || []).find(s => (db as any).programs)) ? '-' : 'À définir')}</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Sessions coach</p>
                          <p className="text-2xl font-bold text-orange-400">{completedSessions}</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Total dépensé</p>
                          <p className="text-lg font-bold text-green-400">{totalSpent.toLocaleString()} DA</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openCreateModal(undefined, m.id)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs hover:bg-orange-500/30">
                          <Plus className="w-3 h-3" /> Nouvelle session
                        </button>
                      </div>
                      {ms.length > 0 && (
                        <div className="space-y-1">
                          {ms.slice(0, 5).map(s => (
                            <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                              <span className="text-gray-300">{s.date} à {s.time} · {s.coachName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">{s.price.toLocaleString()} DA</span>
                                {statusBadge(s.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSessionModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editingSession ? 'Modifier' : 'Nouvelle'} Session</h3>
              <button onClick={() => setShowSessionModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Adhérent</label>
                {editingSession ? (
                  <div className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">{sessionForm.memberName}</div>
                ) : sessionForm.memberId ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl">
                    <span className="text-white">{sessionForm.memberName}</span>
                    <button onClick={() => setSessionForm(f => ({ ...f, memberId: 0, memberName: '' }))} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div>
                    <input type="text" placeholder="Rechercher..." value={memberSearch} onChange={e => {
                      setMemberSearch(e.target.value);
                      const found = (allMembers || []).find(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(e.target.value.toLowerCase()));
                      if (found) setSessionForm(f => ({ ...f, memberId: found.id!, memberName: `${found.firstName} ${found.lastName}` }));
                    }} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Coach</label>
                <select value={sessionForm.coachId} onChange={e => {
                  const c = (allCoaches || []).find(co => co.id === Number(e.target.value));
                  setSessionForm(f => ({ ...f, coachId: Number(e.target.value), coachName: c?.name || '' }));
                }} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  <option value={0}>Sélectionner un coach</option>
                  {(allCoaches || []).map(c => <option key={c.id} value={c.id!}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Heure</label>
                  <input type="time" value={sessionForm.time} onChange={e => setSessionForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prix (DA)</label>
                <input type="number" value={sessionForm.price} onChange={e => setSessionForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
              </div>
              <button onClick={editingSession ? handleUpdateSession : handleCreateSession}
                disabled={!sessionForm.memberId || !sessionForm.coachId || !sessionForm.date}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {editingSession ? 'Enregistrer' : 'Créer la Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
