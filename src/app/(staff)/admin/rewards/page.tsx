'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Reward } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { Gift, Plus, X, Edit, Trash2, Save, Image, Package, Star } from 'lucide-react';

export default function RewardsAdminPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);
  const [form, setForm] = useState({ name: '', description: '', pointsRequired: 100, stock: 0, image: '' });

  const rewards = useLiveQuery(() => db.rewards.toArray(), []);

  if (role !== 'admin') { router.push('/'); return null; }

  const resetForm = () => {
    setForm({ name: '', description: '', pointsRequired: 100, stock: 0, image: '' });
    setEditReward(null);
  };

  const handleSave = async () => {
    if (!form.name || form.pointsRequired <= 0) return;
    if (editReward?.id) {
      await db.rewards.update(editReward.id, { ...form });
    } else {
      await db.rewards.add({ ...form, createdAt: new Date(), syncStatus: 'pending' });
    }
    resetForm();
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette récompense ?')) {
      await db.rewards.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift className="w-7 h-7 text-orange-400" />
            CATALOGUE RÉCOMPENSES
          </h2>
          <p className="text-gray-400 mt-1">Gérez les récompenses échangeables contre des points fidélité</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700">
          <Plus className="w-5 h-5" /> Nouvelle Récompense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards?.map(r => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                {r.image ? <img src={r.image} alt={r.name} className="w-10 h-10 object-contain" /> : <Gift className="w-7 h-7 text-orange-400" />}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ name: r.name, description: r.description, pointsRequired: r.pointsRequired, stock: r.stock, image: r.image }); setEditReward(r); setShowModal(true); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => r.id && handleDelete(r.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="font-semibold text-white text-base">{r.name}</h3>
            {r.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.description}</p>}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{r.pointsRequired.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-gray-500" />
                <span className={`text-sm font-medium ${r.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{r.stock > 0 ? `${r.stock} en stock` : 'Épuisé'}</span>
              </div>
            </div>
          </div>
        ))}
        {(!rewards || rewards.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucune récompense</p>
            <p className="text-sm mt-1">Créez votre première récompense</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editReward ? 'Modifier' : 'Nouvelle'} Récompense</h3>
              <button onClick={() => { resetForm(); setShowModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Points requis</label><input type="number" value={form.pointsRequired} onChange={e => setForm({...form, pointsRequired: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Stock</label><input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Image (URL)</label><input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="Optionnelle" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
            </div>
            <button onClick={handleSave} disabled={!form.name || form.pointsRequired <= 0} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">
              <Save className="w-4 h-4 inline mr-2" /> {editReward ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
