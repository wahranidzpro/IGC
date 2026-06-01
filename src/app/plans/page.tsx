'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SubscriptionPlan, SubscriptionType, SubscriptionDuration } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Plus, X, Package, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

const durationLabels: Record<string, string> = {
  '1_mois': '1 Mois',
  '2_mois': '2 Mois',
  '3_mois': '3 Mois',
  '6_mois': '6 Mois',
  '12_mois': '12 Mois',
};

const typeLabels: Record<string, string> = {
  subscription: 'Abonnement',
  free_session: 'Séance libre',
};

export default function PlansPage() {
  const { role } = useAuth();
  const isReadOnly = role === 'reception';
  const isAdmin = role === 'admin';
  const autoSave = useAutoSave<SubscriptionPlan>({
    entityName: 'subscriptionPlans',
    onCreate: isAdmin ? 'plan_create' : undefined,
    onUpdate: isAdmin ? 'plan_edit' : undefined,
    onDelete: isAdmin ? 'plan_delete' : undefined,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'subscription' as SubscriptionType,
    duration: '1_mois' as SubscriptionDuration | '',
    sessionsCount: 0, price: 0, description: '', programId: 0,
  });

  const plans = useLiveQuery(() => db.subscriptionPlans.toArray(), []);
  const programs = useLiveQuery(() => db.programs.toArray(), []);

  const getProgramName = (id?: number) => programs?.find(p => p.id === id)?.name || '';

  const resetForm = () => {
    setFormData({ name: '', type: 'subscription', duration: '1_mois', sessionsCount: 0, price: 0, description: '', programId: 0 });
    setEditPlan(null);
  };

  const openEdit = (p: SubscriptionPlan) => {
    setFormData({ name: p.name, type: p.type, duration: p.duration, sessionsCount: p.sessionsCount, price: p.price, description: p.description, programId: p.programId || 0 });
    setEditPlan(p);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    const data = { ...formData, programId: formData.programId || 0 };
    if (editPlan?.id) {
      await autoSave.update(editPlan.id, data);
    } else {
      await autoSave.save({ ...data, isActive: true });
    }
    resetForm();
    setShowAddModal(false);
  };

  const handleDelete = async (id: number) => {
    await autoSave.remove(id);
  };

  const toggleActive = async (plan: SubscriptionPlan) => {
    await autoSave.update(plan.id!, { isActive: !plan.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Plans d'abonnement</h2>
          <p className="text-gray-400 mt-1">{plans?.length || 0} offre(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
          <>
          <ImportExportButtons
            onExport={() => exportToXlsx(plans || [], 'plans-abonnement')}
            onImport={() => importFromXlsx<SubscriptionPlan>(async (items) => { await db.subscriptionPlans.bulkAdd(items); })}
          />
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Plan</button>
          </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans?.map(p => (
          <div key={p.id} className={`bg-gray-900 border rounded-xl p-5 ${p.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.type === 'subscription' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                    {typeLabels[p.type]}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {p.programId ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Programme</span>
                  <span className="text-gray-300">{getProgramName(p.programId)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-gray-500">Prix</span>
                <span className="text-green-400 font-medium">{p.price.toLocaleString()} DA</span>
              </div>
              {p.type === 'subscription' && p.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Durée</span>
                  <span className="text-gray-300">{durationLabels[p.duration] || p.duration}</span>
                </div>
              )}
              {p.type === 'free_session' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Séances</span>
                  <span className="text-gray-300">{p.sessionsCount}</span>
                </div>
              )}
              {p.description && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="text-gray-400 text-right max-w-[60%] truncate">{p.description}</span>
                </div>
              )}
            </div>
            {!isReadOnly && (
            <div className="flex gap-1 mt-4">
              <button onClick={() => p.id && handleDelete(p.id)} className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Supprimer</button>
              <button onClick={() => openEdit(p)} className="flex-1 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Modifier
              </button>
              <button onClick={() => toggleActive(p)} className={`p-2 rounded-lg ${p.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}>
                {p.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
            )}
          </div>
        ))}
        {plans?.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">Aucun plan d'abonnement</div>}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => { resetForm(); setShowAddModal(false); }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editPlan ? 'Modifier' : 'Nouveau'} Plan</h3>
              <button onClick={() => { resetForm(); setShowAddModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="Ex: Basic, Premium..." /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Programme</label><select value={formData.programId} onChange={e => setFormData({...formData, programId: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value={0}>Tous les programmes</option>{programs?.map(p => <option key={p.id} value={p.id!}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as SubscriptionType})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="subscription">Abonnement</option><option value="free_session">Séance libre</option></select></div>
              {formData.type === 'subscription' && (
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Durée</label><select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value as SubscriptionDuration})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="1_mois">1 Mois</option><option value="2_mois">2 Mois</option><option value="3_mois">3 Mois</option><option value="6_mois">6 Mois</option><option value="12_mois">12 Mois</option></select></div>
              )}
              {formData.type === 'free_session' && (
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Nombre de séances</label><input type="number" value={formData.sessionsCount || ''} onChange={e => setFormData({...formData, sessionsCount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Prix (DA)</label><input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" rows={3} placeholder="Optionnelle" /></div>
            </div>
            <button onClick={handleSave} disabled={!formData.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">{editPlan ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
