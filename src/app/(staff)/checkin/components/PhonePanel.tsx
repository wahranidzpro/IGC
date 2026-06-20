'use client';

import { useState } from 'react';
import { Scan } from 'lucide-react';
import type { Member } from '@/lib/db/dexie-db';
import type { ScanStatus } from '../checkin-utils';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import MemberInfo from './MemberInfo';

export default function PhonePanel({ members, onPerformCheckin, scanStatus, setScanStatus, earnedPoints, scannedMember, handleBypass, kioskMode }: {
  members: Member[] | undefined;
  onPerformCheckin: (memberId: number) => Promise<void>;
  scanStatus: ScanStatus;
  setScanStatus: React.Dispatch<React.SetStateAction<ScanStatus>>;
  earnedPoints: number;
  scannedMember: Member | null | undefined;
  handleBypass: () => Promise<void>;
  kioskMode: boolean;
}) {
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneFoundMembers, setPhoneFoundMembers] = useState<Member[]>([]);

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

  const handlePhoneSearch = () => {
    if (!phoneInput.trim()) return;
    const normalizedInput = phoneInput.trim().replace(/[\s\-\(\)]/g, '');
    const found = members?.filter(m => {
      const normalizedPhone = m.phone.replace(/[\s\-\(\)]/g, '');
      return normalizedPhone.includes(normalizedInput) || normalizedPhone.endsWith(normalizedInput);
    }) || [];

    if (found.length === 1) {
      onPerformCheckin(found[0].id!);
    } else if (found.length > 1) {
      setPhoneFoundMembers(found);
    } else {
      setPhoneFoundMembers([]);
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 10000);
    }
  };

  return (
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
            <button key={m.id} onClick={() => { setPhoneInput(m.phone); onPerformCheckin(m.id!); setPhoneFoundMembers([]); }} className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left">
              <span className="text-sm text-white">{m.firstName} {m.lastName}</span>
              <span className="text-xs text-orange-400 font-medium">{formatPhoneDisplay(m.phone)}</span>
            </button>
          ))}
        </div>
      )}

      {phoneFoundMembers.length === 0 && phoneInput.length >= 3 && scanStatus === 'idle' && (
        <p className="text-center text-gray-500 mt-4 text-sm">Aucun membre avec ce numéro</p>
      )}

      {scanStatus === 'error' && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
      {scanStatus === 'success' && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
      {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
    </div>
  );
}
