'use client';

import { useState } from 'react';
import { db, Member, Program, SubscriptionType, SubscriptionDuration } from '@/lib/db/dexie-db';
import { createUserInCloud } from '@/lib/auth/context';
import Image from 'next/image';
import { X, Camera, User } from 'lucide-react';
import { getMemberQRValue } from '@/lib/whatsapp';
import { logAudit } from '@/lib/audit';
import { earnPoints, getReferralPoints } from '@/lib/loyalty';
import { sessionsPerDuration } from '../member-utils';

interface MemberFormData {
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
  createMobileAccess: boolean; password: string;
}

interface MemberFormProps {
  open: boolean;
  editMember: Member | null;
  onClose: () => void;
  onMemberCreated: (data: { name: string; phone: string; qrValue: string; rfidCode: string }) => void;
  coaches?: { id?: number; name: string }[];
  programs?: Program[];
  members?: Member[];
  user: unknown;
  role: string | null;
}

const initialFormData: MemberFormData = {
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
  fitnessGoal: '', experienceLevel: '',
  createMobileAccess: false, password: ''
};

export default function MemberForm({ open, editMember, onClose, onMemberCreated, coaches, programs, members, user, role }: MemberFormProps) {
  const [formData, setFormData] = useState<MemberFormData>(() =>
    editMember
      ? {
          firstName: editMember.firstName, lastName: editMember.lastName, phone: editMember.phone,
          birthDate: editMember.birthDate, address: editMember.address || '',
          gender: editMember.gender || 'male', bloodType: editMember.bloodType || '',
          photo: editMember.photo || '', coachId: editMember.coachId || 0,
          programId: editMember.programId || 0, sessionsLeft: editMember.sessionsLeft || 0,
          programAmount: editMember.programAmount || 0, amountPaid: editMember.amountPaid || 0,
          balanceDue: editMember.balanceDue || 0, discount: editMember.discount || 0,
          advance: editMember.advance || 0, rfidCode: editMember.rfidCode || '',
          referredBy: editMember.referredBy || 0,
          subscriptionType: editMember.subscriptionType || 'subscription',
          subscriptionDuration: editMember.subscriptionDuration || '1_mois',
          email: editMember.email || '', emergencyContactName: editMember.emergencyContactName || '',
          emergencyContactPhone: editMember.emergencyContactPhone || '',
          allergies: editMember.allergies || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allergiesOther: ((editMember as unknown as Record<string, string>).allergiesOther) || '',
          weight: editMember.weight !== undefined ? editMember.weight : undefined,
          weightCurrent: editMember.weightCurrent !== undefined ? editMember.weightCurrent : undefined,
          height: editMember.height !== undefined ? editMember.height : undefined,
          fitnessGoal: editMember.fitnessGoal || '', experienceLevel: editMember.experienceLevel || '',
          createMobileAccess: false, password: ''
        }
      : initialFormData
  );
  const [sponsorSearch, setSponsorSearch] = useState(() =>
    editMember?.referredBy && members
      ? (members.find(s => s.id === editMember.referredBy)
          ? `${members.find(s => s.id === editMember.referredBy)!.firstName} ${members.find(s => s.id === editMember.referredBy)!.lastName}`
          : '')
      : ''
  );
  const [photoPreview, setPhotoPreview] = useState(() => editMember?.photo || '');
  const [saving, setSaving] = useState(false);

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
    if (saving) return;
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.birthDate) return;
    setSaving(true);
    try {
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
      await db.transaction('rw', [db.members, db.auditLogs], async () => {
        await db.members.update(editMember.id!, updateData);
        await logAudit({ action: 'member_edit', memberId: editMember.id!, memberName: `${formData.firstName} ${formData.lastName}`, oldValue: oldData, newValue: newData }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      });
      onClose();
    } else {
      const now = new Date();
      let id = 0;
      await db.transaction('rw', [db.members, db.payments, db.pointsLedger, db.pinUsers, db.auditLogs], async () => {
        id = await db.members.add({ ...updateData, status: 'active', fidelityPoints: 0, createdAt: now });
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
        if (formData.subscriptionType === 'free_session' && formData.amountPaid > 0) {
          const paymentId = await db.payments.add({
            memberId: id,
            amount: formData.amountPaid,
            type: 'subscription',
            mode: 'cash',
            date: now,
            description: `Paiement séance libre (${formData.sessionsLeft} séances)`,
            createdAt: now,
          });
          const memberName = `${formData.firstName} ${formData.lastName}`;
          await earnPoints(id, memberName, formData.amountPaid, paymentId, 'payment');
          await db.members.update(id, { sessionsLeft: formData.sessionsLeft });
        }
        if (formData.referredBy && formData.referredBy > 0) {
          const sponsor = await db.members.get(formData.referredBy);
          if (sponsor) {
            const sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
            const referralPoints = getReferralPoints(formData.subscriptionDuration || '');
            if (referralPoints > 0) {
              const points = await earnPoints(formData.referredBy, sponsorName, referralPoints, id, 'payment');
              try {
                await (db as unknown as { referrals: { add: (data: Record<string, unknown>) => Promise<number> } }).referrals.add({
                sponsorId: formData.referredBy, sponsorName,
                referredId: id, referredName: `${formData.firstName} ${formData.lastName}`,
                subscriptionDuration: formData.subscriptionDuration || '',
                pointsAwarded: points, status: 'awarded', createdAt: new Date(),
              }); } catch {} // referrals table not yet in schema
            }
          }
        }
        if (formData.createMobileAccess && formData.password) {
          await db.pinUsers.add({
            username: formData.phone.replace(/\s/g, ''),
            password: formData.password,
            pin: '',
            name: `${formData.firstName} ${formData.lastName}`,
            role: 'adherent' as const,
            phone: formData.phone,
            isLocked: false,
            createdAt: new Date(),
          });
        }
        await logAudit({ action: 'member_create', memberId: id, memberName: `${formData.firstName} ${formData.lastName}`, newValue: JSON.stringify({ nom: `${formData.firstName} ${formData.lastName}`, tel: formData.phone, abonnement: formData.subscriptionType }) }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
      });
      if (formData.createMobileAccess && formData.password) {
        try {
          await createUserInCloud({
            username: formData.phone.replace(/\s/g, ''),
            password: formData.password,
            pin: '',
            role: 'adherent' as const,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
          });
        } catch { /* cloud may be offline */ }
      }
      onClose();
      const qrValue = getMemberQRValue(id);
      onMemberCreated({ name: `${updateData.firstName} ${updateData.lastName}`, phone: updateData.phone, qrValue, rfidCode: updateData.rfidCode || '' });
    }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div key={editMember?.id ?? 'new'} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">{editMember ? 'Modifier' : 'Nouveau'} Membre</h3>
          <button onClick={() => { onClose(); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-800 overflow-hidden border-2 border-gray-700">
                {photoPreview ? <Image src={photoPreview} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized /> : <User className="w-full h-full p-4 text-gray-500" />}
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
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Date de naissance (jj/mm/aaaa)</label><input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} placeholder="jj/mm/aaaa" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Adresse</label><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Sexe</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'other'})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option></select></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Groupe sanguin</label><select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">--</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Coach</label><select value={formData.coachId} onChange={e => setFormData({...formData, coachId: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value={0}>Aucun</option>{coaches?.map(c => <option key={c.id} value={c.id!}>{c.name}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Programme</label><select value={formData.programId} onChange={e => { const pid = Number(e.target.value); const p = programs?.find(pr => pr.id === pid); const price = p?.price || 0; const newProgramAmount = price; const newBalanceDue = Math.max(0, newProgramAmount - formData.amountPaid - formData.discount); const newAdvance = formData.amountPaid > newProgramAmount ? formData.advance + (formData.amountPaid - newProgramAmount) : formData.advance; setFormData({...formData, programId: pid, programAmount: newProgramAmount, balanceDue: newBalanceDue, advance: newAdvance }); }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value={0}>Sélectionner</option>{programs?.map(p => <option key={p.id} value={p.id!}>{p.name} - {(p.price || 0).toLocaleString()} DA</option>)}</select></div>

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
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Montant programme (DA)</label><input type="number" value={formData.programAmount} onChange={e => { const v = Number(e.target.value); if (formData.amountPaid <= v) { setFormData({...formData, programAmount: v, balanceDue: Math.max(0, v - formData.amountPaid - formData.discount), advance: formData.advance }); } else { const overpaid = formData.amountPaid - v; setFormData({...formData, programAmount: v, balanceDue: 0, advance: formData.advance + overpaid }); } }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Montant versé (DA)</label><input type="number" value={formData.amountPaid} onChange={e => { const v = Number(e.target.value); if (v <= formData.programAmount) { setFormData({...formData, amountPaid: v, balanceDue: Math.max(0, formData.programAmount - v - formData.discount), advance: formData.advance }); } else { const overpaid = v - formData.programAmount; setFormData({...formData, amountPaid: v, balanceDue: 0, advance: formData.advance + overpaid }); } }} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Reste à payer (DA)</label><input type="number" value={formData.balanceDue} readOnly className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm opacity-70 cursor-not-allowed" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Remise (DA)</label><input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value), balanceDue: Math.max(0, formData.programAmount - formData.amountPaid - Number(e.target.value))})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Avance (DA)</label><input type="number" value={formData.advance} onChange={e => setFormData({...formData, advance: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Accès</h4>
          </div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Badge RFID/NFC</label><input type="text" value={formData.rfidCode} onChange={e => setFormData({...formData, rfidCode: e.target.value})} placeholder="Scannez le badge ou entrez le numéro manuellement" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Parrainé par</label>
            <div className="relative">
              <input type="text" placeholder="Rechercher un adhérent..."
                value={sponsorSearch} onChange={e => { setSponsorSearch(e.target.value); if (!e.target.value) setFormData({...formData, referredBy: 0}); }}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
              {sponsorSearch && (
                <div className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                  style={{ background: 'rgba(15,25,45,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {members?.filter(m => m.id !== editMember?.id && `${m.firstName} ${m.lastName}`.toLowerCase().includes(sponsorSearch.toLowerCase()))
                    .slice(0, 10).map(m => (
                      <button key={m.id} type="button" onClick={() => { setFormData({...formData, referredBy: m.id!}); setSponsorSearch(`${m.firstName} ${m.lastName}`); }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors">
                        {m.firstName} {m.lastName}
                      </button>
                    ))}
                  {members?.filter(m => m.id !== editMember?.id && `${m.firstName} ${m.lastName}`.toLowerCase().includes(sponsorSearch.toLowerCase())).length === 0 &&
                    <p className="px-3 py-2 text-sm text-gray-500">Aucun résultat</p>}
                </div>
              )}
            </div>
          </div>

          {!editMember && (
          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Accès mobile</h4>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl mb-3">
              <div>
                <span className="text-sm text-white">Créer un accès mobile</span>
                <p className="text-xs text-gray-500">L&apos;adhérent pourra se connecter sur l&apos;app mobile</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, createMobileAccess: !formData.createMobileAccess})}
                className={`relative w-12 h-6 rounded-full transition-colors ${formData.createMobileAccess ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${formData.createMobileAccess ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            {formData.createMobileAccess && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Mot de passe</label>
                <input type="text" value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Mot de passe pour l'app mobile"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
                <p className="text-[10px] text-gray-500 mt-1">Identifiant : numéro de téléphone</p>
              </div>
            )}
          </div>
          )}
          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Plus de détails</h4>
          </div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Email (optionnel)</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemple.com" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Contact d&apos;urgence</h4>
          </div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Nom du contact</label><input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Nom du contact" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label><input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value.replace(/[^0-9]/g, '')})} placeholder="Numéro de téléphone" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

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
              <option value="Abeilles">Piqûre d&apos;abeilles</option>
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
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Poids d&apos;entrée (kg)</label><input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value ? Number(e.target.value) : undefined})} placeholder="70" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Poids actuel (kg)</label><input type="number" value={formData.weightCurrent || ''} onChange={e => setFormData({...formData, weightCurrent: e.target.value ? Number(e.target.value) : undefined})} placeholder="68" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>
          <div><label className="block text-xs font-medium text-gray-400 mb-1">Taille (cm)</label><input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value ? Number(e.target.value) : undefined})} placeholder="175" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" /></div>

          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Objectif fitness</h4>
          </div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Sélectionner un objectif</label><select value={formData.fitnessGoal} onChange={e => setFormData({...formData, fitnessGoal: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">Sélectionner un objectif</option><option value="pertes_poids">Pertes poids</option><option value="prise_masse">Prise de masse</option><option value="tonification">Tonification</option><option value="endurance">Endurance</option><option value="forme_generale">Forme générale</option></select></div>

          <div className="col-span-2 border-t border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Niveau d&apos;expérience</h4>
          </div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Sélectionner le niveau</label><select value={formData.experienceLevel} onChange={e => setFormData({...formData, experienceLevel: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"><option value="">Sélectionner</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="avance">Avancé</option></select></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">{saving ? 'Enregistrement...' : editMember ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </div>
  );
}
