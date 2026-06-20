'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { Fingerprint, Search, Shield, ShieldOff, Link, Unlink, Ban, CheckCircle, X, Clock, User, AlertTriangle, History, ArrowUpDown, Plus } from 'lucide-react';
import Image from 'next/image';

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function RFIDPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'blocked' | 'associate'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<'name' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showDissociateModal, setShowDissociateModal] = useState<Member | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState<Member | null>(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [associateSearch, setAssociateSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [rfidInput, setRfidInput] = useState('');
  const [associateSuccess, setAssociateSuccess] = useState<{ name: string; code: string } | null>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [blockingMember, setBlockingMember] = useState<Member | null>(null);
  const [unblockConfirm, setUnblockConfirm] = useState<Member | null>(null);

  const allMembers = useLiveQuery(() => db.members.toArray(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const membersWithRFID = allMembers?.filter(m => m.rfidCode && m.rfidCode.trim() !== '') || [];
  const blockedMembers = membersWithRFID.filter(m => m.isBlocked === true);
  const activeBadgeMembers = membersWithRFID.filter(m => !m.isBlocked);
  const membersWithoutRFID = allMembers?.filter(m => !m.rfidCode || m.rfidCode.trim() === '') || [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCheckins = checkins?.filter(c => c.type === 'checkin' && new Date(c.timestamp) >= todayStart).length || 0;

  const filteredActive = activeBadgeMembers.filter(m => {
    const q = searchTerm.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const phone = m.phone.replace(/[\s\-\+\(\)]/g, '').includes(q.replace(/[\s\-\+\(\)]/g, ''));
    const rfid = m.rfidCode?.toLowerCase().includes(q);
    return name.includes(q) || phone || rfid;
  }).filter(m => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  }).sort((a, b) => {
    if (sortField === 'name') {
      const an = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bn = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
    }
    const ad = new Date(a.createdAt).getTime();
    const bd = new Date(b.createdAt).getTime();
    return sortDir === 'asc' ? ad - bd : bd - ad;
  });

  const blockedMembersList = blockedMembers.sort((a, b) => {
    const ad = a.blockDate ? new Date(a.blockDate).getTime() : 0;
    const bd = b.blockDate ? new Date(b.blockDate).getTime() : 0;
    return bd - ad;
  });

  const handleDissociate = useCallback(async (member: Member) => {
    await db.members.update(member.id!, { rfidCode: '', updatedAt: new Date() });
    setShowDissociateModal(null);
  }, []);

  const handleUnblock = useCallback(async (member: Member) => {
    await db.members.update(member.id!, {
      isBlocked: false,
      blockReason: undefined,
      blockDate: undefined,
      blockedUntil: undefined,
      status: 'active',
      updatedAt: new Date(),
    });
    setUnblockConfirm(null);
  }, []);

  const handleAssociate = useCallback(async () => {
    if (!selectedMember || !rfidInput.trim()) return;
    const existing = allMembers?.find(m => m.rfidCode === rfidInput.trim() && m.id !== selectedMember.id);
    if (existing) {
      alert(`Ce code RFID est déjà associé à ${existing.firstName} ${existing.lastName}`);
      return;
    }
    await db.members.update(selectedMember.id!, { rfidCode: rfidInput.trim(), updatedAt: new Date() });
    setAssociateSuccess({ name: `${selectedMember.firstName} ${selectedMember.lastName}`, code: rfidInput.trim() });
    setSelectedMember(null);
    setRfidInput('');
  }, [selectedMember, rfidInput, allMembers]);

  const handleRfidKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedMember && rfidInput.trim()) {
      handleAssociate();
    }
  }, [selectedMember, rfidInput, handleAssociate]);

  const memberCheckins = showHistoryModal
    ? (checkins?.filter(c => c.memberId === showHistoryModal.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50) ?? [])
    : [];

  const blockReasons = [
    'Bagarre',
    'Insulte / Harcelement',
    'Comportement vulgaire',
    'Non-paiement récurrent',
    'Vol',
    'Dommage matériel',
    'Autre'
  ];

  const getStatusBadge = (m: Member) => {
    if (m.isBlocked) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">Bloqué</span>;
    }
    if (m.status === 'active') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">Actif</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">Inactif</span>;
  };

  const filteredAssociateMembers = membersWithoutRFID.filter(m => {
    if (!associateSearch) return true;
    const q = associateSearch.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const phone = m.phone.replace(/[\s\-\+\(\)]/g, '').includes(q.replace(/[\s\-\+\(\)]/g, ''));
    return name.includes(q) || phone;
  });

  useEffect(() => {
    if (showAssociateModal && rfidInputRef.current) {
      setTimeout(() => rfidInputRef.current?.focus(), 100);
    }
  }, [showAssociateModal]);

  return (
    <div className="space-y-6 font-sans">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Badges</p>
              <p className="text-xl font-bold text-white">{membersWithRFID.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Badges Actifs</p>
              <p className="text-xl font-bold text-green-400">{activeBadgeMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Badges Bloqués</p>
              <p className="text-xl font-bold text-red-400">{blockedMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Entrées Aujourd&apos;hui</p>
              <p className="text-xl font-bold text-blue-400">{todayCheckins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Gestion RFID</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {membersWithRFID.length} badges · {activeBadgeMembers.length} actifs · {blockedMembers.length} bloqués
          </p>
        </div>
        <button
          onClick={() => { setShowAssociateModal(true); setAssociateSuccess(null); }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"
        >
          <Plus className="w-5 h-5" /> Associer un badge
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          Badges Actifs ({activeBadgeMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'blocked' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          Badges Bloqués ({blockedMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('associate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'associate' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          Associer un badge
        </button>
      </div>

      {/* Tab: Active Badges */}
      {activeTab === 'active' && (
        <div>
          {/* Search & Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou code RFID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            <button
              onClick={() => { setSortField(sortField === 'name' ? 'date' : 'name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 text-sm hover:text-white"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortField === 'name' ? 'Nom' : 'Date'}
              {sortDir === 'asc' ? ' ↑' : ' ↓'}
            </button>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Membre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Téléphone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code RFID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Date naissance</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'Aucun badge trouvé' : 'Aucun badge actif'}
                    </td>
                  </tr>
                ) : (
                  filteredActive.map(m => (
                    <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                            {m.photo ? <Image src={m.photo} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white truncate max-w-[120px]">{m.firstName} {m.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 hidden sm:table-cell">{m.phone}</td>
                      <td className="px-4 py-3">
                        <code className="text-sm font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">{m.rfidCode}</code>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(m)}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{toDisplayDate(m.birthDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setShowDissociateModal(m)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300"
                            title="Dissocier"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setBlockingMember(m); setShowBlockModal(true); setBlockReason(''); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 hover:text-red-400"
                            title="Bloquer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowHistoryModal(m)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                            title="Voir historique"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Blocked Badges */}
      {activeTab === 'blocked' && (
        <div>
          {blockedMembersList.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <ShieldOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Aucun badge bloqué</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedMembersList.map(m => (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                        {m.photo ? <Image src={m.photo} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-gray-500">
                          <code className="text-orange-400">{m.rfidCode}</code>
                          {m.blockDate && <span className="ml-2">Bloqué le {formatDate(new Date(m.blockDate))}</span>}
                        </p>
                        {m.blockReason && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-red-400">{m.blockReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUnblockConfirm(m)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm hover:bg-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4" /> Débloquer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Associate Badge */}
      {activeTab === 'associate' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Link className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Associer un badge RFID</h2>
              <p className="text-sm text-gray-500 mt-1">Sélectionnez un membre, puis passez le badge ou saisissez le code</p>
            </div>

            {associateSuccess ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Badge associé avec succès</h3>
                <p className="text-sm text-gray-400 mb-1">{associateSuccess.name}</p>
                <code className="text-sm font-mono text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg">{associateSuccess.code}</code>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={() => { setAssociateSuccess(null); setSelectedMember(null); setRfidInput(''); }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 text-sm"
                  >
                    Associer un autre badge
                  </button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 text-sm"
                  >
                    Voir les badges actifs
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Member search & selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">1. Rechercher un membre</label>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou téléphone..."
                    value={associateSearch}
                    onChange={e => { setAssociateSearch(e.target.value); setSelectedMember(null); }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                {associateSearch && (
                  <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-xl border border-gray-700">
                    {filteredAssociateMembers.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">Aucun membre trouvé</p>
                    ) : (
                      filteredAssociateMembers.slice(0, 10).map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMember(m); setAssociateSearch(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${selectedMember?.id === m.id ? 'bg-orange-500/10' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                            {m.photo ? <Image src={m.photo} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{m.firstName} {m.lastName}</p>
                            <p className="text-xs text-gray-500">{m.phone}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                      {selectedMember.photo ? <Image src={selectedMember.photo} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{selectedMember.firstName} {selectedMember.lastName}</p>
                      <p className="text-xs text-gray-400">{selectedMember.phone}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="p-1.5 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* RFID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">2. Code RFID</label>
                  <input
                    ref={rfidInputRef}
                    type="text"
                    value={rfidInput}
                    onChange={e => setRfidInput(e.target.value)}
                    onKeyDown={handleRfidKeyDown}
                    placeholder="Passez le badge ou saisissez le code..."
                    className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-mono tracking-widest text-center focus:outline-none focus:border-orange-500"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Passez le badge RFID devant le lecteur ou tapez le code manuellement, puis appuyez sur Entrée
                  </p>
                </div>

                {/* Associate Button */}
                <button
                  onClick={handleAssociate}
                  disabled={!selectedMember || !rfidInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Associer le badge
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dissociate Modal */}
      {showDissociateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <Unlink className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Dissocier le badge</h3>
              <p className="text-sm text-gray-400 mt-1">
                {showDissociateModal.firstName} {showDissociateModal.lastName}
              </p>
              <code className="text-sm font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg inline-block mt-2">
                {showDissociateModal.rfidCode}
              </code>
            </div>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Le badge sera dissocié du membre. Cette action peut être annulée en réassociant le badge.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDissociateModal(null)}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDissociate(showDissociateModal)}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Dissocier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-red-400">Bloquer le badge</h3>
              <button onClick={() => { setShowBlockModal(false); setBlockingMember(null); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4 flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                {blockingMember?.photo ? <Image src={blockingMember.photo} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{blockingMember?.firstName} {blockingMember?.lastName}</p>
                <code className="text-xs font-mono text-orange-400">{blockingMember?.rfidCode}</code>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Motif du blocage</label>
                <select
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Sélectionner un motif</option>
                  {blockReasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">Le badge sera bloqué et le membre ne pourra plus accéder à la salle.</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!blockingMember || !blockReason) return;
                await db.members.update(blockingMember.id!, {
                  isBlocked: true,
                  blockReason,
                  blockDate: new Date(),
                  status: 'inactive',
                  updatedAt: new Date(),
                });
                setShowBlockModal(false);
                setBlockingMember(null);
                setBlockReason('');
              }}
              disabled={!blockReason}
              className="w-full mt-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              Confirmer le blocage
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                  {showHistoryModal.photo ? <Image src={showHistoryModal.photo} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Historique d&apos;accès</h3>
                  <p className="text-sm text-gray-400">{showHistoryModal.firstName} {showHistoryModal.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {memberCheckins.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Aucun historique d&apos;accès</p>
              </div>
            ) : (
              <div className="space-y-2">
                {memberCheckins.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.type === 'checkin' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {c.type === 'checkin' ? <ArrowUpDown className="w-4 h-4 text-green-400" /> : <ArrowUpDown className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {c.type === 'checkin' ? 'Entrée' : 'Sortie'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(new Date(c.timestamp))}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.type === 'checkin' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.type === 'checkin' ? 'IN' : 'OUT'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unblock Confirmation */}
      {unblockConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Débloquer le badge</h3>
              <p className="text-sm text-gray-400 mt-1">
                {unblockConfirm.firstName} {unblockConfirm.lastName}
              </p>
              {unblockConfirm.blockReason && (
                <p className="text-xs text-red-400 mt-1">Motif: {unblockConfirm.blockReason}</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Le membre pourra à nouveau accéder à la salle avec son badge.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUnblockConfirm(null)}
                className="flex-1 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUnblock(unblockConfirm)}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Débloquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Modal (triggered from header button) */}
      {showAssociateModal && activeTab !== 'associate' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Link className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Associer un badge</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">Sélectionnez un membre et associez un code RFID</p>
              </div>
              <button onClick={() => { setShowAssociateModal(false); setAssociateSuccess(null); setSelectedMember(null); setRfidInput(''); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {associateSuccess ? (
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Badge associé avec succès</h3>
                <p className="text-sm text-gray-400 mb-1">{associateSuccess.name}</p>
                <code className="text-sm font-mono text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg">{associateSuccess.code}</code>
                <button
                  onClick={() => { setAssociateSuccess(null); setSelectedMember(null); setRfidInput(''); }}
                  className="w-full mt-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700"
                >
                  Associer un autre badge
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">1. Rechercher un membre</label>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou téléphone..."
                    value={associateSearch}
                    onChange={e => { setAssociateSearch(e.target.value); setSelectedMember(null); }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                {associateSearch && (
                  <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-xl border border-gray-700">
                    {filteredAssociateMembers.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">Aucun membre trouvé</p>
                    ) : (
                      filteredAssociateMembers.slice(0, 10).map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMember(m); setAssociateSearch(''); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${selectedMember?.id === m.id ? 'bg-orange-500/10' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                            {m.photo ? <Image src={m.photo} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{m.firstName} {m.lastName}</p>
                            <p className="text-xs text-gray-500">{m.phone}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                      {selectedMember.photo ? <Image src={selectedMember.photo} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{selectedMember.firstName} {selectedMember.lastName}</p>
                      <p className="text-xs text-gray-400">{selectedMember.phone}</p>
                    </div>
                    <button onClick={() => setSelectedMember(null)} className="p-1.5 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">2. Code RFID</label>
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={e => setRfidInput(e.target.value)}
                    onKeyDown={handleRfidKeyDown}
                    placeholder="Passez le badge ou saisissez le code..."
                    className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-mono tracking-widest text-center focus:outline-none focus:border-orange-500"
                    autoComplete="off"
                  />
                </div>

                <button
                  onClick={handleAssociate}
                  disabled={!selectedMember || !rfidInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                >
                  Associer le badge
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
