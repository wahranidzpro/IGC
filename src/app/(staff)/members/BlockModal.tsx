'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Member } from '@/lib/db/dexie-db';
import { blockReasons } from './member-utils';

interface BlockModalProps {
  member: Member | null;
  onClose: () => void;
  onConfirm: (member: Member, reason: string, days: number) => void;
}

export default function BlockModal({ member, onClose, onConfirm }: BlockModalProps) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (member) {
      setTimeout(() => {
        setReason('');
        setDays(30);
      });
    }
  }, [member]);

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-red-400">Bloquer {member.firstName} {member.lastName}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Motif du blocage</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
              <option value="">Sélectionner un motif</option>
              {blockReasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Durée du blocage</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
              {reason === 'Vol' && (
                <option value={-1}>🔴 Banni (permanent)</option>
              )}
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>1 an</option>
            </select>
            {days === -1 && (
              <p className="text-red-400 text-sm mt-2 font-semibold">Blocage permanent — aucun déblocage automatique</p>
            )}
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{days === -1 ? 'Cet adhérent sera banni définitivement. Action irréversible sans déblocage manuel.' : `Cet adhérent sera bloqué pendant ${days} jours.`}</p>
          </div>
        </div>
        <button onClick={() => onConfirm(member, reason, days)} disabled={!reason} className="w-full mt-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50">
          Confirmer le blocage
        </button>
      </div>
    </div>
  );
}
