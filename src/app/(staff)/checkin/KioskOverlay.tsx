'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, CheckCircle, User, Ban, Unlock, XCircle, UserCheck, ShieldAlert, Minimize2, RefreshCw } from 'lucide-react';
import { parseMemberIdFromQR } from '@/lib/whatsapp';
import type { Member } from '@/lib/db/dexie-db';
import type { AccessMode, ScanStatus } from './checkin-utils';
import type { Html5Qrcode } from 'html5-qrcode';

export default function KioskOverlay({ members, accessMode, setAccessMode, scanStatus, setScanStatus, scannedMember, earnedPoints, performCheckin, handleBypass, onExit }: {
  members: Member[] | undefined;
  accessMode: AccessMode;
  setAccessMode: (m: AccessMode) => void;
  scanStatus: ScanStatus;
  setScanStatus: React.Dispatch<React.SetStateAction<ScanStatus>>;
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

  useEffect(() => { kProcRef.current = processId; }, [processId]);
  const kStartScannerRef = useRef<(() => Promise<void>) | null>(null);
  const kStopScannerRef = useRef<(() => Promise<void>) | null>(null);

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

  useEffect(() => { kStartScannerRef.current = startKScanner; }, [startKScanner]);
  useEffect(() => { kStopScannerRef.current = stopKScanner; }, [stopKScanner]);

  useEffect(() => {
    if (accessMode === 'qr') {
      kStartScannerRef.current?.();
    } else {
      kStopScannerRef.current?.();
    }
    return () => { kStopScannerRef.current?.(); };
  }, [accessMode]);

  const statusBg = scanStatus === 'success' ? 'from-green-700 to-green-900' :
    scanStatus === 'blocked' ? 'from-red-800 to-red-950' :
    scanStatus === 'expired' ? 'from-red-700 to-red-900' :
    scanStatus === 'inactive' ? 'from-yellow-700 to-yellow-950' :
    scanStatus === 'inside' ? 'from-blue-700 to-blue-950' :
    'from-gray-900 to-gray-950';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-gradient-to-br ${statusBg} transition-all duration-700`}>
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

      {scanStatus === 'idle' && accessMode === 'rfid' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Scannez ou saisissez le code RFID</h2>
          <input value={rfidVal} onChange={e => setRfidVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const m = members?.find(x => x.rfidCode?.toLowerCase() === e.currentTarget.value.trim().toLowerCase()); if (m) processId(m.id!); else setScanStatus('error'); setRfidVal(''); } }}
            placeholder="Code RFID..." className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500 placeholder-white/30" autoFocus />
        </div>
      )}

      {scanStatus === 'idle' && accessMode === 'birthdate' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Date de naissance</h2>
          <input type="date" value={dateVal} onChange={e => { setDateVal(e.target.value); const m = members?.filter(x => x.birthDate === e.target.value); if (m?.length === 1) processId(m[0].id!); }}
            className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500" />
        </div>
      )}

      {scanStatus === 'idle' && accessMode === 'phone' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Numéro de téléphone</h2>
          <input value={phoneVal} onChange={e => { setPhoneVal(e.target.value); const v = e.target.value.replace(/\s/g, ''); if (v.length >= 6) { const m = members?.find(x => x.phone.replace(/\s/g, '').endsWith(v)); if (m) processId(m.id!); } }}
            placeholder="Ex: 0555000011" className="w-full max-w-sm px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-2xl text-center focus:outline-none focus:border-orange-500 placeholder-white/30" autoFocus />
        </div>
      )}

      {scanStatus === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-500">
          <div className="w-40 h-40 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center mb-8">
            <CheckCircle className="w-24 h-24 text-green-400" />
          </div>
          <h1 className="text-7xl font-black text-white tracking-wider">ACCÈS AUTORISÉ</h1>
          {scannedMember && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl">
                {scannedMember.photo ? <Image src={scannedMember.photo} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} alt="" /> : <div className="w-full h-full bg-green-400/20 flex items-center justify-center"><User className="w-14 h-14 text-green-400" /></div>}
              </div>
              <p className="text-4xl font-bold text-white">{scannedMember.firstName} {scannedMember.lastName}</p>
              <p className="text-xl text-green-300">+{earnedPoints} points fidélité</p>
            </div>
          )}
        </div>
      )}

      {scanStatus === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <User className="w-32 h-32 text-white/30 mb-6" />
          <h1 className="text-6xl font-black text-white/50">INTROUVABLE</h1>
          <p className="text-2xl text-white/30 mt-4">Vérifiez le code saisi</p>
        </div>
      )}

      {scanStatus === 'blocked' && scannedMember && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <Ban className="w-32 h-32 text-red-400 mb-6" />
          <h1 className="text-7xl font-black text-white">ACCÈS REFUSÉ</h1>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-red-500 shadow-2xl">
                {scannedMember.photo ? <Image src={scannedMember.photo} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} alt="" /> : <div className="w-full h-full bg-red-500/20 flex items-center justify-center"><Ban className="w-14 h-14 text-red-500" /></div>}
              </div>
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-0.5 rounded-full border ${scannedMember.blockedUntil ? 'bg-red-600 border-red-400' : 'bg-black border-red-500'}`}>{scannedMember.blockedUntil ? 'BLOQUÉ' : 'BANNI'}</div>
            </div>
            <p className="text-3xl text-white/80 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>
          </div>
          {scannedMember?.blockReason && <p className="text-2xl text-red-400 mt-4">Motif: {scannedMember.blockReason}</p>}
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {scanStatus === 'expired' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <XCircle className="w-32 h-32 text-red-400 mb-6" />
          <h1 className="text-7xl font-black text-white">ABONNEMENT EXPIRÉ</h1>
          {scannedMember && <p className="text-3xl text-white/80 mt-6 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>}
          <p className="text-2xl text-red-300 mt-4">Veuillez renouveler votre abonnement</p>
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {scanStatus === 'inactive' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <ShieldAlert className="w-32 h-32 text-yellow-400 mb-6" />
          <h1 className="text-7xl font-black text-white">COMPTE INACTIF</h1>
          {scannedMember && <p className="text-3xl text-white/80 mt-6 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>}
          <button onClick={handleBypass} className="mt-10 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xl font-bold transition-all flex items-center gap-3"><Unlock className="w-6 h-6" /> Autoriser une fois</button>
        </div>
      )}

      {scanStatus === 'inside' && scannedMember && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300">
          <UserCheck className="w-32 h-32 text-blue-400 mb-6" />
          <h1 className="text-7xl font-black text-white">DÉJÀ EN SALLE</h1>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow-2xl">
                {scannedMember.photo ? <Image src={scannedMember.photo} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} alt="" /> : <div className="w-full h-full bg-blue-500/20 flex items-center justify-center"><UserCheck className="w-14 h-14 text-blue-500" /></div>}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-blue-400">EN SALLE</div>
            </div>
            <p className="text-3xl text-white/80 font-bold">{scannedMember.firstName} {scannedMember.lastName}</p>
          </div>
          <p className="text-2xl text-blue-300 mt-4">Ce membre a déjà pointé son entrée</p>
        </div>
      )}

      <button onClick={onExit} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all z-10" title="Quitter le mode kiosque">
        <Minimize2 className="w-6 h-6" />
      </button>
    </div>
  );
}
