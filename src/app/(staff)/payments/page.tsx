'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Payment } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { Plus, X } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';
import { logAudit } from '@/lib/audit';
import { earnPoints } from '@/lib/loyalty';

export default function PaymentsPage() {
  const { user, role } = useAuth();
  const coachId = role === 'coach' ? user?.coachId : undefined;
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'subscription' | 'product'>('all');
  const [formData, setFormData] = useState({ memberId: 0, amount: 0, type: 'subscription' as 'subscription' | 'product', mode: 'cash' as 'cash' | 'card', description: '' });
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const pageSize = 50;
  const totalPayments = useLiveQuery(() => db.payments.count(), []);
  const payments = useLiveQuery(() => db.payments.orderBy('date').reverse().offset(page * pageSize).limit(pageSize).toArray(), [page]);
  const members = useLiveQuery(() => {
    if (role === 'coach' && coachId) return db.members.where('coachId').equals(coachId).toArray();
    return db.members.toArray();
  }, [coachId, role]);

  const coachMemberIds = useMemo(() => role === 'coach' && members ? new Set(members.map(m => m.id)) : null, [role, members]);
  const filtered = payments?.filter(p => {
    if (filter !== 'all' && p.type !== filter) return false;
    if (coachMemberIds && !coachMemberIds.has(p.memberId)) return false;
    return true;
  });
  const totalAmount = filtered?.reduce((s, p) => s + p.amount, 0) || 0;

  const handleSave = async () => {
    if (!formData.amount || !formData.memberId) return;
    const memberName = getMemberName(formData.memberId);
    const paymentId = await db.payments.add({ ...formData, date: new Date(), createdAt: new Date() });
    await logAudit({ action: 'payment_create', memberId: formData.memberId, memberName, newValue: `${formData.amount} DA - ${formData.type} - ${formData.mode}`, reason: formData.description }, (user as { username?: string })?.username || 'unknown', role || 'unknown');

    if (formData.type === 'subscription') {
      const earned = await earnPoints(formData.memberId, memberName, formData.amount, paymentId, 'payment');
      setPointsEarned(earned);
    }

    setFormData({ memberId: 0, amount: 0, type: 'subscription', mode: 'cash', description: '' });
    setPointsEarned(null);
    setShowAddModal(false);
  };

  const getMemberName = (id: number) => members?.find(m => m.id === id)?.firstName + ' ' + (members?.find(m => m.id === id)?.lastName || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Paiements</h2><p className="text-gray-400 mt-1">Total: {totalAmount.toLocaleString()} DA</p></div>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            onExport={() => exportToXlsx(payments || [], 'paiements')}
            onImport={() => importFromXlsx<Payment>(async (items) => { await db.payments.bulkAdd(items); })}
          />
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Paiement</button>
        </div>
      </div>
      <div className="flex gap-2">
        {(['all', 'subscription', 'product'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {f === 'all' ? 'Tous' : f === 'subscription' ? 'Abonnement' : 'Produit'}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800"><th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Membre</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Mode</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Montant</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Date</th></tr></thead>
          <tbody className="case-normal">
            {filtered?.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucun paiement</td></tr> : (
              filtered?.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-white">{getMemberName(p.memberId) || 'N/A'}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${p.type === 'subscription' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{p.type === 'subscription' ? 'Abonnement' : 'Produit'}</span></td>
                  <td className="px-6 py-4 text-gray-300">{p.mode === 'cash' ? 'Espèces' : p.mode === 'wallet' ? 'Recharge' : p.mode === 'points' ? 'Points' : 'Crédit'}</td>
                  <td className="px-6 py-4 text-right text-green-400 font-medium">{p.amount.toLocaleString()} DA</td>
                  <td className="px-6 py-4 text-right text-gray-400">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">Page {page + 1} sur {Math.ceil((totalPayments || 0) / pageSize)}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-50">Precedent</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil((totalPayments || 0) / pageSize) - 1} className="px-3 py-1 rounded-lg bg-gray-800 disabled:opacity-50">Suivant</button>
        </div>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-white">Nouveau Paiement</h3><button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Membre</label><select value={formData.memberId} onChange={e => setFormData({...formData, memberId: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value={0}>Sélectionner</option>{members?.map(m => <option key={m.id} value={m.id!}>{m.firstName} {m.lastName}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Montant (DA)</label><input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'subscription' | 'product'})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="subscription">Abonnement</option><option value="product">Produit</option></select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Mode</label><select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value as 'cash' | 'card'})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="cash">Espèces</option><option value="card">Carte</option></select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
            </div>
            <button onClick={handleSave} disabled={!formData.memberId || !formData.amount} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">Enregistrer</button>
            {pointsEarned !== null && pointsEarned > 0 && (
              <p className="text-center text-sm text-green-400 mt-2">+{pointsEarned} points attribues</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}