'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Expense } from '@/lib/db/dexie-db';
import { Plus, X, Trash2, Edit } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

const categories = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Équipement', 'Entretien', 'Marketing', 'Assurance', 'Taxes', 'Autre'];

export default function ExpensesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [formData, setFormData] = useState({ category: 'Loyer', amount: 0, description: '' });

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []);

  const filtered = expenses?.filter(e => filterCat === 'all' || e.category === filterCat);
  const totalAmount = filtered?.reduce((s, e) => s + e.amount, 0) || 0;

  const handleSave = async () => {
    if (!formData.amount || !formData.category) return;
    await db.expenses.add({ ...formData, date: new Date(), createdAt: new Date() });
    setFormData({ category: 'Loyer', amount: 0, description: '' });
    setShowAddModal(false);
  };

  const handleDelete = async (id: number) => {
    await db.expenses.delete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Dépenses</h2><p className="text-red-400 mt-1">Total: {totalAmount.toLocaleString()} DA · {expenses?.length || 0} entrées</p></div>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            onExport={() => exportToXlsx(expenses || [], 'depenses')}
            onImport={() => importFromXlsx<Expense>(async (items) => { await db.expenses.bulkAdd(items); })}
          />
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouvelle Dépense</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCat === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Toutes</button>
        {categories.map(c => <button key={c} onClick={() => setFilterCat(c)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCat === c ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{c}</button>)}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800"><th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Catégorie</th><th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Description</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Montant</th><th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Date</th><th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Actions</th></tr></thead>
          <tbody>
            {filtered?.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucune dépense</td></tr> : (
              filtered?.map(e => (
                <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">{e.category}</span></td>
                  <td className="px-6 py-4 text-gray-300">{e.description || '-'}</td>
                  <td className="px-6 py-4 text-right text-red-400 font-medium">{e.amount.toLocaleString()} DA</td>
                  <td className="px-6 py-4 text-right text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => e.id && handleDelete(e.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-white">Nouvelle Dépense</h3><button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Catégorie</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Montant (DA)</label><input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
            </div>
            <button onClick={handleSave} disabled={!formData.amount} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}