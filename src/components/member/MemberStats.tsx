'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface MemberStatsProps {
  memberId: number;
}

export function MemberStats({ memberId }: MemberStatsProps) {
  const payments = useLiveQuery(
    () => db.payments.where('memberId').equals(memberId).toArray(),
    [memberId]
  );
  
  const checkins = useLiveQuery(
    () => db.checkins.where('memberId').equals(memberId).toArray(),
    [memberId]
  );

  // Payment data by month
  const paymentByMonth = payments?.reduce((acc, payment) => {
    const month = new Date(payment.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentChartData = Object.entries(paymentByMonth || {})
    .map(([month, amount]) => ({ month, amount }))
    .slice(-6);

  // Checkins by month
  const checkinByMonth = checkins?.reduce((acc, checkin) => {
    const month = new Date(checkin.timestamp).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const checkinChartData = Object.entries(checkinByMonth || {})
    .map(([month, count]) => ({ month, count }))
    .slice(-6);

  // Sessions status
  const member = useLiveQuery(() => db.members.get(memberId), [memberId]);
  const sessionsData = [
    { name: 'Utilisées', value: 24 - (member?.sessionsLeft || 0), color: '#f97316' },
    { name: 'Restantes', value: member?.sessionsLeft || 0, color: '#22c55e' },
  ];

  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Weekly activity
  const weeklyActivity = checkins?.reduce((acc, checkin) => {
    const date = new Date(checkin.timestamp);
    const day = days[date.getDay()];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const weeklyData = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => ({
    day,
    count: weeklyActivity[day] || 0,
  }));

  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7'];

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        Mes Statistiques
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">💰 Paiements (DA)</h4>
          {paymentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>

        {/* Checkins History */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">🚪 Pointages mensuels</h4>
          {checkinChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={checkinChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">📅 Activité hebdomadaire</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sessions Status */}
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">⏱️ Sessions</h4>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={sessionsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  paddingAngle={5}
                >
                  {sessionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-4 space-y-2">
              {sessionsData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-300">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-800">
        <div className="text-center p-3 bg-gray-800/30 rounded-xl">
          <p className="text-2xl font-bold text-orange-400">{checkins?.filter(c => (c.type as string) === 'checkin').length || 0}</p>
          <p className="text-xs text-gray-400">Entrées totales</p>
        </div>
        <div className="text-center p-3 bg-gray-800/30 rounded-xl">
          <p className="text-2xl font-bold text-green-400">{payments?.reduce((sum, p) => sum + p.amount, 0).toLocaleString() || 0} DA</p>
          <p className="text-xs text-gray-400">Total payé</p>
        </div>
        <div className="text-center p-3 bg-gray-800/30 rounded-xl">
          <p className="text-2xl font-bold text-blue-400">{member?.sessionsLeft || 0}</p>
          <p className="text-xs text-gray-400">Sessions restantes</p>
        </div>
        <div className="text-center p-3 bg-gray-800/30 rounded-xl">
          <p className="text-2xl font-bold text-purple-400">{member?.fidelityPoints || 0}</p>
          <p className="text-xs text-gray-400">Points fidélité</p>
        </div>
      </div>
    </div>
  );
}