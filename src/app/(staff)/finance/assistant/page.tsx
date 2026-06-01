'use client';

import { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { useLanguage } from '@/lib/context/language-context';
import { Printer, FileText, Calendar, CalendarRange } from 'lucide-react';

export default function FinanceAssistantPage() {
  const { t } = useLanguage();
  const pdfRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [dateFrom, setDateFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const payments = useLiveQuery(() => db.payments.toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);

  const now = new Date();

  const filteredByPeriod = useMemo(() => {
    if (!payments || !expenses) return { payments: [], expenses: [], sales: [] };
    let start: Date;
    let end: Date | undefined;
    if (period === 'custom') {
      start = new Date(dateFrom + 'T00:00:00');
      end = new Date(dateTo + 'T23:59:59');
    } else if (period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1));
    } else { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    return {
      payments: payments.filter(p => { const d = new Date(p.date); return d >= start && (!end || d <= end); }),
      expenses: expenses.filter(e => { const d = new Date(e.date); return d >= start && (!end || d <= end); }),
      sales: (sales || []).filter(s => { const d = new Date(s.createdAt); return d >= start && (!end || d <= end); }),
    };
  }, [payments, expenses, sales, period, now, dateFrom, dateTo]);

  const revenue = useMemo(() => {
    const fromPayments = filteredByPeriod.payments.reduce((s, p) => s + p.amount, 0);
    const fromSales = filteredByPeriod.sales.reduce((s, sl) => s + sl.total, 0);
    const byType: Record<string, number> = {};
    for (const p of filteredByPeriod.payments) {
      byType[p.type] = (byType[p.type] || 0) + p.amount;
    }
    if (filteredByPeriod.sales.length > 0) {
      byType['sales'] = (byType['sales'] || 0) + fromSales;
    }
    return { total: fromPayments + fromSales, fromPayments, fromSales, byType };
  }, [filteredByPeriod]);

  const expenseTotal = useMemo(() =>
    filteredByPeriod.expenses.reduce((s, e) => s + e.amount, 0),
    [filteredByPeriod.expenses]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredByPeriod.expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return map;
  }, [filteredByPeriod.expenses]);

  const profit = revenue.total - expenseTotal;

  const periodLabel = period === 'daily' ? "Aujourd'hui" : period === 'weekly' ? 'Cette semaine' : period === 'custom' ? `Du ${dateFrom} au ${dateTo}` : 'Ce mois';

  const topExpenseCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  const revenueByType = Object.entries(revenue.byType).sort((a, b) => b[1] - a[1]);

  const monthlyHistory = useMemo(() => {
    if (!payments || !expenses) return [];
    const months: Record<string, { revenue: number; expenses: number }> = {};
    for (const p of payments) {
      const k = new Date(p.date).toISOString().slice(0, 7);
      if (!months[k]) months[k] = { revenue: 0, expenses: 0 };
      months[k].revenue += p.amount;
    }
    if (sales) {
      for (const s of sales) {
        const k = new Date(s.createdAt).toISOString().slice(0, 7);
        if (!months[k]) months[k] = { revenue: 0, expenses: 0 };
        months[k].revenue += s.total;
      }
    }
    for (const e of expenses) {
      const k = new Date(e.date).toISOString().slice(0, 7);
      if (!months[k]) months[k] = { revenue: 0, expenses: 0 };
      months[k].expenses += e.amount;
    }
    return Object.entries(months).sort().slice(-6);
  }, [payments, expenses, sales]);

  const formatCurrency = (v: number) => `${v.toLocaleString()} DA`;
  const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Assistant Comptable</h2>
            <p className="text-gray-400 text-sm">INFINITY GYM CENTER · {t('gym.tagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm text-white font-medium transition-all cursor-pointer">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {(['daily', 'weekly', 'monthly', 'custom'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              period === p ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {p === 'daily' ? 'Journalier' : p === 'weekly' ? 'Hebdomadaire' : p === 'monthly' ? 'Mensuel' : 'Personnalisé'}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <CalendarRange className="w-4 h-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
            <span className="text-gray-500 text-sm">au</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
        )}
      </div>

      {/* PDF Content */}
      <div ref={pdfRef} className="space-y-6" style={{ background: 'white', color: '#111827', padding: '20px', borderRadius: '12px' }}>
        <img src="/logo-transparent.png" alt="" className="print-watermark" />
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
          <div className="relative p-6 text-center text-white">
            <p className="text-xs uppercase tracking-widest opacity-70">INFINITY GYM CENTER</p>
            <h1 className="text-2xl font-bold mt-1">Fiche Comptabilité</h1>
            <p className="text-sm opacity-80 mt-1">{periodLabel} · {formatDate(now)}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4" style={{ marginTop: '16px' }}>
          <div className="p-4 rounded-xl" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#059669' }}>Revenus</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#065f46' }}>{formatCurrency(revenue.total)}</p>
            {revenue.fromSales > 0 && <p className="text-xs mt-1" style={{ color: '#6ee7b7' }}>Dont ventes: {formatCurrency(revenue.fromSales)}</p>}
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#dc2626' }}>Dépenses</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#991b1b' }}>{formatCurrency(expenseTotal)}</p>
            <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{filteredByPeriod.expenses.length} entrée(s)</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: profit >= 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${profit >= 0 ? '#a7f3d0' : '#fecaca'}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: profit >= 0 ? '#059669' : '#dc2626' }}>Bénéfice</p>
            <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </p>
            {revenue.total > 0 && <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Marge: {Math.round((profit / revenue.total) * 100)}%</p>}
          </div>
        </div>

        {/* Revenue & Expense details */}
        <div className="grid grid-cols-2 gap-6" style={{ marginTop: '16px' }}>
          <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#059669' }}>Revenus détaillés</h3>
            {revenueByType.length > 0 ? (
              <div className="space-y-2">
                {revenueByType.map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#374151' }}>{type}</span>
                    <span className="text-sm font-semibold" style={{ color: '#059669' }}>{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm" style={{ color: '#9ca3af' }}>Aucun revenu</p>}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
              <span className="text-sm font-bold" style={{ color: '#111827' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#059669' }}>{formatCurrency(revenue.total)}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#dc2626' }}>Dépenses par catégorie</h3>
            {topExpenseCategories.length > 0 ? (
              <div className="space-y-2">
                {topExpenseCategories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#374151' }}>{cat}</span>
                    <span className="text-sm font-semibold" style={{ color: '#dc2626' }}>{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm" style={{ color: '#9ca3af' }}>Aucune dépense</p>}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
              <span className="text-sm font-bold" style={{ color: '#111827' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#dc2626' }}>{formatCurrency(expenseTotal)}</span>
            </div>
          </div>
        </div>

        {/* Monthly history */}
        {monthlyHistory.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
              <Calendar className="w-4 h-4" /> Historique mensuel (6 derniers mois)
            </h3>
            <div className="space-y-2">
              {monthlyHistory.map(([month, data]) => {
                const m = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                const p = data.revenue - data.expenses;
                return (
                  <div key={month} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium" style={{ color: '#374151' }}>{m}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: '#059669' }}>+{formatCurrency(data.revenue)}</span>
                      <span style={{ color: '#dc2626' }}>-{formatCurrency(data.expenses)}</span>
                      <span className="font-semibold" style={{ color: p >= 0 ? '#059669' : '#dc2626' }}>{p >= 0 ? '+' : ''}{formatCurrency(p)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Document généré par INFINITY GYM CENTER · Assistant Comptable · {formatDate(now)}</p>
        </div>
      </div>

      {/* Print styles injected */}
      <style jsx global>{`
        .print-watermark { display: none; }
        @media print {
          aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          .print-watermark {
            display: block !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60%;
            opacity: 0.08;
            pointer-events: none;
            z-index: 0;
          }
          body { background: white !important; }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
