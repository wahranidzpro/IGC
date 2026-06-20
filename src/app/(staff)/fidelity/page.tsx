'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/dexie-db';
import { Star, Gift, TrendingUp, Users, Search, X, Settings, Award } from 'lucide-react';
import PaginationControls from '@/components/ui/PaginationControls';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import { adjustPoints, calculatePointsValue, type LoyaltyConfig } from '@/lib/loyalty';

export default function FidelityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string } | null>(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const [config] = useState<LoyaltyConfig>({
    earnRateDzd: 100, earnRatePoints: 1, redemptionEnabled: true,
    redemptionRatePoints: 100, redemptionRateDzd: 10, redemptionMaxPercent: 50,
    posRedemptionEnabled: true, subscriptionRedemptionEnabled: true,
    earlyPaymentBonusEnabled: false, earlyPaymentMinAmount: 5000,
    earlyPaymentBonusPercent: 10, earlyPaymentMinMonths: 3, posDiscountMaxPercent: 30,
  });

  const members = useLiveQuery(() => db.members.limit(500).toArray(), []);
  const memberCount = useLiveQuery(() => db.members.count(), []) || 0;

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const totalPoints = members?.reduce((sum, m) => sum + (m.fidelityPoints || 0), 0) || 0;
  const avgPoints = memberCount ? totalPoints / memberCount : 0;
  const membersWithPoints = members?.filter(m => (m.fidelityPoints || 0) > 0).length || 0;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE)), [filteredMembers.length]);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, currentPage, PAGE_SIZE]);

  const getTier = (points: number) => {
    if (points >= 500) return { name: 'Or', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (points >= 200) return { name: 'Argent', color: 'text-gray-300', bg: 'bg-gray-500/20' };
    if (points >= 50) return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { name: 'Novice', color: 'text-white/50', bg: 'bg-white/10' };
  };

  const openPointsModal = (member: { id?: number; firstName: string; lastName: string }) => {
    if (!member.id) return;
    setSelectedMember({ id: member.id, name: `${member.firstName} ${member.lastName}` });
    setPointsAmount(0);
    setPointsReason('');
    setShowPointsModal(true);
  };

  const handleAddPoints = async () => {
    if (!selectedMember || pointsAmount === 0) return;
    await adjustPoints(selectedMember.id, selectedMember.name, pointsAmount, pointsReason || 'Ajustement manuel');
    setShowPointsModal(false);
    setSelectedMember(null);
    setPointsAmount(0);
    setPointsReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">FIDELITE & POINTS</h2>
          <p className="text-gray-400 mt-1">Systeme de points et rewards</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/loyalty')} className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700">
            <Settings className="w-5 h-5" />
            Configurer les Rewards
          </button>
          <button onClick={() => router.push('/admin/loyalty')} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700">
            <Award className="w-5 h-5" />
            Parametres Fidelite
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Points Totaux</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{totalPoints.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Membres Actifs</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{members?.filter(m => m.status === 'active').length || 0}</p>
        </div>
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Moyenne Points</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{avgPoints.toFixed(0)}</p>
        </div>
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Membres avec Points</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{membersWithPoints}</p>
        </div>
      </div>

      {/* Search & Members List */}
      <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un membre..."
              className="w-full h-12 pl-12 pr-4 rounded-xl focus:outline-none focus:border-orange-500"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderColor: 'var(--border)' }}>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Membre</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Telephone</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Points</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Rang</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Valeur Points</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => {
                const tier = getTier(member.fidelityPoints || 0);
                const pointValue = calculatePointsValue(member.fidelityPoints || 0, config);
                return (
                  <tr key={member.id} style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text)' }}>{member.firstName} {member.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatPhoneDisplay(member.phone)}</td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-bold">{member.fidelityPoints || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${tier.bg} ${tier.color}`}>
                        {tier.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-400 font-medium">{pointValue} DA</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openPointsModal(member)}
                        className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30"
                      >
                        + Points
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Points Modal */}
      {showPointsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Ajouter des Points</h3>
              <button onClick={() => setShowPointsModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/10">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Membre</p>
                <p className="text-lg font-bold text-orange-400">{selectedMember.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Nombre de points</label>
                <input
                  type="number"
                  value={pointsAmount || ''}
                  onChange={e => setPointsAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Raison</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                  placeholder="Ex: Bonus fidelite, compensation..."
                />
              </div>
              {pointsAmount > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--input-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Valeur estimee</p>
                  <p className="text-lg font-bold text-green-400">{calculatePointsValue(pointsAmount, config)} DA de reduction</p>
                </div>
              )}
            </div>
            <button
              onClick={handleAddPoints}
              disabled={pointsAmount === 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              Ajouter {pointsAmount} points
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
