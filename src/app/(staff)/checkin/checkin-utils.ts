import { parseMemberIdFromQR } from '@/lib/whatsapp';
import type { Member, CheckIn } from '@/lib/db/dexie-db';

export type AccessMode = 'qr' | 'birthdate' | 'rfid' | 'phone';
export type ScanStatus = 'idle' | 'success' | 'error' | 'expired' | 'inactive' | 'blocked' | 'inside';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function playBeep(type: 'authorized' | 'denied') {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.3;
    if (type === 'authorized') {
      osc.frequency.value = 800;
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.value = 300;
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {}
}

export function parseQRMemberId(code: string): number | null {
  return parseMemberIdFromQR(code);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function calculateAge(birthDate: string) {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getMemberStatus(member: Member) {
  if (member.isBlocked === true) {
    if (member.blockedUntil && new Date(member.blockedUntil).getTime() <= Date.now()) return 'active';
    return 'blocked';
  }
  if (member.status === 'expired') return 'expired';
  if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
    const durationMap: Record<string, number> = { '1_mois': 30, '2_mois': 60, '3_mois': 90, '6_mois': 180, '12_mois': 365 };
    const days = durationMap[member.subscriptionDuration] || 30;
    const created = new Date(member.createdAt).getTime();
    const expiry = created + (days * 24 * 60 * 60 * 1000);
    const now = Date.now();
    if (now > expiry) return 'expired';
  }
  if (member.subscriptionType === 'free_session' && (member.sessionsLeft || 0) <= 0) return 'expired';
  if (member.status !== 'active') return 'inactive';
  return 'active';
}

export function getCurrentMethod(accessMode: AccessMode, member?: Member) {
  if (accessMode === 'rfid') return member?.rfidCode ? 'rfid' : 'manual';
  if (accessMode === 'qr') return 'qr';
  if (accessMode === 'phone') return 'phone';
  if (accessMode === 'birthdate') return 'birthdate';
  return 'manual';
}

export function getMemberSession(memberId: number, todayCheckins: CheckIn[] | undefined) {
  const memberCheckins = todayCheckins?.filter(c => c.memberId === memberId) || [];
  const lastCheckin = memberCheckins.find(c => c.type === 'checkin');
  const lastCheckout = memberCheckins.find(c => c.type === 'checkout');
  return { lastCheckin, lastCheckout, memberCheckins };
}
