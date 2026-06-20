'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, CheckCircle, XCircle, User } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import type { Member } from '@/lib/db/dexie-db';

interface RfidModalProps {
  open: boolean;
  member: Member | null;
  onClose: () => void;
}

export default function RfidModal({ open, member, onClose }: RfidModalProps) {
  const [rfidScanInput, setRfidScanInput] = useState('');
  const [rfidScanStatus, setRfidScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Associer un badge RFID</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-800/50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
            {member.photo ? <Image src={member.photo} alt="" className="w-full h-full object-cover" unoptimized width={48} height={48} /> : <User className="w-full h-full p-2.5 text-gray-500" />}
          </div>
          <div>
            <p className="text-white font-semibold">{member.firstName} {member.lastName}</p>
            <p className="text-sm text-gray-400">{member.phone}</p>
            {member.rfidCode && (
              <p className="text-xs text-orange-400 mt-1">Badge actuel: {member.rfidCode}</p>
            )}
          </div>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!rfidScanInput.trim()) return;
          const existing = await db.members.where('rfidCode').equals(rfidScanInput.trim()).first();
          if (existing && existing.id !== member.id) {
            setRfidScanStatus('error');
            setTimeout(() => setRfidScanStatus('idle'), 3000);
            return;
          }
          await db.members.update(member.id!, { rfidCode: rfidScanInput.trim(), updatedAt: new Date() });
          setRfidScanStatus('success');
          setTimeout(() => { onClose(); setRfidScanStatus('idle'); }, 2000);
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
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors">Annuler</button>
            <button type="submit" disabled={!rfidScanInput.trim()} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors font-medium">
              Associer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
