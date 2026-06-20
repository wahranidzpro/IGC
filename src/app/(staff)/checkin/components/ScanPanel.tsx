'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Camera, QrCode } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';
import type { Member } from '@/lib/db/dexie-db';
import type { ScanStatus } from '../checkin-utils';
import { parseQRMemberId } from '../checkin-utils';
import { getMemberQRValue } from '@/lib/whatsapp';
import IGCQRCode from '@/components/IGCQRCode';
import { logger } from '@/lib/logger';
import MemberInfo from './MemberInfo';

export interface ScanPanelHandle {
  restartScanner: () => void;
}

interface ScanPanelProps {
  members: Member[] | undefined;
  onPerformCheckin: (memberId: number) => Promise<void>;
  scanStatus: ScanStatus;
  setScanStatus: React.Dispatch<React.SetStateAction<ScanStatus>>;
  selectedMember: number | null;
  setSelectedMember: React.Dispatch<React.SetStateAction<number | null>>;
  earnedPoints: number;
  scannedMember: Member | null | undefined;
  handleBypass: () => Promise<void>;
  kioskMode: boolean;
}

const ScanPanel = forwardRef<ScanPanelHandle, ScanPanelProps>((props, ref) => {
  const { members, onPerformCheckin, setScanStatus } = props;
  const [qrSubMode, setQrSubMode] = useState<'scan' | 'generate'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);
  const handleScanRef = useRef<((code: string) => Promise<void>) | null>(null);

  const handleScan = useCallback(async (code: string) => {
    setManualCode('');
    const memberId = parseQRMemberId(code);
    if (memberId && members?.find(m => m.id === memberId)) {
      await onPerformCheckin(memberId);
    } else {
      setScanStatus('error');
      setTimeout(() => { setScanStatus('idle'); startScannerRef.current(); }, 10000);
    }
  }, [members, onPerformCheckin, setScanStatus]);

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
  }, [setScanStatus]);

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

  useEffect(() => {
    if (props.kioskMode) stopScanner();
  }, [props.kioskMode, stopScanner]);

  const startScannerRef = useRef<() => Promise<void>>(async () => {});
  startScannerRef.current = startScanner;

  useImperativeHandle(ref, () => ({
    restartScanner: () => {
      if (qrSubMode === 'scan') {
        setManualCode('');
        setCameraError('');
        startScannerRef.current();
      }
    }
  }));

  if (qrSubMode === 'generate') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><QrCode className="w-5 h-5 text-orange-400" /> Generer QR Membre</h3>
          <button onClick={() => setQrSubMode('scan')} className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /> Scanner
          </button>
        </div>
        <select onChange={e => props.setSelectedMember(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white mb-6 focus:outline-none focus:border-orange-500">
          <option value={0}>Selectionner un membre</option>
          {props.members?.map(m => <option key={m.id} value={m.id!}>{m.firstName} {m.lastName}</option>)}
        </select>
        {props.selectedMember && props.selectedMember > 0 && (() => {
          const member = props.members?.find(m => m.id === props.selectedMember);
          const qrVal = member ? getMemberQRValue(member.id!) : '';
          return (
            <div className="text-center">
              <IGCQRCode value={qrVal} size={200} memberName={member ? `${member.firstName} ${member.lastName}` : undefined} />
              <p className="text-xs text-gray-500 mt-2">{qrVal}</p>
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-orange-400" /> Scanner QR Code</h3>
        <button onClick={() => { stopScanner(); setQrSubMode('generate'); }} className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" /> Generer QR
        </button>
      </div>
      <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-gray-800" style={{ minHeight: 300, width: '100%' }}></div>

      {!isScanning && props.scanStatus === 'idle' && !cameraError && (
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

      {props.scanStatus === 'error' && (
        <MemberInfo {...props} cameraError={cameraError} startScanner={startScanner} />
      )}
      {props.scanStatus === 'success' && <MemberInfo {...props} />}
      {(props.scanStatus === 'expired' || props.scanStatus === 'inactive' || props.scanStatus === 'blocked' || props.scanStatus === 'inside') && <MemberInfo {...props} />}

      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Probleme de camera ? Saisissez le code QR manuellement :</p>
        <form onSubmit={e => { e.preventDefault(); if (manualCode.trim()) handleScan(manualCode.trim()); }} className="flex gap-2">
          <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="IGC:123 ou INF-..." className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
          <button type="submit" disabled={!manualCode.trim()} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">Valider</button>
        </form>
      </div>
    </div>
  );
});

ScanPanel.displayName = 'ScanPanel';
export default ScanPanel;
