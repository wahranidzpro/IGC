'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import IGCQRCode from '@/components/IGCQRCode';
import { db, Member, Program, SubscriptionType, SubscriptionDuration } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useRef, useCallback } from 'react';
import { Scan, Search, Plus, X, Award, CheckCircle, XCircle, Camera, User, QrCode, Wallet, Star, Dumbbell, Edit, Trash2, Ban, Fingerprint } from 'lucide-react';
import { getMemberQRValue, parseMemberIdFromQR, getQrWhatsAppMessage, openWhatsAppDirect, formatPhoneDisplay } from '@/lib/whatsapp';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';
import { logAudit } from '@/lib/audit';
import { earnPoints, getLoyaltyConfig, spendPoints, calculatePointsValue, calculateMaxDiscount } from '@/lib/loyalty';
import { useSyncAfterSave } from '@/hooks/useCloudSync';

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function parseQRMemberId(code: string): number | null {
  return parseMemberIdFromQR(code);
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function toISODate(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return display;
  const [dd, mm, yyyy] = parts;
  if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) return `${yyyy}-${mm}-${dd}`;
  return display;
}

const durationLabels: Record<string, string> = {
  '1_mois': '1 Mois',
  '2_mois': '2 Mois',
  '3_mois': '3 Mois',
  '6_mois': '6 Mois',
  '12_mois': '12 Mois',
};

const sessionsPerDuration: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 360,
};

const durationDays: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 360,
};

function computeExpiryDate(member: Member): Date | null {
  if (member.subscriptionType !== 'subscription' || !member.subscriptionDuration) return null;
  const days = durationDays[member.subscriptionDuration];
  if (!days) return null;
  const created = new Date(member.createdAt);
  return new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
}

function computeMemberStatus(member: Member): { status: 'active' | 'expired' | 'inactive'; daysLeft: number; subscriptionDisplay: string; expiresAt?: string } {
  let subscriptionDisplay = '-';
  let expiresAt: string | undefined;
  
  if (member.subscriptionType === 'free_session') {
    subscriptionDisplay = `Séance libre (${member.sessionsLeft || 0} séances)`;
    return { status: (member.sessionsLeft || 0) > 0 ? 'active' : 'expired', daysLeft: 0, subscriptionDisplay };
  }
  if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
    const expiry = computeExpiryDate(member);
    if (!expiry) return { status: 'inactive', daysLeft: 0, subscriptionDisplay: 'Aucun abonnement' };
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const durationMap: Record<string, string> = { '1_mois': '1 mois', '2_mois': '2 mois', '3_mois': '3 mois', '6_mois': '6 mois', '12_mois': '12 mois' };
    subscriptionDisplay = durationMap[member.subscriptionDuration] || member.subscriptionDuration;
    expiresAt = expiry.toLocaleDateString('fr-FR');
    if (diff <= 0) return { status: 'expired', daysLeft: 0, subscriptionDisplay, expiresAt };
    return { status: 'active', daysLeft, subscriptionDisplay, expiresAt };
  }
  return { status: 'inactive', daysLeft: 0, subscriptionDisplay: 'Aucun abonnement' };
}

export default function MembersPage() {
  const { role, user } = useAuth();
  const coachId = role === 'coach' ? user?.coachId : undefined;
  const { triggerSync } = useSyncAfterSave();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive' | 'blocked'>('all');
  const [sortField, setSortField] = useState<'name' | 'phone' | 'subscription' | 'program' | 'sessions' | 'points' | 'payment' | 'balance' | 'status' | 'joinDate'>('joinDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [showQr, setShowQr] = useState<Member | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showRecharge, setShowRecharge] = useState<Member | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showQrAfterSave, setShowQrAfterSave] = useState(false);
  const [savedMemberData, setSavedMemberData] = useState<{ name: string; phone: string; qrValue: string; rfidCode: string } | null>(null);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidAssociateMember, setRfidAssociateMember] = useState<Member | null>(null);
  const [rfidScanInput, setRfidScanInput] = useState('');
  const [rfidScanStatus, setRfidScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<{
  firstName: string; lastName: string; phone: string; birthDate: string;
  address: string; gender: 'male' | 'female' | 'other';
  bloodType: string; photo: string; coachId: number; programId: number;
  sessionsLeft: number; programAmount: number; amountPaid: number; balanceDue: number; discount: number; advance: number;
  rfidCode: string;
  referredBy: number;
  subscriptionType: SubscriptionType;
  subscriptionDuration: SubscriptionDuration | '';
  email: string; emergencyContactName: string; emergencyContactPhone: string; allergies: string; allergiesOther: string;
  weight: number | undefined; weightCurrent: number | undefined; height: number | undefined;
  fitnessGoal: string; experienceLevel: string;
}>({
    firstName: '', lastName: '', phone: '', birthDate: '',
    address: '', gender: 'male',
    bloodType: '', photo: '', coachId: 0, programId: 0,
    sessionsLeft: sessionsPerDuration['1_mois'], programAmount: 0, amountPaid: 0, balanceDue: 0, discount: 0, advance: 0,
    rfidCode: '',
    referredBy: 0,
    subscriptionType: 'subscription',
    subscriptionDuration: '1_mois',
email: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '', allergiesOther: '',
    weight: undefined, weightCurrent: undefined, height: undefined,
    fitnessGoal: '', experienceLevel: ''
  });
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const members = useLiveQuery(() => {
    const query = role === 'coach' && coachId ? db.members.where('coachId').equals(coachId) : db.members.toCollection();
    return query.offset(page * pageSize).limit(pageSize).toArray();
  }, [coachId, role, page]);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const programs = useLiveQuery(() => db.programs.toArray(), []);

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

  

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', phone: '', birthDate: '', address: '', gender: 'male', bloodType: '', photo: '', coachId: 0, programId: 0, sessionsLeft: sessionsPerDuration['1_mois'], programAmount: 0, amountPaid: 0, balanceDue: 0, discount: 0, advance: 0, rfidCode: '', referredBy: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', email: '', emergencyContactName: '', emergencyContactPhone: '', allergies: '', allergiesOther: '', weight: undefined, weightCurrent: undefined, height: undefined, fitnessGoal: '', experienceLevel: '' });
    setPhotoPreview('');
    setEditMember(null);
  };

  const openEdit = (m: Member) => {
    setFormData({
      firstName: m.firstName, lastName: m.lastName, phone: m.phone, birthDate: m.birthDate,
      address: m.address || '', gender: m.gender || 'male', bloodType: m.bloodType || '',
      photo: m.photo || '', coachId: m.coachId || 0, programId: m.programId || 0,
      sessionsLeft: m.sessionsLeft || 0, programAmount: m.programAmount || 0,
      amountPaid: m.amountPaid || 0,
      balanceDue: m.balanceDue || 0, discount: m.discount || 0, advance: m.advance || 0,
      rfidCode: m.rfidCode || '',
      referredBy: m.referredBy || 0,
      subscriptionType: m.subscriptionType || 'subscription',
      subscriptionDuration: m.subscriptionDuration || '1_mois',
      email: m.email || '', emergencyContactName: m.emergencyContactName || '', emergencyContactPhone: m.emergencyContactPhone || '',
      allergies: m.allergies || '', allergiesOther: (m as any).allergiesOther || '', weight: m.weight !== undefined ? m.weight : undefined, weightCurrent: m.weightCurrent !== undefined ? m.weightCurrent : undefined, height: m.height !== undefined ? m.height : undefined,
      fitnessGoal: m.fitnessGoal || '', experienceLevel: m.experienceLevel || ''
    });
    setPhotoPreview(m.photo || '');
    setEditMember(m);
    setShowAddModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPhotoPreview(result);
        setFormData({ ...formData, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.birthDate) return;

    if (!editMember?.id) {
      const duplicate = await db.members
        .where('firstName').equals(formData.firstName)
        .and(m => m.lastName === formData.lastName && m.birthDate === formData.birthDate && m.phone === formData.phone)
        .first();
      if (duplicate) {
        alert(`⚠️ Doublon détecté :\n\nUn membre avec les mêmes informations existe déjà :\n\nNom : ${duplicate.firstName} ${duplicate.lastName}\nTéléphone : ${duplicate.phone}\nDate naissance : ${duplicate.birthDate}\n\nVeuillez vérifier les informations avant d'ajouter ce membre.`);
        return;
      }
    }

    const updateData = {
      ...formData,
      fitnessGoal: formData.fitnessGoal || undefined,
      experienceLevel: formData.experienceLevel || undefined,
      updatedAt: new Date(),
      syncStatus: 'pending' as const,
    };
    if (editMember?.id) {
      const oldData = JSON.stringify({ nom: `${editMember.firstName} ${editMember.lastName}`, tel: editMember.phone, statut: editMember.status, solde: editMember.balanceDue });
      const newData = JSON.stringify({ nom: `${formData.firstName} ${formData.lastName}`, tel: formData.phone, statut: formData.subscriptionType, solde: formData.balanceDue });
      await db.members.update(editMember.id, updateData);
      await logAudit({ action: 'member_edit', memberId: editMember.id, memberName: `${formData.firstName} ${formData.lastName}`, oldValue: oldData, newValue: newData }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      resetForm();
      setShowAddModal(false);
      triggerSync();
    } else {
      const now = new Date();
      const id = await db.members.add({ ...updateData, status: 'active', fidelityPoints: 0, createdAt: now });
      // Auto-payment and points for subscription creation
      if (formData.subscriptionType === 'subscription' && formData.amountPaid > 0) {
        const paymentId = await db.payments.add({
          memberId: id,
          amount: formData.amountPaid,
          type: 'subscription',
          mode: 'cash',
          date: now,
          description: `Paiement abonnement ${formData.subscriptionDuration || ''}`,
          createdAt: now,
        });
        const memberName = `${formData.firstName} ${formData.lastName}`;
        await earnPoints(id, memberName, formData.amountPaid, paymentId, 'subscription');
      }
      // Auto-points for referral
      if (formData.referredBy && formData.referredBy > 0) {
        const sponsor = await db.members.get(formData.referredBy);
        if (sponsor) {
          const sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
          await earnPoints(formData.referredBy, sponsorName, 500, id, 'subscription');
        }
      }
      await logAudit({ action: 'member_create', memberId: id, memberName: `${formData.firstName} ${formData.lastName}`, newValue: JSON.stringify({ nom: `${formData.firstName} ${formData.lastName}`, tel: formData.phone, abonnement: formData.subscriptionType }) }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      resetForm();
      setShowAddModal(false);
      triggerSync();
      const qrValue = getMemberQRValue(id);
      setSavedMemberData({ name: `${updateData.firstName} ${updateData.lastName}`, phone: updateData.phone, qrValue, rfidCode: updateData.rfidCode || '' });
      setShowQrAfterSave(true);
    }
  };

  const handleEdit = (m: Member) => {
    setFormData({
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      birthDate: m.birthDate,
      address: m.address,
      gender: m.gender,
      bloodType: m.bloodType || '',
      photo: m.photo || '',
      coachId: m.coachId || 0,
      programId: m.programId || 0,
      sessionsLeft: m.sessionsLeft || 0,
      programAmount: m.programAmount || 0,
      amountPaid: m.amountPaid || 0,
      balanceDue: m.balanceDue || 0,
      discount: m.discount || 0,
      advance: m.advance || 0,
      subscriptionType: m.subscriptionType,
      subscriptionDuration: m.subscriptionDuration || '',
      email: m.email || '',
      emergencyContactName: m.emergencyContactName || '',
      emergencyContactPhone: m.emergencyContactPhone || '',
      allergies: m.allergies || '',
      allergiesOther: (m as any).allergiesOther || '',
      weight: m.weight,
      weightCurrent: m.weightCurrent,
      height: m.height,
      fitnessGoal: m.fitnessGoal || '',
      experienceLevel: m.experienceLevel || '',
      rfidCode: m.rfidCode || '',
      referredBy: m.referredBy || 0,
    });
    setEditMember(m);
    setShowAddModal(true);
  };

  const handleRecharge = (m: Member) => {
    setShowRecharge(m);
    setRechargeAmount(0);
  };

  const toggleStatus = async (member: Member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    await db.members.update(member.id!, { status: newStatus, updatedAt: new Date() });
  };

  const deleteMember = async (member: Member) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${member.firstName} ${member.lastName}" ?\nCette action est irréversible.`)) {
      await logAudit({ action: 'member_delete', memberId: member.id, memberName: `${member.firstName} ${member.lastName}`, oldValue: JSON.stringify({ statut: member.status, solde: member.balanceDue, avance: member.advance }) }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      await db.members.delete(member.id!);
    }
  };

  const blockReasons = [
    'Bagarre',
    'Insulte / Harcelement',
    'Comportement vulgaire',
    'Non-paiement récurrent',
    'Vol',
    'Dommage matériel',
    'Autre'
  ];

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingMember, setBlockingMember] = useState<Member | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockDays, setBlockDays] = useState<number>(30);

  const openBlockModal = (m: Member) => { setBlockingMember(m); setShowBlockModal(true); };
  
  const confirmBlock = async () => {
    if (!blockingMember || !blockReason) return;
    const updates: any = {
      isBlocked: true,
      blockReason,
      blockDate: new Date(),
      status: 'inactive',
      updatedAt: new Date()
    };
    if (blockDays > 0) {
      const until = new Date();
      until.setDate(until.getDate() + blockDays);
      updates.blockedUntil = until;
    }
    await logAudit({ action: 'member_block', memberId: blockingMember.id, memberName: `${blockingMember.firstName} ${blockingMember.lastName}`, newValue: blockReason, reason: blockDays > 0 ? `Bloque ${blockDays} jours` : 'Bloque indefini' }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
    await db.members.update(blockingMember.id!, updates);
    setShowBlockModal(false);
    setBlockingMember(null);
    setBlockReason('');
    setBlockDays(30);
  };

  const unblockMember = async (member: Member) => {
    if (confirm(`Débloquer ${member.firstName} ${member.lastName} ?\nIl pourra à nouveau accéder à la salle.`)) {
      await logAudit({ action: 'member_unblock', memberId: member.id, memberName: `${member.firstName} ${member.lastName}`, oldValue: member.blockReason || 'Bloque' }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      await db.members.update(member.id!, {
        isBlocked: false,
        blockReason: undefined,
        blockDate: undefined,
        blockedUntil: undefined,
        status: 'active',
        updatedAt: new Date()
      });
    }
  };

  const getGenderLabel = (g?: string) => g === 'male' ? 'Homme' : g === 'female' ? 'Femme' : 'Autre';
  const getSubLabel = (t?: string) => t === 'free_session' ? 'Séance libre' : 'Abonnement';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Rechercher par nom, téléphone, QR ou date naissance" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1, color: 'var(--text)' }} />
          <button onClick={() => setShowScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:text-orange-400 transition-colors" style={{ color: 'var(--text-muted)' }} title="Scanner QR"><Scan className="w-5 h-5" /></button>
        </div>
        {role !== 'coach' && (
          <div className="flex items-center gap-2">
            <ImportExportButtons
              onExport={() => { const data = members?.map(({ id, ...rest }) => rest) || []; exportToXlsx(data, 'membres'); }}
              onImport={() => importFromXlsx<Member>(async (items) => { await db.members.bulkAdd(items.map(item => ({ ...item, createdAt: new Date(), updatedAt: new Date() }))); })}
            />
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Membre</button>
          </div>
        )}
      </div>

      {/* Filtres par statut */}
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
              {role !== 'coach' && <th className="text-left px-3 py-3 text-xs font-medium hidden lg:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('payment'); setSortDir(sortDir === 'asc' && sortField === 'payment' ? 'desc' : 'asc'); }}>Paiement {sortField === 'payment' && (sortDir === 'asc' ? '↑' : '↓')}</th>}
              {role !== 'coach' && <th className="text-left px-3 py-3 text-xs font-medium hidden xl:table-cell cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('balance'); setSortDir(sortDir === 'asc' && sortField === 'balance' ? 'desc' : 'asc'); }}>Reste {sortField === 'balance' && (sortDir === 'asc' ? '↑' : '↓')}</th>}
              <th className="text-left px-3 py-3 text-xs font-medium hidden xl:table-cell" style={{ color: 'var(--text-muted)' }}>Carte</th>
              <th className="text-center px-2 py-3 text-xs font-medium cursor-pointer hover:text-orange-400" style={{ color: 'var(--text-muted)' }} onClick={() => { setSortField('status'); setSortDir(sortDir === 'asc' && sortField === 'status' ? 'desc' : 'asc'); }}>Statut {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              {role !== 'coach' && <th className="text-center px-2 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>}
            </tr>
          </thead>
          <tbody className="">
              {filteredMembers?.length === 0 ? (
                <tr><td colSpan={role !== 'coach' ? 12 : 10} className="px-6 py-12 text-center text-gray-500">Aucun membre trouvé</td></tr>
              ) : (
                filteredMembers?.map((m, idx) => {
                  const computed = computeMemberStatus(m);
                  return (
                  <tr key={m.id} style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                    <td className="px-2 py-3 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }}>
                          {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5" style={{ color: 'var(--text-muted)' }} />}
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
                    {role !== 'coach' && (
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
                    {role !== 'coach' && (
                      <td className="px-2 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setRfidAssociateMember(m); setRfidScanInput(''); setRfidScanStatus('idle'); setShowRfidModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-orange-400" title="Associer badge RFID"><Fingerprint className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white" title="Modifier"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setShowQr(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white" title="QR Code"><QrCode className="w-4 h-4" /></button>
                          <button onClick={() => handleRecharge(m)} className="p-1.5 rounded-lg hover:bg-gray-700 text-purple-400 hover:text-purple-300" title="Recharger"><Wallet className="w-4 h-4" /></button>
                          <button onClick={() => deleteMember(m)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                          {!m.isBlocked ? <button onClick={() => { setBlockingMember(m); setShowBlockModal(true); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 hover:text-red-400" title="Bloquer"><Ban className="w-4 h-4" /></button> : <button onClick={() => unblockMember(m)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30" title="Débloquer"><CheckCircle className="w-4 h-4" /></button>}
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

        {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editMember ? 'Modifier' : 'Nouveau'} Membre</h3>
              <button onClick={() => { resetForm(); setShowAddModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-4 mb-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-800 overflow-hidden border-2 border-gray-700">
                    {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-500" />}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <span className="text-sm text-gray-400">Photo</span>
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Prénom</label><input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Nom</label><input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Date de naissance (jj/mm/aaaa)</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} placeholder="jj/mm/aaaa" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Adresse</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Sexe</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option></select></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Groupe sanguin</label><select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">--</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Coach</label><select value={formData.coachId} onChange={e => setFormData({...formData, coachId: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value={0}>Aucun</option>{coaches?.map(c => <option key={c.id} value={c.id!}>{c.name}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Programme</label><select value={formData.programId} onChange={e => { const pid = Number(e.target.value); const p = programs?.find(pr => pr.id === pid); const price = p?.price || 0; const newProgramAmount = price; const newBalanceDue = formData.amountPaid <= newProgramAmount ? newProgramAmount - formData.amountPaid : 0; const newAdvance = formData.amountPaid > newProgramAmount ? formData.advance + (formData.amountPaid - newProgramAmount) : formData.advance; setFormData({...formData, programId: pid, programAmount: newProgramAmount, balanceDue: newBalanceDue, advance: newAdvance }); }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value={0}>Sélectionner</option>{programs?.map(p => <option key={p.id} value={p.id!}>{p.name} - {(p.price || 0).toLocaleString()} DA</option>)}</select></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Abonnement</h4>
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Type</label><select value={formData.subscriptionType} onChange={e => {
                const t = e.target.value as SubscriptionType;
                const dur = t === 'subscription' ? (formData.subscriptionDuration || '1_mois') : '';
                setFormData({...formData, subscriptionType: t, sessionsLeft: t === 'subscription' ? sessionsPerDuration[dur] : formData.sessionsLeft });
              }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="subscription">Abonnement</option><option value="free_session">Séance libre</option></select></div>
              {formData.subscriptionType === 'subscription' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Durée</label>
                  <select value={formData.subscriptionDuration} onChange={e => {
                    const dur = e.target.value as SubscriptionDuration;
                    const sessions = sessionsPerDuration[dur] || 0;
                    setFormData({...formData, subscriptionDuration: dur, sessionsLeft: sessions });
                  }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
                    <option value="1_mois">1 Mois</option>
                    <option value="2_mois">2 Mois</option>
                    <option value="3_mois">3 Mois</option>
                    <option value="6_mois">6 Mois</option>
                    <option value="12_mois">12 Mois</option>
                  </select>
                  <p className="text-[10px] text-green-400 mt-1">{formData.sessionsLeft || sessionsPerDuration[formData.subscriptionDuration]} séances inclues</p>
                </div>
              )}
              {formData.subscriptionType === 'free_session' && (
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Séances restantes</label><input type="number" value={formData.sessionsLeft} onChange={e => setFormData({...formData, sessionsLeft: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              )}

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Paiement</h4>
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Montant programme (DA)</label><input type="number" value={formData.programAmount} onChange={e => { const v = Number(e.target.value); if (formData.amountPaid <= v) { setFormData({...formData, programAmount: v, balanceDue: v - formData.amountPaid, advance: formData.advance }); } else { const overpaid = formData.amountPaid - v; setFormData({...formData, programAmount: v, balanceDue: 0, advance: formData.advance + overpaid }); } }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Montant versé (DA)</label><input type="number" value={formData.amountPaid} onChange={e => { const v = Number(e.target.value); if (v <= formData.programAmount) { setFormData({...formData, amountPaid: v, balanceDue: formData.programAmount - v, advance: formData.advance }); } else { const overpaid = v - formData.programAmount; setFormData({...formData, amountPaid: v, balanceDue: 0, advance: formData.advance + overpaid }); } }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Reste à payer (DA)</label><input type="number" value={formData.balanceDue} readOnly className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm opacity-70 cursor-not-allowed" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Remise (DA)</label><input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Avance (DA)</label><input type="number" value={formData.advance} onChange={e => setFormData({...formData, advance: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Accès</h4>
              </div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Badge RFID/NFC</label><input type="text" value={formData.rfidCode} onChange={e => setFormData({...formData, rfidCode: e.target.value})} placeholder="Scannez le badge ou entrez le numéro manuellement" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Parrainé par</label>
                <select value={formData.referredBy || 0} onChange={e => setFormData({...formData, referredBy: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value={0}>Aucun parrain</option>
                  {members?.map(m => <option key={m.id} value={m.id!}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Plus de détails</h4>
              </div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Email (optionnel)</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemple.com" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Contact d'urgence</h4>
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Nom du contact</label><input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Nom du contact" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label><input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="Numéro de téléphone" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Notes de santé</h4>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Allergies</label>
                <select value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value, allergiesOther: e.target.value === 'Autre' ? formData.allergiesOther : ''})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="">Aucune / Sélectionner</option>
                  <option value="Arachides">Arachides</option>
                  <option value="Lactose">Lactose</option>
                  <option value="Gluten">Gluten</option>
                  <option value="Fruits de mer">Fruits de mer</option>
                  <option value="Œufs">Œufs</option>
                  <option value="Soja">Soja</option>
                  <option value="Poisson">Poisson</option>
                  <option value="Sulfites">Sulfites</option>
                  <option value="Pollen">Pollen</option>
                  <option value="Pénicilline">Pénicilline</option>
                  <option value="Abeilles">Piqûre d'abeilles</option>
                  <option value="Nickel">Nickel</option>
                  <option value="Latex">Latex</option>
                  <option value="Autre">Autre (à préciser)</option>
                </select>
                {formData.allergies === 'Autre' && (
                  <input type="text" value={formData.allergiesOther || ''} onChange={e => setFormData({...formData, allergiesOther: e.target.value})} placeholder="Précisez l'allergie..." className="w-full mt-2 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
                )}
              </div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Informations Fitness</h4>
              </div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Poids d'entrée (kg)</label><input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value ? Number(e.target.value) : undefined})} placeholder="70" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Poids actuel (kg)</label><input type="number" value={formData.weightCurrent || ''} onChange={e => setFormData({...formData, weightCurrent: e.target.value ? Number(e.target.value) : undefined})} placeholder="68" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-xs font-medium text-gray-400 mb-1">Taille (cm)</label><input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value ? Number(e.target.value) : undefined})} placeholder="175" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Objectif fitness</h4>
              </div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Sélectionner un objectif</label><select value={formData.fitnessGoal} onChange={e => setFormData({...formData, fitnessGoal: e.target.value as any})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">Sélectionner un objectif</option><option value="pertes_poids">Pertes poids</option><option value="prise_masse">Prise de masse</option><option value="tonification">Tonification</option><option value="endurance">Endurance</option><option value="forme_generale">Forme générale</option></select></div>

              <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Niveau d'expérience</h4>
              </div>
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Sélectionner le niveau</label><select value={formData.experienceLevel} onChange={e => setFormData({...formData, experienceLevel: e.target.value as any})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">Sélectionner</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="avance">Avancé</option></select></div>
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700">{editMember ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </div>
      )}

      {showQrAfterSave && savedMemberData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Membre cree avec succes</h3>
            <IGCQRCode id="qr-saved-svg" value={savedMemberData.qrValue} size={200} memberName={savedMemberData.name} />
            <button
onClick={() => {
                  const svg = document.getElementById('qr-saved-svg') as unknown as Element;
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = 300;
                      canvas.height = 300;
                      ctx?.drawImage(img, 0, 0);
                      const link = document.createElement('a');
                      link.download = `QR_${savedMemberData.name.replace(/\s/g, '_')}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Telecharger QR
            </button>
            <p className="text-xs text-gray-500 mb-4 font-mono">{savedMemberData.qrValue}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => openWhatsAppDirect(
                  savedMemberData.phone,
                  getQrWhatsAppMessage(savedMemberData.name, savedMemberData.qrValue, savedMemberData.rfidCode)
                )}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Envoyer par WhatsApp
              </button>
              <button onClick={() => { setShowQrAfterSave(false); setSavedMemberData(null); }} className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Recharge modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Recharger la carte</h3>
                <p className="text-sm text-gray-400 mt-1">{showRecharge.firstName} {showRecharge.lastName}</p>
              </div>
              <button onClick={() => { setShowRecharge(null); setUsePoints(false); setPointsToUse(0); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl">
                <span className="text-sm text-purple-400">Solde actuel</span>
                <span className="text-xl font-bold text-purple-400">{(showRecharge.advance || 0).toLocaleString()} DA</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-xl">
                <span className="text-sm text-yellow-400">Points disponibles</span>
                <span className="text-xl font-bold text-yellow-400">{showRecharge.fidelityPoints || 0} pts</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Montant a ajouter (DA)</label>
                <input type="number" value={rechargeAmount || ''} onChange={e => setRechargeAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-xl focus:outline-none focus:border-orange-500" placeholder="0" />
              </div>
              {rechargeAmount > 0 && (showRecharge.fidelityPoints || 0) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-sm text-gray-400">Utiliser des points</span>
                    <button
                      onClick={() => setUsePoints(!usePoints)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${usePoints ? 'bg-orange-500' : 'bg-gray-600'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${usePoints ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {usePoints && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Points a utiliser</label>
                      <input
                        type="number"
                        value={pointsToUse || ''}
                        onChange={e => setPointsToUse(Math.min(Number(e.target.value), showRecharge.fidelityPoints || 0))}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                        placeholder="0"
                        max={showRecharge.fidelityPoints || 0}
                      />
                      <p className="text-xs mt-1 text-gray-500">Max: {showRecharge.fidelityPoints || 0} points</p>
                    </div>
                  )}
                </div>
              )}
              {rechargeAmount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <span className="text-sm text-gray-400">Nouveau solde</span>
                    <span className="text-lg font-bold text-green-400">{(showRecharge.advance || 0) + rechargeAmount} DA</span>
                  </div>
                  {usePoints && pointsToUse > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl">
                      <span className="text-sm text-green-400">Reduction points</span>
                      <span className="text-lg font-bold text-green-400">-{calculatePointsValue(pointsToUse, { earnRateDzd: 100, earnRatePoints: 1, redemptionEnabled: true, redemptionRatePoints: 100, redemptionRateDzd: 10, redemptionMaxPercent: 50, posRedemptionEnabled: true, subscriptionRedemptionEnabled: true, earlyPaymentBonusEnabled: false, earlyPaymentMinAmount: 5000, earlyPaymentBonusPercent: 10, earlyPaymentMinMonths: 3 })} DA</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                if (rechargeAmount <= 0 || !showRecharge.id) return;
                const memberName = `${showRecharge.firstName} ${showRecharge.lastName}`;
                let pointsDiscount = 0;
                if (usePoints && pointsToUse > 0) {
                  const config = await getLoyaltyConfig();
                  const maxDiscount = calculateMaxDiscount(rechargeAmount, config);
                  const rawDiscount = calculatePointsValue(pointsToUse, config);
                  pointsDiscount = Math.min(rawDiscount, maxDiscount);
                  const result = await spendPoints(showRecharge.id, memberName, pointsToUse, `Reduction recharge: ${pointsDiscount} DA`);
                  if (!result.success) {
                    alert(result.error || 'Erreur lors de l\'utilisation des points');
                    return;
                  }
                }
                const netAmount = rechargeAmount - pointsDiscount;
                await logAudit({ action: 'member_recharge', memberId: showRecharge.id, memberName, oldValue: `${showRecharge.advance || 0} DA`, newValue: `${(showRecharge.advance || 0) + netAmount} DA` }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
                await db.members.update(showRecharge.id, { advance: (showRecharge.advance || 0) + netAmount, updatedAt: new Date() });
                const paymentId = await db.payments.add({ memberId: showRecharge.id, amount: rechargeAmount, type: 'subscription', mode: 'wallet', date: new Date(), description: pointsDiscount > 0 ? `Rechargement (reduction points: -${pointsDiscount} DA)` : 'Rechargement carte membre', createdAt: new Date() });
                await earnPoints(showRecharge.id, memberName, rechargeAmount, paymentId, 'payment');
                setShowRecharge(null);
                setRechargeAmount(0);
                setUsePoints(false);
                setPointsToUse(0);
              }}
              disabled={rechargeAmount <= 0}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
            >
              Recharger
            </button>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-red-400">Bloquer {blockingMember?.firstName} {blockingMember?.lastName}</h3>
              <button onClick={() => { setShowBlockModal(false); setBlockingMember(null); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Motif du blocage</label>
                <select value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  <option value="">Sélectionner un motif</option>
                  {blockReasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Durée du blocage</label>
                <select value={blockDays} onChange={(e) => setBlockDays(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                  {blockReason === 'Vol' && (
                    <option value={-1}>🔴 Banni (permanent)</option>
                  )}
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={365}>1 an</option>
                </select>
                {blockDays === -1 && (
                  <p className="text-red-400 text-sm mt-2 font-semibold">Blocage permanent — aucun déblocage automatique</p>
                )}
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{blockDays === -1 ? 'Cet adhérent sera banni définitivement. Action irréversible sans déblocage manuel.' : `Cet adhérent sera bloqué pendant ${blockDays} jours.`}</p>
              </div>
            </div>
            <button onClick={confirmBlock} disabled={!blockReason} className="w-full mt-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50">
              Confirmer le blocage
            </button>
          </div>
        </div>
      )}

      {showQr && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">QR Code IGC</h3>
              <button onClick={() => setShowQr(null)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <IGCQRCode id="qr-modal-svg" value={getMemberQRValue(showQr.id!)} size={200} memberName={`${showQr.firstName} ${showQr.lastName}`} />
            <p className="text-xs text-gray-500 mb-4 font-mono">RFID: {showQr.rfidCode || 'Non défini'}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const svg = document.getElementById('qr-modal-svg') as unknown as Element;
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = 300;
                      canvas.height = 300;
                      ctx?.drawImage(img, 0, 0);
                      const link = document.createElement('a');
                      link.download = `IGC_QR_${showQr.firstName}_${showQr.lastName}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Telecharger QR
              </button>
              <button
                onClick={() => openWhatsAppDirect(
                  showQr.phone,
                  getQrWhatsAppMessage(`${showQr.firstName} ${showQr.lastName}`, getMemberQRValue(showQr.id!), showQr.rfidCode || '')
                )}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm w-full"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Envoyer QR + RFID
              </button>
            </div>
            <button onClick={() => setShowQr(null)} className="w-full py-3 mt-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">Fermer</button>
          </div>
        </div>
      )}

      {showRfidModal && rfidAssociateMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Associer un badge RFID</h3>
              <button onClick={() => setShowRfidModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-800/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                {rfidAssociateMember.photo ? <img src={rfidAssociateMember.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2.5 text-gray-500" />}
              </div>
              <div>
                <p className="text-white font-semibold">{rfidAssociateMember.firstName} {rfidAssociateMember.lastName}</p>
                <p className="text-sm text-gray-400">{rfidAssociateMember.phone}</p>
                {rfidAssociateMember.rfidCode && (
                  <p className="text-xs text-orange-400 mt-1">Badge actuel: {rfidAssociateMember.rfidCode}</p>
                )}
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!rfidScanInput.trim()) return;
              const existing = await db.members.where('rfidCode').equals(rfidScanInput.trim()).first();
              if (existing && existing.id !== rfidAssociateMember.id) {
                setRfidScanStatus('error');
                setTimeout(() => setRfidScanStatus('idle'), 3000);
                return;
              }
              await db.members.update(rfidAssociateMember.id!, { rfidCode: rfidScanInput.trim(), updatedAt: new Date() });
              setRfidScanStatus('success');
              setTimeout(() => { setShowRfidModal(false); setRfidScanStatus('idle'); }, 2000);
            }}>
              <label className="block text-sm font-medium text-gray-400 mb-2">Code du badge RFID</label>
              <input
                type="text"
                value={rfidScanInput}
                onChange={(e) => setRfidScanInput(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Passez le badge ou saisissez le code..."
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white text-lg text-center focus:outline-none focus:border-orange-500 placeholder-gray-500"
                autoFocus
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Passez le badge RFID sur le lecteur, ou tapez le code manuellement</p>

              {rfidScanStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-center">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-green-400 font-medium">Badge associé avec succès !</p>
                </div>
              )}
              {rfidScanStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
                  <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                  <p className="text-red-400 font-medium">Ce badge est déjà attribué à un autre membre</p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setShowRfidModal(false)} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors">Annuler</button>
                <button type="submit" disabled={!rfidScanInput.trim()} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium">
                  Associer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}