'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { Member } from '@/lib/db/dexie-db';
import type { ScanStatus } from '../checkin-utils';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import MemberInfo from './MemberInfo';

export default function BirthdatePanel({ members, onPerformCheckin, scanStatus, earnedPoints, scannedMember, handleBypass, kioskMode }: {
  members: Member[] | undefined;
  onPerformCheckin: (memberId: number) => Promise<void>;
  scanStatus: ScanStatus;
  earnedPoints: number;
  scannedMember: Member | null | undefined;
  handleBypass: () => Promise<void>;
  kioskMode: boolean;
}) {
  const [birthDateInput, setBirthDateInput] = useState('');
  const [foundMembers, setFoundMembers] = useState<Member[]>([]);

  const handleBirthDateSearch = () => {
    if (!birthDateInput) return;
    const matches = members?.filter(m => m.birthDate === birthDateInput) || [];
    setFoundMembers(matches);
    if (matches.length === 1) {
      onPerformCheckin(matches[0].id!);
    }
  };

  return (
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
            <button key={m.id} onClick={() => onPerformCheckin(m.id!)} className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors text-left">
              <span className="text-sm text-white">{m.firstName} {m.lastName}</span>
              <span className="text-xs text-gray-400">{formatPhoneDisplay(m.phone)}</span>
            </button>
          ))}
        </div>
      )}

      {foundMembers.length === 0 && birthDateInput && scanStatus === 'idle' && (
        <p className="text-center text-gray-500 mt-4 text-sm">Aucun membre avec cette date de naissance</p>
      )}

      {scanStatus === 'error' && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
      {scanStatus === 'success' && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
      {(scanStatus === 'expired' || scanStatus === 'inactive' || scanStatus === 'blocked' || scanStatus === 'inside') && <MemberInfo scanStatus={scanStatus} scannedMember={scannedMember} earnedPoints={earnedPoints} handleBypass={handleBypass} kioskMode={kioskMode} />}
    </div>
  );
}
