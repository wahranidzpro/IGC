'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Program, SubscriptionPlan, SubscriptionType, SubscriptionDuration } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Plus, X, Dumbbell, ToggleLeft, ToggleRight, Trash2, Package, Edit } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

const durationLabels: Record<string, string> = {
  '1_mois': '1 Mois', '2_mois': '2 Mois', '3_mois': '3 Mois',
  '6_mois': '6 Mois', '12_mois': '12 Mois',
};

const typeLabels: Record<string, string> = {
  subscription: 'Abonnement', free_session: 'Séance libre',
};

export default function ProgramsPlansPage() {
  const { role } = useAuth();
  const isReadOnly = role === 'reception';
  const isAdmin = role === 'admin';
  const progAutoSave = useAutoSave<Program>({
    entityName: 'programs', onCreate: isAdmin ? 'program_create' : undefined,
    onUpdate: isAdmin ? 'program_edit' : undefined, onDelete: isAdmin ? 'program_delete' : undefined,
  });
  const planAutoSave = useAutoSave<SubscriptionPlan>({
    entityName: 'subscriptionPlans', onCreate: isAdmin ? 'plan_create' : undefined,
    onUpdate: isAdmin ? 'plan_edit' : undefined, onDelete: isAdmin ? 'plan_delete' : undefined,
  });

  const [showProgModal, setShowProgModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editProg, setEditProg] = useState<Program | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [progForm, setProgForm] = useState({ name: '', description: '', price: 0 });
  const [planForm, setPlanForm] = useState({ name: '', type: 'subscription' as SubscriptionType, duration: '1_mois' as SubscriptionDuration | '', sessionsCount: 0, price: 0, description: '', programId: 0 });

  const programs = useLiveQuery(() => db.programs.toArray(), []);
  const plans = useLiveQuery(() => db.subscriptionPlans.toArray(), []);

  const getProgramPlans = (programId?: number) => plans?.filter(p => p.programId === programId) || [];
  const getUnassignedPlans = () => plans?.filter(p => !p.programId || p.programId === 0) || [];

  const resetProgForm = () => { setProgForm({ name: '', description: '', price: 0 }); setEditProg(null); };
  const resetPlanForm = () => { setPlanForm({ name: '', type: 'subscription', duration: '1_mois', sessionsCount: 0, price: 0, description: '', programId: 0 }); setEditPlan(null); };

  const handleProgSave = async () => {
    if (!progForm.name) return;
    if (editProg?.id) {
      await progAutoSave.update(editProg.id, { name: progForm.name, description: progForm.description, price: progForm.price });
    } else {
      await progAutoSave.save({ name: progForm.name, description: progForm.description, price: progForm.price, isActive: true });
    }
    resetProgForm(); setShowProgModal(false);
  };

  const handlePlanSave = async () => {
    if (!planForm.name) return;
    const data = { ...planForm, programId: planForm.programId || 0 };
    if (editPlan?.id) {
      await planAutoSave.update(editPlan.id, data);
    } else {
      await planAutoSave.save({ ...data, isActive: true });
    }
    resetPlanForm(); setShowPlanModal(false);
  };

  const toggleProgActive = async (p: Program) => { await progAutoSave.update(p.id!, { isActive: !p.isActive }); };
  const togglePlanActive = async (p: SubscriptionPlan) => { await planAutoSave.update(p.id!, { isActive: !p.isActive }); };
  const deleteProg = async (id: number) => { await progAutoSave.remove(id); };
  const deletePlan = async (id: number) => { await planAutoSave.remove(id); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Programmes & Abonnements</h2>
          <p className="text-gray-400 mt-1">{programs?.length || 0} programme(s) · {plans?.length || 0} offre(s)</p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button onClick={() => { resetProgForm(); setShowProgModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Programme</button>
            <button onClick={() => { resetPlanForm(); setShowPlanModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700"><Plus className="w-5 h-5" /> Plan</button>
          </div>
        )}
      </div>

      {/* Programs with their plans */}
      {programs?.map(prog => (
        <div key={prog.id} className={`bg-gray-900 border rounded-xl p-5 ${prog.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{prog.name}</h3>
                {prog.description && <p className="text-xs text-gray-400 mt-0.5">{prog.description}</p>}
                {prog.price > 0 && <p className="text-sm text-orange-400 font-bold mt-1">{prog.price.toLocaleString()} DA/mois</p>}
              </div>
            </div>
            {!isReadOnly && (
              <div className="flex gap-1">
                <button onClick={() => prog.id && deleteProg(prog.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setProgForm({ name: prog.name, description: prog.description, price: prog.price || 0 }); setEditProg(prog); setShowProgModal(true); }} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit className="w-4 h-4" /></button>
                <button onClick={() => toggleProgActive(prog)} className={`p-2 rounded-lg ${prog.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}>{prog.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}</button>
              </div>
            )}
          </div>

          {/* Plans under this program */}
          {getProgramPlans(prog.id).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Plans d&apos;abonnement</p>
              {getProgramPlans(prog.id).map(plan => (
                <div key={plan.id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${plan.isActive ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-800/20 border border-gray-700/20 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-sm font-medium text-white">{plan.name}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium ${plan.type === 'subscription' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{typeLabels[plan.type]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-400 font-semibold">{plan.price.toLocaleString()} DA</span>
                    {plan.type === 'subscription' && plan.duration && <span className="text-xs text-gray-400">{durationLabels[plan.duration]}</span>}
                    {plan.type === 'free_session' && <span className="text-xs text-gray-400">{plan.sessionsCount} séances</span>}
                    {!isReadOnly && (
                      <div className="flex gap-1">
                        <button onClick={() => plan.id && deletePlan(plan.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setPlanForm({ name: plan.name, type: plan.type, duration: plan.duration, sessionsCount: plan.sessionsCount, price: plan.price, description: plan.description, programId: plan.programId || 0 }); setEditPlan(plan); setShowPlanModal(true); }} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => togglePlanActive(plan)} className={`p-1.5 rounded-lg ${plan.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}>{plan.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {getProgramPlans(prog.id).length === 0 && (
            <p className="text-xs text-gray-500 italic">Aucun plan rattaché à ce programme</p>
          )}
        </div>
      ))}

      {/* Unassigned plans */}
      {getUnassignedPlans().length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Plans sans programme</h3>
          <div className="space-y-2">
            {getUnassignedPlans().map(plan => (
              <div key={plan.id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${plan.isActive ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-800/20 border border-gray-700/20 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">{plan.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${plan.type === 'subscription' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{typeLabels[plan.type]}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-green-400 font-semibold">{plan.price.toLocaleString()} DA</span>
                  {!isReadOnly && (
                    <div className="flex gap-1">
                      <button onClick={() => plan.id && deletePlan(plan.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setPlanForm({ name: plan.name, type: plan.type, duration: plan.duration, sessionsCount: plan.sessionsCount, price: plan.price, description: plan.description, programId: plan.programId || 0 }); setEditPlan(plan); setShowPlanModal(true); }} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => togglePlanActive(plan)} className={`p-1.5 rounded-lg ${plan.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}>{plan.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {programs?.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun programme</p>
          <p className="text-sm mt-1">Créez votre premier programme pour commencer</p>
        </div>
      )}

      {/* Program Modal */}
      {showProgModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editProg ? 'Modifier' : 'Nouveau'} Programme</h3>
              <button onClick={() => { resetProgForm(); setShowProgModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom</label><input type="text" value={progForm.name} onChange={e => setProgForm({...progForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><textarea value={progForm.description} onChange={e => setProgForm({...progForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Prix par mois (DA)</label><input type="number" value={progForm.price || ''} onChange={e => setProgForm({...progForm, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
            </div>
            <button onClick={handleProgSave} disabled={!progForm.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">{editProg ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => { resetPlanForm(); setShowPlanModal(false); }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editPlan ? 'Modifier' : 'Nouveau'} Plan</h3>
              <button onClick={() => { resetPlanForm(); setShowPlanModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom</label><input type="text" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="Ex: Basic, Premium..." /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Programme</label><select value={planForm.programId} onChange={e => setPlanForm({...planForm, programId: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value={0}>Tous les programmes</option>{programs?.map(p => <option key={p.id} value={p.id!}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Type</label><select value={planForm.type} onChange={e => setPlanForm({...planForm, type: e.target.value as SubscriptionType})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="subscription">Abonnement</option><option value="free_session">Séance libre</option></select></div>
              {planForm.type === 'subscription' && (
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Durée</label><select value={planForm.duration} onChange={e => setPlanForm({...planForm, duration: e.target.value as SubscriptionDuration})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"><option value="1_mois">1 Mois</option><option value="2_mois">2 Mois</option><option value="3_mois">3 Mois</option><option value="6_mois">6 Mois</option><option value="12_mois">12 Mois</option></select></div>
              )}
              {planForm.type === 'free_session' && (
                <div><label className="block text-sm font-medium text-gray-400 mb-2">Séances</label><input type="number" value={planForm.sessionsCount || ''} onChange={e => setPlanForm({...planForm, sessionsCount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Prix (DA)</label><input type="number" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><textarea value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" rows={3} placeholder="Optionnelle" /></div>
            </div>
            <button onClick={handlePlanSave} disabled={!planForm.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">{editPlan ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
