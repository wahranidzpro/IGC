'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Scan, Plus, Dumbbell, Star, User, QrCode, Wallet, Edit, Trash2, Ban, CheckCircle, Fingerprint } from 'lucide-react';
import { ROLES } from '@/lib/constants/roles';
import { computeMemberStatus, calculateAge, getGenderLabel } from '../member-utils';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import type { Member, Program } from '@/lib/db/dexie-db';
import { db } from '@/lib/db/dexie-db';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

interface MemberTableProps {
  members: Member[];
  programs: Program[];
  role: string | null;
  coachId?: number;
  onEdit: (m: Member) => void;
  onShowQr: (m: Member) => void;
  onRecharge: (m: Member) => void;
  onDelete: (m: Member) => void;
  onBlock: (m: Member) => void;
  onUnblock: (m: Member) => void;
  onRfid: (m: Member) => void;
  onAdd: () => void;
  onScanner: () => void;
}

export default function MemberTable({
  members, programs, role,
  onEdit, onShowQr, onRecharge, onDelete, onBlock, onUnblock, onRfid, onAdd, onScanner,
}: MemberTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive' | 'blocked'>('all');
  const [sortField, setSortField] = useState<'name' | 'phone' | 'subscription' | 'program' | 'sessions' | 'points' | 'payment' | 'balance' | 'status' | 'joinDate'>('joinDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filteredMembers = members?.filter((m) => {
    const q = searchTerm.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const bd = m.birthDate.split('-').reverse().join('/');
    const year = new Date(m.birthDate).getFullYear().toString();
    const searchMatch = name.includes(q) || bd.includes(q) || year.includes(q) || m.phone.replace(/[\s\-\+\(\)]/g, '').includes(q.replace(/[\s\-\+\(\)]/g, ''));
    
    const computed = computeMemberStatus(m);
    const isBlocked = m.isBlocked === true;
    const statusMatch = statusFilter === 'all' || computed.status === statusFilter || (statusFilter === 'blocked' && isBlocked);
    
    return searchMatch && statusMatch;
  }).sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    
    switch (sortField) {
      case 'name':
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case 'phone':
        aVal = a.phone;
        bVal = b.phone;
        break;
      case 'subscription':
        aVal = a.subscriptionDuration || '';
        bVal = b.subscriptionDuration || '';
        break;
      case 'program':
        aVal = a.programId || 0;
        bVal = b.programId || 0;
        break;
      case 'sessions':
        aVal = a.sessionsLeft || 0;
        bVal = b.sessionsLeft || 0;
        break;
      case 'points':
        aVal = a.fidelityPoints || 0;
        bVal = b.fidelityPoints || 0;
        break;
      case 'payment':
        aVal = a.amountPaid || 0;
        bVal = b.amountPaid || 0;
        break;
      case 'balance':
        aVal = a.balanceDue || 0;
        bVal = b.balanceDue || 0;
        break;
      case 'status':
        aVal = computeMemberStatus(a).status;
        bVal = computeMemberStatus(b).status;
        break;
      case 'joinDate':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Rechercher par nom, téléphone, QR ou date naissance" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1, color: 'var(--text)' }} />
          <button onClick={onScanner} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:text-orange-400 transition-colors" style={{ color: 'var(--text-muted)' }} title="Scanner QR"><Scan className="w-5 h-5" /></button>
        </div>
        {role !== ROLES.COACH && (
          <div className="flex items-center gap-2">
            <ImportExportButtons
              onExport={() => { const data = members?.map(m => { const { id: _, ...rest } = m; void _; return rest; }) || []; exportToXlsx(data, 'membres'); }}
              onImport={() => importFromXlsx<Member>(async (items) => { await db.members.bulkAdd(items.map(item => ({ ...item, createdAt: new Date(), updatedAt: new Date() }))); })}
            />
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Membre</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Tous ({members?.length || 0})</button>
        <button onClick={() => setStatusFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Actifs ({members?.filter(m => computeMemberStatus(m).status === 'active' && !m.isBlocked).length || 0})</button>
        <button onClick={() => setStatusFilter('expired')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'expired' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Expirés ({members?.filter(m => computeMemberStatus(m).status === 'expired').length || 0})</button>
        <button onClick={() => setStatusFilter('inactive')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'inactive' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Inactifs ({members?.filter(m => computeMemberStatus(m).status === 'inactive').length || 0})</button>
        <button onClick={() => setStatusFilter('blocked')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'blocked' ? 'bg-black text-red-400 border border-red-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Blacklist ({members?.filter(m => m.isBlocked).length || 0})</button>
      </div>

      <div className="rounded-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderColor: 'var(--border)' }}>
              <th className="text-center px-2 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('joinDate'); setSortDir(sortDir === 'asc' && sortField === 'joinDate' ? 'desc' : 'asc'); }}># {sortField === 'joinDate' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('name'); setSortDir(sortDir === 'asc' && sortField === 'name' ? 'desc' : 'asc'); }}>Membre {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium hidden sm:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('phone'); setSortDir(sortDir === 'asc' && sortField === 'phone' ? 'desc' : 'asc'); }}>Contact {sortField === 'phone' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('subscription'); setSortDir(sortDir === 'asc' && sortField === 'subscription' ? 'desc' : 'asc'); }}>Abonnement {sortField === 'subscription' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium hidden md:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('program'); setSortDir(sortDir === 'asc' && sortField === 'program' ? 'desc' : 'asc'); }}>Programme {sortField === 'program' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('sessions'); setSortDir(sortDir === 'asc' && sortField === 'sessions' ? 'desc' : 'asc'); }}>Séances {sortField === 'sessions' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium hidden lg:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('points'); setSortDir(sortDir === 'asc' && sortField === 'points' ? 'desc' : 'asc'); }}>Points {sortField === 'points' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              {role !== ROLES.COACH && <th className="text-left px-3 py-3 text-xs font-medium hidden lg:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('payment'); setSortDir(sortDir === 'asc' && sortField === 'payment' ? 'desc' : 'asc'); }}>Paiement {sortField === 'payment' && (sortDir === 'asc' ? '↑' : '↓')}</th>}
              {role !== ROLES.COACH && <th className="text-left px-3 py-3 text-xs font-medium hidden xl:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('balance'); setSortDir(sortDir === 'asc' && sortField === 'balance' ? 'desc' : 'asc'); }}>Reste {sortField === 'balance' && (sortDir === 'asc' ? '↑' : '↓')}</th>}
              <th className="text-left px-3 py-3 text-xs font-medium hidden xl:table-cell" style={{ color: 'var(--text-muted)' }}>Carte</th>
              <th className="text-center px-2 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('status'); setSortDir(sortDir === 'asc' && sortField === 'status' ? 'desc' : 'asc'); }}>Statut {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              {role !== ROLES.COACH && <th className="text-center px-2 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>}
            </tr>
          </thead>
          <tbody className="">
            {filteredMembers?.length === 0 ? (
              <tr><td colSpan={role !== ROLES.COACH ? 12 : 10} className="px-6 py-12 text-center text-gray-500">Aucun membre trouvé</td></tr>
            ) : (
              filteredMembers?.map((m, idx) => {
                const computed = computeMemberStatus(m);
                return (
                <tr key={m.id} style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                  <td className="px-2 py-3 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }}>
                        {m.photo ? <Image src={m.photo} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5" style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate max-w-[80px]" style={{ color: 'var(--text)' }}>{m.firstName} {m.lastName}</p>
                          <span className="text-[10px] px-1 bg-orange-500/20 text-orange-400 rounded">{calculateAge(m.birthDate)}a</span>
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{getGenderLabel(m.gender)} {m.bloodType && `· ${m.bloodType}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="text-sm" style={{ color: 'var(--text)' }}>{formatPhoneDisplay(m.phone)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{computed.subscriptionDisplay}</span>
                      {computed.expiresAt && <span className="text-[10px]" style={{ color: computed.status === 'expired' ? '#ef4444' : 'var(--text-muted)' }}>Expire: {computed.expiresAt}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{programs?.find(p => p.id === m.programId)?.name || '-'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{m.sessionsLeft ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{m.fidelityPoints || 0}</span>
                    </div>
                  </td>
                  {role !== ROLES.COACH && (
                  <>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{(m.balanceDue || 0).toLocaleString()} DA</span>
                  </td>
                  <td className="px-3 py-3 hidden xl:table-cell">
                    <span className="text-sm font-medium" style={{ color: m.balanceDue && m.balanceDue > 0 ? '#ef4444' : '#22c55e' }}>{(m.balanceDue || 0) > 0 ? `${(m.balanceDue || 0).toLocaleString()} DA` : 'Payé'}</span>
                  </td>
                  <td className="px-3 py-3 hidden xl:table-cell">
                    {m.advance > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">{m.advance.toLocaleString()} DA</span>}
                  </td>
                  </>
                  )}
                  <td className="px-2 py-3 text-center">
                    {(() => {
                      const statusInfo = computeMemberStatus(m);
                      let bg = 'bg-gray-500';
                      let text = 'text-white';
                      const isBanned = m.isBlocked && !m.blockedUntil;
                      if (m.isBlocked) { bg = isBanned ? 'bg-black' : 'bg-red-600'; text = 'text-white'; }
                      else if (statusInfo.status === 'active') { bg = 'bg-green-500'; }
                      else if (statusInfo.status === 'expired') { bg = 'bg-red-500'; }
                      else if (statusInfo.status === 'inactive') { bg = 'bg-yellow-500'; }
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                          {m.isBlocked && !m.blockedUntil ? 'BANNI' : m.isBlocked ? 'BLOQUE' : statusInfo.status === 'active' ? 'Actif' : statusInfo.status === 'expired' ? 'Expiré' : statusInfo.status === 'inactive' ? 'Inactif' : 'Inconnu'}
                        </span>
                      );
                    })()}
                  </td>
                  {role !== ROLES.COACH && (
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onRfid(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-orange-400" title="Associer badge RFID"><Fingerprint className="w-4 h-4" /></button>
                        <button onClick={() => onEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white" title="Modifier"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => onShowQr(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white" title="QR Code"><QrCode className="w-4 h-4" /></button>
                        <button onClick={() => onRecharge(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-purple-400 hover:text-purple-300" title="Recharger"><Wallet className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(m)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        {!m.isBlocked ? <button onClick={() => onBlock(m)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 hover:text-red-400" title="Bloquer"><Ban className="w-4 h-4" /></button> : <button onClick={() => onUnblock(m)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30" title="Débloquer"><CheckCircle className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between mt-4 px-4 pb-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page + 1}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg disabled:opacity-50" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>Precedent</button>
            <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>Suivant</button>
          </div>
        </div>
      </div>
    </>
  );
}
