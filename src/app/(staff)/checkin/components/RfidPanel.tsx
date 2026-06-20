'use client';

import { useState, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';
import type { Member } from '@/lib/db/dexie-db';
import type { ScanStatus } from '../checkin-utils';
import MemberInfo from './MemberInfo';

export default function RfidPanel({ members, onPerformCheckin, scanStatus, setScanStatus, earnedPoints, scannedMember, handleBypass, kioskMode }: {
  members: Member[] | undefined;
  onPerformCheckin: (memberId: number) => Promise<void>;
  scanStatus: ScanStatus;
  setScanStatus: React.Dispatch<React.SetStateAction<ScanStatus>>;
  earnedPoints: number;
  scannedMember: Member | null | undefined;
  handleBypass: () => Promise<void>;
  kioskMode: boolean;
}) {
  const [rfidInput, setRfidInput] = useState('');

  const handleRfidSearch = useCallback(() => {
    if (!rfidInput.trim()) return;
    const member = members?.find(m => m.rfidCode?.toLowerCase() === rfidInput.trim().toLowerCase());
    if (member) {
      onPerformCheckin(member.id!);
    } else {
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 10000);
    }
  }, [rfidInput, members, onPerformCheckin, setScanStatus]);

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Fingerprint className="w-5 h-5 text-orange-400" /> Par code RFID</h3>
      <p className="text-sm text-gray-400 mb-4">Scannez ou saisissez le code RFID du membre</p>
      <form onSubmit={e => { e.preventDefault(); if (rfidInput.trim()) handleRfidSearch(); }}>
        <input type="text" value={rfidInput} onChange={e => setRfidInput(e.target.value)} placeholder="Saisir ou scanner le code RFID" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500" autoFocus />
        <button type="submit" disabled={!rfidInput.trim()} className="w-full mt-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium">Valider</button>
      </form>

      {scanStatus === 'error' && <MemberInfo {...{ scanStatus, scannedMember, earnedPoints, handleBypass, kioskMode }} />}
      {scanStatus === 'success' && <MemberInfo {...{ scanStatus, scannedMember, earnedPoints, handleBypass, kioskMode }} />}
      {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && <MemberInfo {...{ scanStatus, scannedMember, earnedPoints, handleBypass, kioskMode }} />}
    </div>
  );
}
