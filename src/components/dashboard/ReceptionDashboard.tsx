'use client';

import { Users, UserCheck, AlertTriangle, Package, Receipt } from 'lucide-react';

interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  subscriptionType: string;
  createdAt: string | Date;
  [key: string]: any;
}

interface Checkin {
  id?: number;
  memberId: number;
  type: string;
  timestamp: string | Date;
  [key: string]: any;
}

interface Alert {
  id?: number;
  type: string;
  message: string;
  [key: string]: any;
}

interface DailyRevenue {
  subscriptions: number;
  products: number;
  coaching: number;
  events: number;
  total: number;
}

interface ReceptionDashboardProps {
  members: Member[] | undefined;
  checkins: Checkin[] | undefined;
  alerts: Alert[] | undefined;
  dailyRevenue: DailyRevenue;
}

export default function ReceptionDashboard({ members, checkins, alerts, dailyRevenue }: ReceptionDashboardProps) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCheckins = checkins?.filter(c => {
    const d = new Date(c.timestamp);
    return d >= todayStart && c.type === 'checkin';
  }) || [];

  const recentMembers = members
    ? [...members].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
    : [];

  const stockAlerts = alerts?.filter(a => a.type === 'stock') || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Check-ins du jour</h3>
            <span className="ml-auto text-sm text-gray-400">{todayCheckins.length}</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayCheckins.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun check-in aujourd'hui</p>
            ) : (
              todayCheckins.map((c, i) => {
                const member = members?.find(m => m.id === c.memberId);
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                        {member?.firstName?.[0] || '?'}{member?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm text-white">{member ? `${member.firstName} ${member.lastName}` : `Inconnu`}</p>
                        <p className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-400 font-medium">Entré</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Recette du jour</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-gray-300">Abonnements</span>
              </div>
              <span className="font-bold text-green-400">{dailyRevenue.subscriptions.toLocaleString()} DA</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-gray-300">Produits POS</span>
              </div>
              <span className="font-bold text-orange-400">{dailyRevenue.products.toLocaleString()} DA</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-300">Coaching</span>
              </div>
              <span className="font-bold text-blue-400">{dailyRevenue.coaching.toLocaleString()} DA</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-gray-300">Événements</span>
              </div>
              <span className="font-bold text-purple-400">{dailyRevenue.events.toLocaleString()} DA</span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-white font-semibold">Total encaissé</span>
              <span className="text-2xl font-bold text-green-400">{dailyRevenue.total.toLocaleString()} DA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Derniers adhérents inscrits</h3>
            <span className="ml-auto text-sm text-gray-400">{members?.length || 0} total</span>
          </div>
          <div className="space-y-2">
            {recentMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun adhérent</p>
            ) : (
              recentMembers.map((m, i) => (
                <div key={m.id ?? i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                      {m.firstName?.[0] || '?'}{m.lastName?.[0] || ''}
                    </div>
                    <div>
                      <p className="text-sm text-white">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-500">{m.phone || ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${m.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {m.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Alertes</h3>
            <span className="ml-auto text-sm text-gray-400">{stockAlerts.length}</span>
          </div>
          {stockAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune alerte</p>
          ) : (
            <div className="space-y-2">
              {stockAlerts.map((a, i) => (
                <div key={a.id ?? i} className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm text-gray-300">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
