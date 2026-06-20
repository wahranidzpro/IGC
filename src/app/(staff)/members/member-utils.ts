import { parseMemberIdFromQR } from '@/lib/whatsapp';
import type { Member } from '@/lib/db/dexie-db';

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function parseQRMemberId(code: string): number | null {
  return parseMemberIdFromQR(code);
}

export function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function toDisplayDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function toISODate(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return display;
  const [dd, mm, yyyy] = parts;
  if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) return `${yyyy}-${mm}-${dd}`;
  return display;
}

export const durationLabels: Record<string, string> = {
  '1_mois': '1 Mois',
  '2_mois': '2 Mois',
  '3_mois': '3 Mois',
  '6_mois': '6 Mois',
  '12_mois': '12 Mois',
};

export const sessionsPerDuration: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 360,
};

export const durationDays: Record<string, number> = {
  '1_mois': 30,
  '2_mois': 60,
  '3_mois': 90,
  '6_mois': 180,
  '12_mois': 365,
};

export function computeExpiryDate(member: Member): Date | null {
  if (member.subscriptionType !== 'subscription' || !member.subscriptionDuration) return null;
  const days = durationDays[member.subscriptionDuration];
  if (!days) return null;
  const created = new Date(member.createdAt);
  return new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
}

export function computeMemberStatus(member: Member): { status: 'active' | 'expired' | 'inactive'; daysLeft: number; subscriptionDisplay: string; expiresAt?: string } {
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

export const blockReasons = [
  'Bagarre',
  'Insulte / Harcelement',
  'Comportement vulgaire',
  'Non-paiement récurrent',
  'Vol',
  'Dommage matériel',
  'Autre',
];

export function getGenderLabel(g?: string) {
  return g === 'male' ? 'Homme' : g === 'female' ? 'Femme' : 'Autre';
}

export function getSubLabel(t?: string) {
  return t === 'free_session' ? 'Séance libre' : 'Abonnement';
}
