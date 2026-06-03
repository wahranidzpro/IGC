'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CheckIn, type Member } from '@/lib/db/dexie-db';
import IGCQRCode from '@/components/IGCQRCode';
import { Camera, QrCode, User, CheckCircle, Clock, Scan, Award, RefreshCw, Fingerprint, Calendar, XCircle, Search, Maximize2, Minimize2, ShieldAlert, Unlock, Ban, UserCheck, Download, Filter, History, Radio, Info, ArrowUpDown, ChevronDown, ChevronUp, ExternalLink, Monitor } from 'lucide-react';
import { getMemberQRValue, parseMemberIdFromQR, formatPhoneDisplay } from '@/lib/whatsapp';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';
import { logger } from '@/lib/logger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import type { Html5Qrcode } from 'html5-qrcode';

type AccessMode = 'qr' | 'birthdate' | 'rfid' | 'phone';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function playBeep(type: 'authorized' | 'denied') {
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

function parseQRMemberId(code: string): number | null {
  return parseMemberIdFromQR(code);
}

function KioskOverlay({ members, accessMode, setAccessMode, scanStatus, setScanStatus, scannedMember, earnedPoints, performCheckin, handleBypass, onExit }: {
  members: Member[] | undefined;
  accessMode: string;
  setAccessMode: (m: AccessMode) => void;
  scanStatus: 'idle' | 'success' | 'error' | 'expired' | 'inactive' | 'blocked' | 'inside';
  setScanStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error' | 'expired' | 'inactive' | 'blocked' | 'inside'>>;
  scannedMember: Member | null | undefined;
  earnedPoints: number;
  performCheckin: (id: number) => Promise<void>;
  handleBypass: () => Promise<void>;
  onExit: () => void;
}) {
  const [kScanning, setKScanning] = useState(false);
  const [kError, setKError] = useState('');
  const kStartRef = useRef(false);
  const kScannerRef = useRef<Html5Qrcode | null>(null);
  const [rfidVal, setRfidVal] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const kProcRef = useRef<((id: number) => void) | null>(null);
  const kLastRef = useRef(0);

  const stopKScanner = useCallback(async () => {
    if (kScannerRef.current) {
      try { await kScannerRef.current.stop(); } catch {}
      kScannerRef.current = null;
    }
    setKScanning(false);
  }, []);

  const processId = useCallback((id: number) => {
    const now = Date.now();
    if (now - kLastRef.current < 2000) return;
    kLastRef.current = now;
    stopKScanner();
    performCheckin(id);
  }, [stopKScanner, performCheckin]);

  kProcRef.current = processId;

  const startKScanner = useCallback(async () => {
    if (kStartRef.current) return;
    kStartRef.current = true;
    try {
      setKError('');
      await stopKScanner();
      const { Html5Qrcode } = await import('html5-qrcode');
      const s = new Html5Qrcode('kiosk-qr-reader');
      kScannerRef.current = s;
      setKScanning(true);
      await s.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (txt: string) => {
          const id = parseMemberIdFromQR(txt);
          if (id && kProcRef.current) {
            s.stop().catch(() => {});
            kScannerRef.current = null;
            setKScanning(false);
            kProcRef.current(id);
          }
        },
        () => {}
      );
    } catch (err) {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const cams = await Html5Qrcode.getCameras();
        if (cams.length > 0) {
          await stopKScanner();
          const s = new Html5Qrcode('kiosk-qr-reader');
          kScannerRef.current = s;
          setKScanning(true);
          await s.start(
            { deviceId: cams[0].id },
            { fps: 10, qrbox: { width: 280, height: 280 } },
            (txt: string) => {
              const id = parseMemberIdFromQR(txt);
              if (id && kProcRef.current) {
                s.stop().catch(() => {});
                kScannerRef.current = null;
                setKScanning(false);
                kProcRef.current(id);
              }
            },
            () => {}
          );
          return;
        }
      } catch {}
      setKError(err instanceof Error ? err.message : 'Erreur caméra');
      setKScanning(false);
    } finally { kStartRef.current = false; }
  }, [stopKScanner]);

  useEffect(() => {
    if (accessMode === 'qr') startKScanner();
    else stopKScanner();
    return () => { stopKScanner(); };
  }, [accessMode, startKScanner, stopKScanner]);

  const statusBg = scanStatus === 'success' ? 'from-green-700 to-green-900' :
    scanStatus === 'blocked' ? 'from-red-800 to-red-950' :
    scanStatus === 'expired' ? 'from-red-700 to-red-900' :
    scanStatus === 'inactive' ? 'from-yellow-700 to-yellow-950' :
    scanStatus === 'inside' ? 'from-blue-700 to-blue-950' :
    'from-gray-900 to-gray-950';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-gradient-to-br ${statusBg} transition-all duration-700`}>
      {/* Mode tabs */}
      {scanStatus === 'idle' && (
        <div className="flex justify-center gap-3 pt-8 pb-2">
          {(['qr', 'rfid', 'birthdate', 'phone'] as const).map(m => (
            <button key={m} onClick={() => { setAccessMode(m); setScanStatus('idle'); setRfidVal(''); setDateVal(''); setPhoneVal(''); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all uppercase ${accessMode === m ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}>
              {m === 'qr' ? 'QR Code' : m === 'rfid' ? 'RFID' : m === 'birthdate' ? 'Date' : 'Téléphone'}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes scanMove {
          0% { top: 6%; }
          50% { top: 74%; }
          100% { top: 6%; }
        }
        .kiosk-scan-line {
          position: absolute;
          top: 6%;
          left: 0;
          right: 0;
          width: 65%;
          height: 4px;
          margin: 0 auto;
          background: linear-gradient(90deg, transparent, #22d3ee, #22d3ee, transparent);
          box-shadow: 0 0 20px rgba(34,211,238,0.8), 0 0 60px rgba(34,211,238,0.3);
          animation: scanMove 2s ease-in-out infinite;
          pointer-events: none;
          z-index: 50;
          border-radius: 3px;
        }
      `}</style>

      {/* IDLE - QR */}
      {scanStatus === 'idle' && accessMode === 'qr' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6 tracking-wide">Scannez votre QR code</h2>
          <div className="relative w-full max-w-sm" style={{ minHeight: 350 }}>
            <div id="kiosk-qr-reader" className="w-full rounded-2xl bg-black/40 shadow-2xl" style={{ minHeight: 350 }}></div>
            {kScanning && <div className="kiosk-scan-line" />}
          </div>
          {!kScanning && !kError && (
            <button onClick={startKScanner} className="mt-6 px-10 py-4 bg-orange-500 text-white rounded-2xl text-lg font-bold hover:bg-orange-600 transition-all flex items-center gap-3 shadow-xl shadow-orange-500/20">
              <Camera className="w-6 h-6" /> Activer la caméra
            </button>
          )}
          {kScanning && (
            <div className="flex items-center gap-3 mt-6">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <p className="text-lg text-green-400 font-medium">Caméra active — Scannez le QR code</p>
            </div>
          )}
          {kError && (
            <div className="text-center mt-6">
              <p className="text-red-400 text-lg mb-3">{kError}</p>
              <button onClick={startKScanner} className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 text-base"><RefreshCw className="w-4 h-4 inline mr-2" />Réessayer</button>
            </div>
          )}
        </div>
      )}

      {/* IDLE - RFID */}
      {scanStatus === 'idle' && accessMode === 'rfid' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Scannez ou saisissez le code RFID</h2>
          <input value={rfidVal} onChange={e => setRfidVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const m = members?.find(x => x.rfidCode?.toLowerCase() === e.currentTarget.value.trim().toLowerCase()); if (m) processId(m.id!); else setScanStatus('error'); setRfidVal(''); } }}
            placeholder="Code RFID..." className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500 placeholder-white/30" autoFocus />
        </div>
      )}

      {/* IDLE - Birthdate */}
      {scanStatus === 'idle' && accessMode === 'birthdate' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Date de naissance</h2>
          <input type="date" value={dateVal} onChange={e => { setDateVal(e.target.value); const m = members?.filter(x => x.birthDate === e.target.value); if (m?.length === 1) processId(m[0].id!); }}
            className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500" />
        </div>
      )}

      {/* IDLE - Phone */}
      {scanStatus === 'idle' && accessMode === 'phone' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Numéro de téléphone</h2>
          <input value={phoneVal} onChange={e => { setPhoneVal(e.target.value); const v = e.target.value.replace(/\s/g, ''); if (v.length >= 6) { const m = members?.find(x => x.phone.replace(/\s/g, '').endsWith(v)); if (m) processId(m.id!); } }}
            placeholder="Ex: 0555000011" className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500 placeholder-white/30" autoFocus />
        </div>
      )}

      {/* SUCCESS */}
      {scanStatus === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-500">
          <div className="w-40 h-40 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center mb-8">
            <CheckCircle className="w-24 h-24 text-green-400" />
          </div>
          <h1 className="text-7xl font-black text-white tracking-wider">ACCÈS AUTORISÉ</h1>
          {scannedMember && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl">
                {scannedMember.photo ? <img src={scannedMember.photo} className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} /> : <div className="w-full h-full bg-green-400/20 flex items-center justify-center"><User className="w-14 h-14 text-green-400" /></div>}
              </div>
              <p className="text-4xl font-bold text-white">{scannedMember.firstName} {scannedMember.lastName}</p>
              <p className="text-xl text-green-300">+{earnedPoints} points fidélité</p>
            </div>
          )}
        </div>
      )}

      {/* ERROR */}
      {scanStatus === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <User className="w-32 h-32 text-white/30 mb-6" />
          <h1 className="text-6xl font-black text-white/50">INTROUVABLE</h1>
          <p className="text-2xl text-white/30 mt-4">Vérifiez le code saisi</p>
        </div>
      )}

      {/* BLOCKED */}
      {scanStatus === 'blocked' && scannedMember && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <Ban className="w-32 h-32 text-red-400 mb-6" />
          <h1 className="text-7xl font-black text-white">ACCÈS REFUSÉ</h1>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-red-500 shadow-2xl">
                {scannedMember.photo ? <img src={scannedMember.photo} className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} /> : <div className="w-full h-full bg-red-500/20 flex items-center justify-center"><Ban className="w-14 h-14 text-red-500" /></div>}
              </div>
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-0.5 rounded-full border ${scannedMember.blockedUntil ? 'bg-red-600 border-red-400' : 'bg-black border-red-500'}`}>{scannedMember.blockedUntil ? 'BLOQUÉ' : 'BANNI'}</div>
            </div>
            <p className="text-3xl text-white/80 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>
          </div>
          {scannedMember?.blockReason && <p className="text-2xl text-red-400 mt-4">Motif: {scannedMember.blockReason}</p>}
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {/* EXPIRED */}
      {scanStatus === 'expired' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <XCircle className="w-32 h-32 text-red-400 mb-6" />
          <h1 className="text-7xl font-black text-white">ABONNEMENT EXPIRÉ</h1>
          {scannedMember && <p className="text-3xl text-white/80 mt-6 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>}
          <p className="text-2xl text-red-300 mt-4">Veuillez renouveler votre abonnement</p>
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {/* INACTIVE */}
      {scanStatus === 'inactive' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <ShieldAlert className="w-32 h-32 text-yellow-400 mb-6" />
          <h1 className="text-7xl font-black text-white">COMPTE INACTIF</h1>
          {scannedMember && <p className="text-3xl text-white/80 mt-6 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>}
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {/* INSIDE (already checked in) */}
      {scanStatus === 'inside' && scannedMember && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <UserCheck className="w-32 h-32 text-blue-400 mb-6" />
          <h1 className="text-7xl font-black text-white">DÉJÀ EN SALLE</h1>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl">
                {scannedMember.photo ? <img src={scannedMember.photo} className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} /> : <div className="w-full h-full bg-blue-500/20 flex items-center justify-center"><UserCheck className="w-14 h-14 text-blue-500" /></div>}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-blue-400">EN SALLE</div>
            </div>
            <p className="text-3xl text-white/80 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>
          </div>
          <p className="text-2xl text-blue-300 mt-4">Ce membre a déjà pointé son entrée</p>
        </div>
      )}

      {/* Exit button */}
      <button onClick={onExit} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all z-10" title="Quitter le mode kiosque">
        <Minimize2 className="w-6 h-6" />
      </button>
    </div>
  );
}

function doCheckin(memberId: number, members: Member[]) {
  return async function performCheckin() {
    const member = members?.find(m => m.id === memberId);
    if (!member) return;
    const pointsAwarded = 10;
    await db.checkins.add({ memberId, timestamp: new Date(), type: 'checkin' });
    await db.members.update(memberId, {
      sessionsLeft: member.subscriptionType === 'free_session' ? Math.max(0, (member.sessionsLeft || 1) - 1) : (member.sessionsLeft ?? 0),
      fidelityPoints: (member.fidelityPoints || 0) + pointsAwarded,
      updatedAt: new Date()
    });
    return { member, pointsAwarded };
  };
}

export default function CheckinPage() {
  const { role, user } = useAuth();
  const coachId = role === 'coach' ? user?.coachId : undefined;
  const [accessMode, setAccessMode] = useState<AccessMode>('qr');
  const [qrSubMode, setQrSubMode] = useState<'scan' | 'generate'>('scan');
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'expired' | 'inactive' | 'blocked' | 'inside'>('idle');
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);
  const handleScanRef = useRef<((code: string) => Promise<void>) | null>(null);

  const [birthDateInput, setBirthDateInput] = useState('');
  const [rfidInput, setRfidInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneFoundMembers, setPhoneFoundMembers] = useState<Member[]>([]);
  const [foundMembers, setFoundMembers] = useState<Member[]>([]);
  const [checkinSearch, setCheckinSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportDateFrom, setExportDateFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportDateTo, setExportDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const scanBufferRef = useRef('');
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (kioskMode) stopScanner();
  }, [kioskMode]);

  const members = useLiveQuery(() => {
    if (role === 'coach' && coachId) return db.members.where('coachId').equals(coachId).toArray();
    return db.members.toArray();
  }, [coachId, role]);
  const todayCheckins = useLiveQuery(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return db.checkins.where('timestamp').above(today).toArray();
  }, [refreshKey]);

  // Investigative history panel
  const [showInvestigation, setShowInvestigation] = useState(false);
  const [invDateFrom, setInvDateFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [invDateTo, setInvDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [invSearch, setInvSearch] = useState('');
  const [invFilterMode, setInvFilterMode] = useState<'name' | 'phone' | 'birthdate'>('name');
  const [invRefresh, setInvRefresh] = useState(0);
  const [showRfidModule, setShowRfidModule] = useState(false);

  // For paired history data
  const historyData = useLiveQuery(async () => {
    const from = new Date(invDateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(invDateTo);
    to.setHours(23, 59, 59, 999);
    const all = await db.checkins.where('timestamp').between(from, to).toArray();
    return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [invDateFrom, invDateTo, invRefresh]);

  const exportByDate = async (from: string, to: string) => {
    const fd = new Date(from); fd.setHours(0, 0, 0, 0);
    const td = new Date(to); td.setHours(23, 59, 59, 999);
    const data = await db.checkins.where('timestamp').between(fd, td).toArray();
    const memberMap = new Map<number, { ci: Date | null; co: Date | null }>();
    data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(c => {
      if (!memberMap.has(c.memberId)) memberMap.set(c.memberId, { ci: null, co: null });
      const entry = memberMap.get(c.memberId)!;
      const ts = new Date(c.timestamp);
      if (c.type === 'checkin' && (!entry.ci || ts > entry.ci)) entry.ci = ts;
      if (c.type === 'checkout' && (!entry.co || ts > entry.co)) entry.co = ts;
    });
    const rows: Record<string, string | number>[] = [];
    memberMap.forEach((session, memberId) => {
      const m = members?.find(mm => mm.id === memberId);
      rows.push({
        Membre: m ? `${m.lastName} ${m.firstName}` : `#${memberId}`,
        Téléphone: m?.phone || '',
        Date: session.ci ? session.ci.toLocaleDateString('fr-FR') : (session.co ? session.co.toLocaleDateString('fr-FR') : ''),
        Entrée: session.ci ? session.ci.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        Sortie: session.co ? session.co.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Durée (min)': session.ci && session.co ? Math.round((session.co.getTime() - session.ci.getTime()) / 60000) : 0,
      });
    });
    exportToXlsx(rows, `pointages_${from}_${to}`);
  };

  const exportHistory = async () => exportByDate(invDateFrom, invDateTo);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const getMemberSession = (memberId: number) => {
    const memberCheckins = todayCheckins?.filter(c => c.memberId === memberId) || [];
    const lastCheckin = memberCheckins.find(c => c.type === 'checkin');
    const lastCheckout = memberCheckins.find(c => c.type === 'checkout');
    return { lastCheckin, lastCheckout, memberCheckins };
  };

  const performCheckout = async (memberId: number) => {
    const m = members?.find(m => m.id === memberId);
    if (!m) return;
    await db.checkins.add({ memberId, timestamp: new Date(), type: 'checkout' });
    setRefreshKey(k => k + 1);
  };

  const deleteCheckin = async (checkinId: number) => {
    if (confirm('Supprimer ce pointage?')) {
      await db.checkins.delete(checkinId);
      setRefreshKey(k => k + 1);
    }
  };

  const deleteOrphanCheckins = async () => {
    const allCheckins = await db.checkins.toArray();
    const allMembers = await db.members.toArray();
    const memberIds = new Set(allMembers.map(m => m.id));
    const orphanIds = allCheckins.filter(c => c.memberId && !memberIds.has(c.memberId)).map(c => c.id);
    if (orphanIds.length === 0) {
      alert('Aucun check-in orphelin trouvé');
      return;
    }
    if (confirm(`Supprimer ${orphanIds.length} check-in(s) orphelin(s)?`)) {
      await db.checkins.bulkDelete(orphanIds);
      setRefreshKey(k => k + 1);
      alert(`${orphanIds.length} check-in(s) supprimé(s)`);
    }
  };

  const getMemberStatus = (member: Member) => {
    if (member.isBlocked === true) {
      if (member.blockedUntil && new Date(member.blockedUntil).getTime() <= Date.now()) return 'active';
      return 'blocked';
    }
    if (member.status !== 'active') return 'inactive';
    if (member.subscriptionType === 'subscription' && member.subscriptionDuration) {
      const durationMap: Record<string, number> = { '1_mois': 30, '2_mois': 60, '3_mois': 90, '6_mois': 180, '12_mois': 365 };
      const days = durationMap[member.subscriptionDuration] || 30;
      const created = new Date(member.createdAt).getTime();
      const expiry = created + (days * 24 * 60 * 60 * 1000);
      const now = Date.now();
      if (now > expiry) return 'expired';
    }
    if (member.subscriptionType === 'free_session' && (member.sessionsLeft || 0) <= 0) return 'expired';
    return 'active';
  };

  const getCurrentMethod = useCallback((m?: Member) => {
    if (accessMode === 'rfid') return m?.rfidCode ? 'rfid' : 'manual';
    if (accessMode === 'qr') return 'qr';
    if (accessMode === 'phone') return 'phone';
    if (accessMode === 'birthdate') return 'birthdate';
    return 'manual';
  }, [accessMode]);

  const syncCheckinToSupabase = useCallback(async (memberId: number, member: Member, method: string, status: string, reason: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await (supabase.from('access_logs') as any).insert({
        member_local_id: memberId,
        event_type: status === 'allowed' ? 'entry' : 'denied',
        access_granted: status === 'allowed',
        method,
        reason,
        rfid_uid: member.rfidCode || null,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  }, []);

  const performCheckin = useCallback(async (memberId: number) => {
    const member = members?.find(m => m.id === memberId);
    if (!member) { setScanStatus('error'); return; }
    
    const memberStatus = getMemberStatus(member);
    if (memberStatus === 'blocked') {
      playBeep('denied');
      syncCheckinToSupabase(memberId, member, getCurrentMethod(member), 'denied', 'blocked');
      setSelectedMember(memberId);
      setScanStatus('blocked');
      setTimeout(() => { setScanStatus('idle'); }, 10000);
      return;
    }
    if (memberStatus === 'expired') {
      playBeep('denied');
      syncCheckinToSupabase(memberId, member, getCurrentMethod(member), 'denied', 'expired');
      setSelectedMember(memberId);
      setScanStatus('expired');
      setTimeout(() => { setScanStatus('idle'); }, 10000);
      return;
    }
    if (memberStatus === 'inactive') {
      playBeep('denied');
      syncCheckinToSupabase(memberId, member, getCurrentMethod(member), 'denied', 'inactive');
      setSelectedMember(memberId);
      setScanStatus('inactive');
      setTimeout(() => { setScanStatus('idle'); }, 10000);
      return;
    }
    
    // Prevent duplicate check-in (fraud prevention)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existingToday = await db.checkins.where('memberId').equals(memberId).toArray();
    const todayMemberCheckins = existingToday.filter(c => new Date(c.timestamp) >= today);
    const lastAction = todayMemberCheckins.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    if (lastAction?.type === 'checkin') {
      playBeep('denied');
      syncCheckinToSupabase(memberId, member, getCurrentMethod(member), 'denied', 'already_inside');
      setSelectedMember(memberId);
      setScanStatus('inside');
      setTimeout(() => { setScanStatus('idle'); }, 10000);
      return;
    }
    
    const pointsAwarded = 10;
    await db.checkins.add({ memberId, timestamp: new Date(), type: 'checkin' });
    await db.members.update(memberId, {
      sessionsLeft: member.subscriptionType === 'free_session' ? Math.max(0, (member.sessionsLeft || 1) - 1) : (member.sessionsLeft ?? 0),
      fidelityPoints: (member.fidelityPoints || 0) + pointsAwarded,
      updatedAt: new Date()
    });
    syncCheckinToSupabase(memberId, member, getCurrentMethod(member), 'allowed', 'checkin_success');
    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase.from('synced_checkins') as any).insert({
          local_id: Date.now(),
          member_id: memberId,
          timestamp: new Date().toISOString(),
          type: 'checkin',
        });
      } catch {}
    }
    setRefreshKey(k => k + 1);
    setSelectedMember(memberId);
    setEarnedPoints(pointsAwarded);
    setScanStatus('success');
    playBeep('authorized');
    setTimeout(() => {
      setScanStatus('idle'); setSelectedMember(null); setEarnedPoints(0); setManualCode(''); setCameraError('');
      setBirthDateInput(''); setRfidInput(''); setFoundMembers([]);
      if (accessMode === 'qr' && qrSubMode === 'scan') startScanner();
    }, 10000);
  }, [members, accessMode, qrSubMode, getCurrentMethod, syncCheckinToSupabase]);

  const handleBypass = useCallback(async () => {
    if (!selectedMember) return;
    const member = members?.find(m => m.id === selectedMember);
    if (!member) return;
    await db.checkins.add({ memberId: selectedMember, timestamp: new Date(), type: 'checkin' });
    await db.members.update(selectedMember, { updatedAt: new Date() });
    syncCheckinToSupabase(selectedMember, member, 'manual', 'allowed', 'bypass');
    setEarnedPoints(0);
    setScanStatus('success');
    playBeep('authorized');
    setTimeout(() => { setScanStatus('idle'); setSelectedMember(null); setEarnedPoints(0); }, 5000);
  }, [selectedMember, members, syncCheckinToSupabase]);

  const handleScan = useCallback(async (code: string) => {
    setManualCode('');
    const memberId = parseQRMemberId(code);
    if (memberId && members?.find(m => m.id === memberId)) {
      await performCheckin(memberId);
    } else {
      setScanStatus('error');
      setTimeout(() => { setScanStatus('idle'); startScanner(); }, 10000);
    }
  }, [members, performCheckin]);

  handleScanRef.current = handleScan;

  const startScanner = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      setCameraError('');
      setScanStatus('idle');

      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setIsScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decodedText: string) => {
          const fn = handleScanRef.current;
          if (!fn) return;
          Promise.resolve(fn(decodedText))
            .then(() => scanner.stop().catch(() => {}))
            .catch(() => scanner.stop().catch(() => {}))
            .finally(() => {
              scannerRef.current = null;
              setIsScanning(false);
            });
        },
        () => {}
      );
    } catch (err) {
      logger.error('Scanner failed:', err);
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length > 0) {
          if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch {}
            scannerRef.current = null;
          }
          const scanner = new Html5Qrcode('qr-reader');
          scannerRef.current = scanner;
          setIsScanning(true);
          await scanner.start(
            { deviceId: cameras[0].id },
            { fps: 10, qrbox: { width: 280, height: 280 } },
            async (code) => {
              if (handleScanRef.current) {
                await handleScanRef.current(code);
              }
            },
            () => {}
          );
          return;
        }
      } catch (e) { logger.error('Fallback failed:', e); }
      const error = err instanceof Error ? err : new Error(String(err));
      const msg = error.name === 'NotAllowedError'
        ? 'Cliquez sur "Activer la camera" pour autoriser l\'acces'
        : error.message || 'Erreur de demarrage de la camera';
      setCameraError(msg);
      setIsScanning(false);
      setScanStatus('error');
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Hardware QR/Barcode scanner support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const now = Date.now();
      if (e.key === 'Enter') {
        const buf = scanBufferRef.current.trim();
        if (buf.length > 3) {
          const id = parseMemberIdFromQR(buf);
          if (id) {
            e.preventDefault();
            performCheckin(id);
          } else {
            const member = members?.find(m => m.rfidCode?.toLowerCase() === buf.toLowerCase());
            if (member) {
              e.preventDefault();
              performCheckin(member.id!);
            }
          }
        }
        scanBufferRef.current = '';
        if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); scanTimerRef.current = null; }
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
        if (e.key === 'Escape') { scanBufferRef.current = ''; }
        return;
      }
      if (now - lastKeyTimeRef.current < 100) {
        scanBufferRef.current += e.key;
      } else {
        scanBufferRef.current = e.key;
      }
      lastKeyTimeRef.current = now;
      if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); }
      scanTimerRef.current = setTimeout(() => {
        const buf = scanBufferRef.current.trim();
        if (buf.length > 3) {
          const id = parseMemberIdFromQR(buf);
          if (id) {
            performCheckin(id);
          } else {
            const member = members?.find(m => m.rfidCode?.toLowerCase() === buf.toLowerCase());
            if (member) {
              performCheckin(member.id!);
            }
          }
        }
        scanBufferRef.current = '';
      }, 120);
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (scanTimerRef.current) { clearTimeout(scanTimerRef.current); }
    };
  }, [members, performCheckin]);

  const switchAccessMode = (newMode: AccessMode) => {
    stopScanner();
    setAccessMode(newMode);
    setScanStatus('idle');
    setCameraError('');
    setBirthDateInput('');
    setRfidInput('');
    setFoundMembers([]);
    setManualCode('');
  };

  const handleBirthDateSearch = () => {
    if (!birthDateInput) return;
    const matches = members?.filter(m => m.birthDate === birthDateInput) || [];
    setFoundMembers(matches);
    if (matches.length === 1) {
      performCheckin(matches[0].id!);
    }
  };

  const handleRfidSearch = () => {
    if (!rfidInput.trim()) return;
    const member = members?.find(m => m.rfidCode?.toLowerCase() === rfidInput.trim().toLowerCase());
    if (member) {
      performCheckin(member.id!);
    } else {
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 10000);
    }
  };

  const handlePhoneSearch = () => {
    if (!phoneInput.trim()) return;
    const normalizedInput = phoneInput.trim().replace(/[\s\-\(\)]/g, '');
    const found = members?.filter(m => {
      const normalizedPhone = m.phone.replace(/[\s\-\(\)]/g, '');
      return normalizedPhone.includes(normalizedInput) || normalizedPhone.endsWith(normalizedInput);
    }) || [];
    
    if (found.length === 1) {
      performCheckin(found[0].id!);
    } else if (found.length > 1) {
      setPhoneFoundMembers(found);
    } else {
      setPhoneFoundMembers([]);
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 10000);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneInput(value);
    if (value.trim().length >= 3) {
      const normalizedInput = value.trim().replace(/[\s\-\(\)]/g, '');
      const found = members?.filter(m => {
        const normalizedPhone = m.phone.replace(/[\s\-\(\)]/g, '');
        return normalizedPhone.includes(normalizedInput) || normalizedPhone.endsWith(normalizedInput);
      }) || [];
      setPhoneFoundMembers(found.slice(0, 5));
    } else {
      setPhoneFoundMembers([]);
    }
  };

  const scannedMember = selectedMember ? members?.find(m => m.id === selectedMember) : null;
  const todayCount = todayCheckins?.filter(c => c.type === 'checkin').length || 0;

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const renderPhoto = (status: string) => {
    if (!scannedMember) return null;
    const borderColor = status === 'success' ? 'border-green-500' : status === 'blocked' ? 'border-red-500' : status === 'expired' ? 'border-red-500' : 'border-yellow-500';
    const isBanned = !scannedMember.blockedUntil;
    return (
      <div className="mb-3">
        <div className={`relative w-40 h-40 mx-auto rounded-full overflow-hidden border-[3px] ${borderColor} shadow-xl`}>
          {scannedMember.photo ? (
            <img src={scannedMember.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-500" />
            </div>
          )}
          {status === 'blocked' && (
            <div className={`absolute inset-0 ${isBanned ? 'bg-black/70' : 'bg-red-600/60'} flex items-center justify-center`}>
              <span className="text-white font-black text-2xl">{isBanned ? 'BANNI' : 'BLOQUÉ'}</span>
            </div>
          )}
        </div>
        <p className="text-white font-semibold mt-2">{scannedMember.firstName} {scannedMember.lastName}</p>
        <div className="text-xs text-gray-400 mt-1 space-y-1">
          <p>📅 {calculateAge(scannedMember.birthDate || '')} ans • 📱 {formatPhoneDisplay(scannedMember.phone)}</p>
          <p>🏷️ RFID: {scannedMember.rfidCode || 'Non assigné'}</p>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
      {scannedMember && renderPhoto('success')}
      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
      <p className="text-green-400 font-semibold">Check-in réussi !</p>
      <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400">
        <Award className="w-4 h-4" />
        <span className="text-sm font-medium">+{earnedPoints} points fidelite</span>
      </div>
    </div>
  );

const renderBlocked = () => {
    if (scanStatus === 'blocked') {
      return (
        <div className="p-4 bg-black border-2 border-red-500 rounded-xl text-center">
          {scannedMember && renderPhoto('blocked')}
          <p className="text-red-400 text-sm">{scannedMember?.blockReason ? `Motif: ${scannedMember.blockReason}` : ''}</p>
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-bold text-lg">INTERDIT D'ACCÈS</p>
          <p className="text-gray-400 text-xs mt-2">Contactez la direction</p>
          {kioskMode && (
            <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
              <Unlock className="w-4 h-4" /> Autoriser une fois
            </button>
          )}
        </div>
      );
    }
    if (scanStatus === 'expired') {
      return (
        <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-center">
          {scannedMember && renderPhoto('expired')}
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-bold text-lg">ABONNEMENT EXPIRÉ</p>
          <p className="text-red-300 text-sm mt-2">Veuillez renouveler votre abonnement</p>
          <p className="text-gray-400 text-xs mt-2">Allez à "Adhérents" pour voir les détails</p>
          {kioskMode && (
            <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
              <Unlock className="w-4 h-4" /> Autoriser une fois
            </button>
          )}
        </div>
      );
    }
    if (scanStatus === 'inactive') {
      return (
        <div className="p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl text-center">
          {scannedMember && renderPhoto('inactive')}
          <XCircle className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-400 font-bold text-lg">COMPTE INACTIF</p>
          <p className="text-yellow-300 text-sm mt-2">Veuillez contacter la salle</p>
          {kioskMode && (
            <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
              <Unlock className="w-4 h-4" /> Autoriser une fois
            </button>
          )}
        </div>
      );
    }
    if (scanStatus === 'inside') {
      return (
        <div className="p-4 bg-blue-500/10 border-2 border-blue-500 rounded-xl text-center">
          {scannedMember && (
            <div className="mb-3">
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-[3px] border-blue-500 shadow-lg">
                {scannedMember.photo ? (
            <img src={scannedMember.photo} alt="" className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-blue-400">EN SALLE</div>
              </div>
              <p className="text-white font-semibold mt-4">{scannedMember.firstName} {scannedMember.lastName}</p>
            </div>
          )}
          <UserCheck className="w-10 h-10 text-blue-400 mx-auto mb-2" />
          <p className="text-blue-400 font-bold text-lg">DÉJÀ EN SALLE</p>
          <p className="text-blue-300 text-xs mt-2">Ce membre a déjà pointé son entrée aujourd'hui</p>
        </div>
      );
    }
    return null;
  };

  const renderError = () => (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
      {cameraError ? (
        <>
          <p className="text-red-400 font-semibold">Erreur camera</p>
          <p className="text-xs text-red-400/70 mt-1">{cameraError}</p>
          <button onClick={startScanner} className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Reessayer
          </button>
        </>
      ) : (
        <>
          <p className="text-red-400 font-semibold">Aucun membre trouvé</p>
          <p className="text-xs text-red-400/70 mt-1">Vérifiez les informations saisies</p>
        </>
      )}
    </div>
  );

  return (
    <><div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pointage</h2>
          <p className="text-gray-400 mt-1">{todayCount} check-ins aujourd'hui</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5">
            <input type="date" value={exportDateFrom} onChange={e => setExportDateFrom(e.target.value)} className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500 w-[130px]" />
            <span className="text-gray-500 text-xs">→</span>
            <input type="date" value={exportDateTo} onChange={e => setExportDateTo(e.target.value)} className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500 w-[130px]" />
            <button onClick={() => exportByDate(exportDateFrom, exportDateTo)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs text-white transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <button onClick={() => setKioskMode(!kioskMode)} className={`p-2 rounded-lg transition-colors ${kioskMode ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} title={kioskMode ? 'Quitter mode kiosque' : 'Mode kiosque'}>
            {kioskMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <ImportExportButtons
            onExport={() => exportByDate(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0])}
            onImport={() => importFromXlsx<CheckIn>(async (items) => { await db.checkins.bulkAdd(items); })}
          />
        </div>
      </div>

      {/* Access mode tabs */}
      <div className="flex gap-2">
        <button onClick={() => switchAccessMode('qr')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${accessMode === 'qr' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <QrCode className="w-4 h-4" /> QR Code
        </button>
        <button onClick={() => switchAccessMode('birthdate')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${accessMode === 'birthdate' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <Calendar className="w-4 h-4" /> Date naissance
        </button>
        <button onClick={() => switchAccessMode('rfid')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${accessMode === 'rfid' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <Fingerprint className="w-4 h-4" /> Code RFID
        </button>
        <button onClick={() => switchAccessMode('phone')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${accessMode === 'phone' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <Scan className="w-4 h-4" /> Téléphone
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {accessMode === 'qr' && qrSubMode === 'scan' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-orange-400" /> Scanner QR Code</h3>
                <button onClick={() => { stopScanner(); setQrSubMode('generate'); }} className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> Generer QR
                </button>
              </div>
              <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-800" style={{ minHeight: 300, width: '100%' }}></div>

              {!isScanning && scanStatus === 'idle' && !cameraError && (
                <button onClick={startScanner} className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium flex items-center justify-center gap-2">
                  <Camera className="w-5 h-5" /> Activer la camera
                </button>
              )}

              {isScanning && (
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-400">Scanner actif - pointez le QR code</p>
                  </div>
                </div>
              )}

              {scanStatus === 'error' && renderError()}
              {scanStatus === 'success' && renderSuccess()}
              {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && renderBlocked()}

              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Probleme de camera ? Saisissez le code QR manuellement :</p>
                <form onSubmit={e => { e.preventDefault(); if (manualCode.trim()) handleScan(manualCode.trim()); }} className="flex gap-2">
                  <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="IGC:123 ou INF-..." className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
                  <button type="submit" disabled={!manualCode.trim()} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">Valider</button>
                </form>
              </div>
            </div>
          )}

          {accessMode === 'qr' && qrSubMode === 'generate' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><QrCode className="w-5 h-5 text-orange-400" /> Generer QR Membre</h3>
                <button onClick={() => setQrSubMode('scan')} className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Scanner
                </button>
              </div>
              <select onChange={e => setSelectedMember(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white mb-6 focus:outline-none focus:border-orange-500">
                <option value={0}>Selectionner un membre</option>
                {members?.map(m => <option key={m.id} value={m.id!}>{m.firstName} {m.lastName}</option>)}
              </select>
              {selectedMember && selectedMember > 0 && (() => {
                const member = members?.find(m => m.id === selectedMember);
                const qrVal = member ? getMemberQRValue(member.id!) : '';
                return (
                  <div className="text-center">
                    <IGCQRCode value={qrVal} size={200} memberName={member ? `${member.firstName} ${member.lastName}` : undefined} />
                    <p className="text-xs text-gray-500 mt-2">{qrVal}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {accessMode === 'birthdate' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-400" /> Par date de naissance</h3>
              <p className="text-sm text-gray-400 mb-4">Saisissez la date de naissance du membre pour le pointer</p>
              <input type="date" value={birthDateInput} onChange={e => { setBirthDateInput(e.target.value); setFoundMembers([]); }} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500"
                onKeyDown={e => { if (e.key === 'Enter' && birthDateInput) handleBirthDateSearch(); }} />
              <button onClick={handleBirthDateSearch} disabled={!birthDateInput} className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium">Rechercher</button>

              {foundMembers.length > 1 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-400">{foundMembers.length} membres trouvés :</p>
                  {foundMembers.map(m => (
                    <button key={m.id} onClick={() => performCheckin(m.id!)} className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left">
                      <span className="text-sm text-white">{m.firstName} {m.lastName}</span>
                      <span className="text-xs text-gray-400">{formatPhoneDisplay(m.phone)}</span>
                    </button>
                  ))}
                </div>
              )}

              {foundMembers.length === 0 && birthDateInput && scanStatus === 'idle' && (
                <p className="text-center text-gray-500 mt-4 text-sm">Aucun membre avec cette date de naissance</p>
              )}

              {scanStatus === 'success' && renderSuccess()}
              {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && renderBlocked()}
            </div>
          )}

          {accessMode === 'phone' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Scan className="w-5 h-5 text-orange-400" /> Par téléphone</h3>
              <p className="text-sm text-gray-400 mb-4">Saisissez le numéro de téléphone du membre (recherche partielle)</p>
              <form onSubmit={e => { e.preventDefault(); if (phoneInput.trim()) handlePhoneSearch(); }} className="relative">
                <input 
                  type="text" 
                  value={phoneInput} 
                  onChange={e => handlePhoneChange(e.target.value)} 
                  placeholder="Ex: 0678, 0551, 06..." 
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500"
                  autoFocus 
                />
                <button type="submit" disabled={!phoneInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm font-medium">
                  Chercher
                </button>
              </form>

              {phoneFoundMembers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-400">{phoneFoundMembers.length} membre(s) trouvé(s) :</p>
                  {phoneFoundMembers.map(m => (
                    <button key={m.id} onClick={() => { setPhoneInput(m.phone); performCheckin(m.id!); setPhoneFoundMembers([]); }} className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left">
                      <span className="text-sm text-white">{m.firstName} {m.lastName}</span>
                      <span className="text-xs text-orange-400 font-medium">{formatPhoneDisplay(m.phone)}</span>
                    </button>
                  ))}
                </div>
              )}

              {phoneFoundMembers.length === 0 && phoneInput.length >= 3 && scanStatus === 'idle' && (
                <p className="text-center text-gray-500 mt-4 text-sm">Aucun membre avec ce numéro</p>
              )}

              {scanStatus === 'error' && renderError()}
              {scanStatus === 'success' && renderSuccess()}
              {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && renderBlocked()}
            </div>
          )}

          {accessMode === 'rfid' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Fingerprint className="w-5 h-5 text-orange-400" /> Par code RFID</h3>
              <p className="text-sm text-gray-400 mb-4">Scannez ou saisissez le code RFID du membre</p>
              <form onSubmit={e => { e.preventDefault(); if (rfidInput.trim()) handleRfidSearch(); }}>
                <input type="text" value={rfidInput} onChange={e => setRfidInput(e.target.value)} placeholder="Saisir ou scanner le code RFID" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500" autoFocus />
                <button type="submit" disabled={!rfidInput.trim()} className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium">Valider</button>
              </form>

              {scanStatus === 'error' && renderError()}
              {scanStatus === 'success' && renderSuccess()}
              {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && renderBlocked()}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Check-ins du jour</h3>
            <div className="flex items-center gap-2">
              <button onClick={deleteOrphanCheckins} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Supprimer orphelins">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <button onClick={() => setRefreshKey(k => k + 1)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-orange-400 transition-colors" title="Rafraîchir">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-white">📋 Pointages du Jour</h3>
                <p className="text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">{new Set(todayCheckins?.filter(c => c.type === 'checkin').map(c => c.memberId)).size || 0} entrées</span>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">{new Set(todayCheckins?.filter(c => c.type === 'checkout').map(c => c.memberId)).size || 0} sorties</span>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">{Math.max(0, new Set(todayCheckins?.filter(c => c.type === 'checkin').map(c => c.memberId)).size - new Set(todayCheckins?.filter(c => c.type === 'checkout').map(c => c.memberId)).size)} en salle</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {(() => {
                const checkinTimes = todayCheckins?.filter(c => c.type === 'checkin').map(c => new Date(c.timestamp).getHours()) || [];
                const peakHour = checkinTimes.length > 0 ? checkinTimes.sort((a,b) => checkinTimes.filter(v => v===a).length - checkinTimes.filter(v => v===b).length).pop() : null;
                const checkoutTimes = todayCheckins?.filter(c => c.type === 'checkout').map(c => new Date(c.timestamp).getTime()) || [];
                const checkinTimesMs = todayCheckins?.filter(c => c.type === 'checkin').map(c => new Date(c.timestamp).getTime()) || [];
                const avgStayMinutes = checkoutTimes.length > 0 && checkinTimesMs.length > 0 ? Math.round(checkoutTimes.reduce((s, t, i) => s + (t - (checkinTimesMs[i] || t)), 0) / checkoutTimes.length / 60000) : 0;
                return (
                  <>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Pic d'affluence</p>
                      <p className="text-sm font-bold text-white">{peakHour !== null ? `${peakHour}h` : '-'}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Séjour moyen</p>
                      <p className="text-sm font-bold text-white">{avgStayMinutes > 0 ? `${Math.floor(avgStayMinutes / 60)}h${avgStayMinutes % 60}min` : '-'}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Taux occupation</p>
                      <p className="text-sm font-bold text-white">{members?.length ? `${(Math.max(0, new Set(todayCheckins?.filter(c => c.type === 'checkin').map(c => c.memberId)).size - new Set(todayCheckins?.filter(c => c.type === 'checkout').map(c => c.memberId)).size) / members.length * 100).toFixed(0)}%` : '-'}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Rechercher..." value={checkinSearch} onChange={(e) => setCheckinSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(() => {
                const memberSessions: { memberId: number; sessions: typeof todayCheckins }[] = [];
                const memberMap = new Map<number, typeof todayCheckins>();
                
                todayCheckins?.forEach(c => {
                  if (!memberMap.has(c.memberId)) memberMap.set(c.memberId, []);
                  memberMap.get(c.memberId)!.push(c);
                });
                
                memberMap.forEach((sessions, memberId) => {
                  memberSessions.push({ memberId, sessions });
                });
                
                const filteredMembers = memberSessions.filter(({ memberId }) => {
                  const m = members?.find(mm => mm.id === memberId);
                  const name = `${m?.firstName || ''} ${m?.lastName || ''}`.toLowerCase();
                  return name.includes(checkinSearch.toLowerCase()) || m?.phone?.includes(checkinSearch);
                }).sort((a, b) => {
                  const aTime = a.sessions?.[0]?.timestamp ? new Date(a.sessions[0].timestamp).getTime() : 0;
                  const bTime = b.sessions?.[0]?.timestamp ? new Date(b.sessions[0].timestamp).getTime() : 0;
                  return bTime - aTime;
                });

                if (filteredMembers.length === 0) {
                  return <p className="text-gray-500 text-center py-8">{checkinSearch ? 'Aucun résultat' : 'Aucun pointage aujourd\'hui'}</p>;
                }

                return filteredMembers.map(({ memberId, sessions }) => {
                  const m = members?.find(mm => mm.id === memberId);
                  const memberName = m ? `${m.firstName} ${m.lastName}` : `Inconnu`;
                  const memberPhoto = m?.photo;
                  
                  const sortedSessions = (sessions || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  const lastCheckin = sortedSessions.find(s => s.type === 'checkin');
                  const lastCheckout = sortedSessions.find(s => s.type === 'checkout');
                  
                  const checkinTime = lastCheckin ? new Date(lastCheckin.timestamp).getTime() : 0;
                  const checkoutTime = lastCheckout ? new Date(lastCheckout.timestamp).getTime() : 0;
                  const now = Date.now();
                  const isInside = lastCheckin && (!lastCheckout || checkoutTime < checkinTime);
                  const duration = isInside ? now - checkinTime : (lastCheckout ? checkoutTime - checkinTime : 0);
                  
                  return (
                    <div key={memberId} className={`flex items-center justify-between p-3 rounded-xl ${isInside ? 'bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500' : 'bg-gray-800/30 border-l-4 border-gray-600'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isInside ? 'border-green-500' : 'border-gray-600'} flex-shrink-0`}>
                          {memberPhoto ? (
                            <img src={memberPhoto} alt="" className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isInside ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                              <User className={`w-6 h-6 ${isInside ? 'text-green-400' : 'text-gray-400'}`} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{memberName}</span>
                            {isInside && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">En salle</span>}
                            {!isInside && lastCheckout && <span className="px-1.5 py-0.5 bg-gray-600/20 text-gray-400 text-[10px] rounded-full">Parti</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="text-green-400">↗</span>
                              {lastCheckin ? new Date(lastCheckin.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                            {lastCheckout && (
                              <span className="flex items-center gap-1">
                                <span className="text-red-400">↘</span>
                                {new Date(lastCheckout.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded ${isInside ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                              {formatDuration(Math.round(duration / 60000))}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isInside && (
                        <button onClick={() => performCheckout(memberId)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 font-medium">
                          ➜ Sortie
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ----- RFID Installation Module ----- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Module installation détecteur RFID</h3>
          </div>
          <button onClick={() => setShowRfidModule(!showRfidModule)} className="p-2 text-gray-400 hover:text-white transition-colors">
            {showRfidModule ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        {showRfidModule && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <Radio className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-white font-medium mb-1">1. Détecteur RFID</p>
                <p className="text-gray-400 text-xs">Branchez le lecteur RFID USB (ZKTeco / Hikvision compatible) sur le PC de pointage</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <Monitor className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-medium mb-1">2. Bridge Logiciel</p>
                <p className="text-gray-400 text-xs">Installez le Bridge sur le PC connecté — il relaye les badges vers le cloud</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-medium mb-1">3. Pairage</p>
                <p className="text-gray-400 text-xs">Associez le détecteur dans la section tourniquets et testez avec un badge</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-gray-300 text-xs">Les badges RFID scannés sont automatiquement reconnus comme check-in. Configurez le code RFID de chaque membre dans sa fiche.</p>
              <a href="/turnstiles/install" className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1">
                Guide complet <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ----- Investigation & Security Panel ----- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Historique & Investigation</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportHistory} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => setShowInvestigation(!showInvestigation)} className="p-2 text-gray-400 hover:text-white transition-colors">
              {showInvestigation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {showInvestigation && (
          <div className="space-y-4">
            {/* Filters row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Du</label>
                <input type="date" value={invDateFrom} onChange={e => setInvDateFrom(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Au</label>
                <input type="date" value={invDateTo} onChange={e => setInvDateTo(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Mode de recherche</label>
                <div className="flex gap-1">
                  {(['name', 'phone', 'birthdate'] as const).map(m => (
                    <button key={m} onClick={() => setInvFilterMode(m)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${invFilterMode === m ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {m === 'name' ? 'Nom' : m === 'phone' ? 'Tél' : 'Date naiss.'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">{invFilterMode === 'name' ? 'Rechercher' : invFilterMode === 'phone' ? 'Téléphone' : 'Date naissance'} :</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  {invFilterMode === 'birthdate' ? (
                    <input type="date" value={invSearch} onChange={e => setInvSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
                  ) : (
                    <input type="text" value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder={invFilterMode === 'name' ? 'Nom du membre...' : '05 50 00 00 11...'} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Results table */}
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-3 py-2 text-left">Membre</th>
                    <th className="px-3 py-2 text-left">Téléphone</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Entrée</th>
                    <th className="px-3 py-2 text-left">Sortie</th>
                    <th className="px-3 py-2 text-left">Durée</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const memberSessions: { memberId: number; ci: Date | null; co: Date | null }[] = [];
                    const map = new Map<string, { memberId: number; ci: Date | null; co: Date | null }>();
                    (historyData || []).forEach(c => {
                      const d = new Date(c.timestamp);
                      const key = `${c.memberId}_${d.toDateString()}`;
                      const entry = map.get(key) || { memberId: c.memberId, ci: null, co: null };
                      if (c.type === 'checkin' && (!entry.ci || d > entry.ci)) entry.ci = d;
                      if (c.type === 'checkout' && (!entry.co || d > entry.co)) entry.co = d;
                      map.set(key, entry);
                    });
                    map.forEach(v => memberSessions.push(v));
                    const filtered = memberSessions.filter(item => {
                      const m = members?.find(mm => mm.id === item.memberId);
                      if (!m) return false;
                      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
                      const phone = m.phone?.replace(/\s/g, '') || '';
                      const search = invSearch.toLowerCase().replace(/\s/g, '');
                      if (!search) return true;
                      if (invFilterMode === 'name') return name.includes(search);
                      if (invFilterMode === 'phone') return phone.includes(search);
                      if (invFilterMode === 'birthdate') return (m.birthDate || '').includes(search);
                      return true;
                    }).sort((a, b) => {
                      const dateA = a.ci || a.co || new Date(0);
                      const dateB = b.ci || b.co || new Date(0);
                      return dateB.getTime() - dateA.getTime();
                    });
                    if (filtered.length === 0) {
                      return <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun pointage trouvé pour cette période</td></tr>;
                    }
                    return filtered.slice(0, 200).map(item => {
                      const m = members?.find(mm => mm.id === item.memberId);
                      const isInside = item.ci && (!item.co || item.co < item.ci);
                      const dur = item.ci && item.co ? Math.round((item.co.getTime() - item.ci.getTime()) / 60000) : (item.ci ? Math.round((Date.now() - item.ci.getTime()) / 60000) : 0);
                      const h = Math.floor(dur / 60);
                      const min = dur % 60;
                      return (
                        <tr key={`${item.memberId}_${item.ci?.getTime() || 0}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="px-3 py-2.5 text-sm text-white font-medium">{m ? `${m.firstName} ${m.lastName}` : `#${item.memberId}`}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-400">{m?.phone ? formatPhoneDisplay(m.phone) : '-'}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-400">{item.ci?.toLocaleDateString('fr-FR') || item.co?.toLocaleDateString('fr-FR') || '-'}</td>
                          <td className="px-3 py-2.5 text-xs text-green-400">{item.ci ? item.ci.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td className="px-3 py-2.5 text-xs text-red-400">{item.co ? item.co.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (isInside ? <span className="text-blue-400">En salle</span> : '-')}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-300">{dur > 0 ? `${h}h${min > 0 ? min + 'min' : ''}` : '-'}</td>
                          <td className="px-3 py-2.5">{isInside ? <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">En salle</span> : <span className="px-2 py-0.5 bg-gray-600/20 text-gray-400 text-[10px] rounded-full">Terminé</span>}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">{(historyData || []).length} pointages dans cette période · {new Set(historyData?.map(c => c.memberId)).size} membres distincts</p>
          </div>
        )}
      </div>
    </div>
    {kioskMode && (
      <KioskOverlay
        members={members}
        accessMode={accessMode}
        setAccessMode={setAccessMode}
        scanStatus={scanStatus}
        setScanStatus={setScanStatus}
        scannedMember={scannedMember}
        earnedPoints={earnedPoints}
        performCheckin={performCheckin}
        handleBypass={handleBypass}
        onExit={() => { setKioskMode(false); if (document.fullscreenElement) document.exitFullscreen(); }}
      />
    )}
  </>
  );
}