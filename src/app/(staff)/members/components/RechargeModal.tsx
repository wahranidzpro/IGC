'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/db/dexie-db';
import type { Member } from '@/lib/db/dexie-db';
import { logAudit } from '@/lib/audit';
import { earnPoints, spendPoints, calculatePointsValue } from '@/lib/loyalty';

interface RechargeModalProps {
  member: Member;
  onClose: () => void;
  user: unknown;
  role: string | null;
}

export default function RechargeModal({ member, onClose, user, role }: RechargeModalProps) {
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Recharger la carte</h3>
            <p className="text-sm text-gray-400 mt-1">{member.firstName} {member.lastName}</p>
          </div>
          <button onClick={() => { setUsePoints(false); setPointsToUse(0); onClose(); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl">
            <span className="text-sm text-purple-400">Solde actuel</span>
            <span className="text-xl font-bold text-purple-400">{(member.advance || 0).toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-xl">
            <span className="text-sm text-yellow-400">Points disponibles</span>
            <span className="text-xl font-bold text-yellow-400">{member.fidelityPoints || 0} pts</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Montant a ajouter (DA)</label>
            <input type="number" value={rechargeAmount || ''} onChange={e => setRechargeAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-xl focus:outline-none focus:border-orange-500" placeholder="0" />
          </div>
          {rechargeAmount > 0 && (member.fidelityPoints || 0) > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <span className="text-sm text-gray-400">Utiliser des points</span>
                <button
                  onClick={() => setUsePoints(!usePoints)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${usePoints ? 'bg-orange-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${usePoints ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              {usePoints && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Points a utiliser</label>
                  <input
                    type="number"
                    value={pointsToUse || ''}
                    onChange={e => setPointsToUse(Math.min(Number(e.target.value), member.fidelityPoints || 0))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    placeholder="0"
                    max={member.fidelityPoints || 0}
                  />
                  <p className="text-xs mt-1 text-gray-500">Max: {member.fidelityPoints || 0} points</p>
                </div>
              )}
            </div>
          )}
          {rechargeAmount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                <span className="text-sm text-gray-400">Nouveau solde</span>
                <span className="text-lg font-bold text-green-400">{(member.advance || 0) + rechargeAmount} DA</span>
              </div>
              {usePoints && pointsToUse > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl">
                  <span className="text-sm text-green-400">Reduction points</span>
                  <span className="text-lg font-bold text-green-400">-{calculatePointsValue(pointsToUse)} DA</span>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={async () => {
            if (rechargeAmount <= 0 || !member.id) return;
            const memberName = `${member.firstName} ${member.lastName}`;
            let pointsDiscount = 0;
            if (usePoints && pointsToUse > 0) {
              const result = await spendPoints(member.id, memberName, pointsToUse, `Reduction recharge`);
              if (!result.success) {
                alert(result.error || 'Erreur lors de l\'utilisation des points');
                return;
              }
              pointsDiscount = result.discount;
            }
            const netAmount = rechargeAmount - pointsDiscount;
            await logAudit({ action: 'member_recharge', memberId: member.id, memberName, oldValue: `${member.advance || 0} DA`, newValue: `${(member.advance || 0) + netAmount} DA` }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
            await db.members.update(member.id, { advance: (member.advance || 0) + netAmount, updatedAt: new Date() });
            const paymentId = await db.payments.add({ memberId: member.id, amount: rechargeAmount, type: 'subscription', mode: 'wallet', date: new Date(), description: pointsDiscount > 0 ? `Rechargement (reduction points: -${pointsDiscount} DA)` : 'Rechargement carte membre', createdAt: new Date() });
            await earnPoints(member.id, memberName, rechargeAmount, paymentId, 'payment');
            onClose();
            setRechargeAmount(0);
            setUsePoints(false);
            setPointsToUse(0);
          }}
          disabled={rechargeAmount <= 0}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
        >
          Recharger
        </button>
      </div>
    </div>
  );
}
