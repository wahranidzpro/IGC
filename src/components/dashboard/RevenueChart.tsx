'use client';

import { BarChart3, Sun, Activity, TrendingUp, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

const COLORS = ['#f97316', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#eab308', '#14b8a6', '#ec4899'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
        <p className="text-gray-300 font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()} DA</p>)}
      </div>
    );
  }
  return null;
};

interface DailyRevenueData {
  day: string;
  Abonnements: number;
  Produits: number;
}

interface DayOfWeekData {
  day: string;
  total: number;
  avg: number;
  count: number;
}

interface WeeklyCheckinData {
  day: string;
  checkins: number;
}

interface RevenueSplitData {
  name: string;
  value: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface RevenueChartProps {
  dailyRevenue: DailyRevenueData[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  dayOfWeekData: DayOfWeekData[];
  weeklyCheckins: WeeklyCheckinData[];
  monthlyRevenue: { month: string; Abonnements: number; Produits: number }[];
  revenueSplit: RevenueSplitData[];
  statusData: StatusData[];
  totalRevenue: number;
  now: Date;
}

export default function RevenueChart({
  dailyRevenue,
  selectedMonth,
  onMonthChange,
  dayOfWeekData,
  weeklyCheckins,
  monthlyRevenue,
  revenueSplit,
  statusData,
  totalRevenue,
  now,
}: RevenueChartProps) {
  const bestDay = [...dayOfWeekData].sort((a, b) => b.total - a.total)[0];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Revenus par jour</h3>
            <input type="month" value={selectedMonth} onChange={e => onMonthChange(e.target.value)} className="ml-auto px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} interval={2} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Abonnements" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Produits" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-gray-400">Abonnements</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /><span className="text-gray-400">Produits</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Performance par jour</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Revenus cumulés · Idéal pour promos</p>
            <div className="space-y-2">
              {dayOfWeekData.sort((a, b) => b.total - a.total).map((d, i) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16">{d.day}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-5 relative overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all" style={{ width: `${bestDay.total > 0 ? (d.total / bestDay.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-300 w-20 text-right">{d.total.toLocaleString()} DA</span>
                  {i === 0 && <span className="text-xs text-yellow-400 w-12">🔥 Top</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Fréquentation / jour</h3>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCheckins}>
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="checkins" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Revenus mensuels {now.getFullYear()} · Abonnements vs Produits</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Abonnements" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Produits" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Répartition revenus</h3>
            </div>
            <div className="h-48 flex items-center justify-center">
              {revenueSplit.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={revenueSplit} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${((value / totalRevenue) * 100).toFixed(0)}%`}>
                      {revenueSplit.map((_, i) => <Cell key={i} fill={[ '#22c55e', '#f97316' ][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                  </RPieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500">Aucun revenu</p>}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Statut membres</h3>
            </div>
            <div className="h-48 flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </RPieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500">Aucun membre</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
