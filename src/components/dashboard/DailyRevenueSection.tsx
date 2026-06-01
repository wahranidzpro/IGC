'use client';

import { Receipt } from 'lucide-react';

interface Payment {
  id?: number;
  memberId: number;
  amount: number;
  type: string;
  mode: string;
  date: string | Date;
  description?: string;
  [key: string]: any;
}

interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface DailyRevenueData {
  day: string;
  Abonnements: number;
  Produits: number;
}

interface DailyRevenueSectionProps {
  dailyRevenue: DailyRevenueData[];
  dailyPayments: Payment[];
  today: Date;
  members?: Member[];
}

export default function DailyRevenueSection({ dailyRevenue, dailyPayments, today, members }: DailyRevenueSectionProps) {
  const todaySubRevenue = dailyPayments.filter(p => p.type === 'subscription').reduce((s, p) => s + p.amount, 0);
  const todayProdRevenue = dailyPayments.filter(p => p.type === 'product').reduce((s, p) => s + p.amount, 0);
  const todayCoachingRevenue = dailyPayments.filter(p => p.type === 'coaching').reduce((s, p) => s + p.amount, 0);
  const todayEventRevenue = dailyPayments.filter(p => p.type === 'event').reduce((s, p) => s + p.amount, 0);
  const todayRevenue = dailyPayments.reduce((s, p) => s + p.amount, 0);

  const cashTotal = dailyPayments.filter(p => p.mode === 'cash').reduce((s, p) => s + p.amount, 0);
  const cardTotal = dailyPayments.filter(p => p.mode === 'card').reduce((s, p) => s + p.amount, 0);
  const walletTotal = dailyPayments.filter(p => p.mode === 'wallet').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Recette du jour</h3>
          <span className="ml-auto text-sm text-gray-400">{dailyPayments.length} transaction(s)</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-300">Abonnements</span>
            </div>
            <span className="font-bold text-green-400">{todaySubRevenue.toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-300">Produits POS</span>
            </div>
            <span className="font-bold text-orange-400">{todayProdRevenue.toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-300">Coaching</span>
            </div>
            <span className="font-bold text-blue-400">{todayCoachingRevenue.toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-gray-300">Événements</span>
            </div>
            <span className="font-bold text-purple-400">{todayEventRevenue.toLocaleString()} DA</span>
          </div>
          <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-white font-semibold">Total encaissé</span>
            <span className="text-2xl font-bold text-green-400">{todayRevenue.toLocaleString()} DA</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Mode de paiement</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-300">Espèces</span>
            </div>
            <span className="font-bold text-green-400">{cashTotal.toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-300">Carte</span>
            </div>
            <span className="font-bold text-blue-400">{cardTotal.toLocaleString()} DA</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-gray-300">Portefeuille</span>
            </div>
            <span className="font-bold text-purple-400">{walletTotal.toLocaleString()} DA</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Détail des paiements</h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {dailyPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun encaissement aujourd'hui</p>
          ) : (
            dailyPayments.map((p, i) => {
              const member = members?.find(m => m.id === p.memberId);
              const typeLabel = p.type === 'subscription' ? 'Abonnement' : p.type === 'product' ? 'Produit POS' : p.type === 'coaching' ? 'Coaching' : 'Événement';
              const typeColor = p.type === 'subscription' ? 'text-green-400' : p.type === 'product' ? 'text-orange-400' : p.type === 'coaching' ? 'text-blue-400' : 'text-purple-400';
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                      {member?.firstName?.[0] || '?'}{member?.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="text-sm text-white">{member ? `${member.firstName} ${member.lastName}` : `Inconnu`}</p>
                      <p className="text-xs text-gray-500">{new Date(p.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · <span className={typeColor}>{typeLabel}</span> · {p.mode === 'cash' ? 'Espèces' : p.mode === 'wallet' ? 'Portefeuille' : 'Carte'}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${typeColor}`}>{p.amount.toLocaleString()} DA</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
