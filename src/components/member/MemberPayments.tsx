'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { DollarSign, CreditCard, Wallet, TrendingUp } from 'lucide-react';

interface MemberPaymentsProps {
  memberId: number;
}

export function MemberPayments({ memberId }: MemberPaymentsProps) {
  const payments = useLiveQuery(
    () => db.payments.where('memberId').equals(memberId).reverse().limit(10).toArray(),
    [memberId]
  );

  const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte';
      case 'wallet': return 'Wallet';
      case 'points': return 'Points';
      default: return mode;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Abonnement';
      case 'product': return 'Produit';
      default: return type;
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-orange-400" />
          </span>
          Mes Paiements
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total payé</p>
          <p className="text-xl font-bold text-green-400">{totalPaid.toLocaleString()} DA</p>
        </div>
      </div>

      {payments && payments.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  payment.type === 'subscription' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {getModeIcon(payment.mode)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {getTypeLabel(payment.type)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(payment.date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })} • {getModeLabel(payment.mode)}
                  </p>
                </div>
              </div>
              <p className="text-white font-bold">{payment.amount.toLocaleString()} DA</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Aucun paiement enregistré</p>
        </div>
      )}
    </div>
  );
}