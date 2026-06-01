'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Program } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Plus, X, Dumbbell, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

export default function ProgramsPage() {
  const { role } = useAuth();
  const isReadOnly = role === 'reception';
  const isAdmin = role === 'admin';
  const autoSave = useAutoSave<Program>({
    entityName: 'programs',
    onCreate: isAdmin ? 'program_create' : undefined,
    onUpdate: isAdmin ? 'program_edit' : undefined,
    onDelete: isAdmin ? 'program_delete' : undefined,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProg, setEditProg] = useState<Program | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0 });

  const programs = useLiveQuery(() => db.programs.toArray(), []);

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0 });
    setEditProg(null);
  };

  const openEdit = (p: Program) => {
    setFormData({ name: p.name, description: p.description, price: p.price || 0 });
    setEditProg(p);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (editProg?.id) {
      await autoSave.update(editProg.id, { name: formData.name, description: formData.description, price: formData.price });
    } else {
      await autoSave.save({ name: formData.name, description: formData.description, price: formData.price, isActive: true });
    }
    resetForm();
    setShowAddModal(false);
  };

  const toggleActive = async (p: Program) => {
    await autoSave.update(p.id!, { isActive: !p.isActive });
  };

  const handleDelete = async (id: number) => {
    await autoSave.remove(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Programmes</h2>
          <p className="text-gray-400 mt-1">{programs?.length || 0} programme(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
          <>
          <ImportExportButtons
            onExport={() => exportToXlsx(programs || [], 'programmes')}
            onImport={() => importFromXlsx<Program>(async (items) => { await db.programs.bulkAdd(items); })}
          />
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Programme</button>
          </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs?.map(p => (
          <div key={p.id} className={`bg-gray-900 border rounded-xl p-5 ${p.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  {p.price > 0 && <p className="text-sm text-orange-400 font-bold mt-1">{p.price.toLocaleString()} DA/mois</p>}
                </div>
              </div>
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
        {programs?.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">Aucun programme</div>}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{editProg ? 'Modifier' : 'Nouveau'} Programme</h3>
              <button onClick={() => { resetForm(); setShowAddModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Prix par mois (DA)</label><input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
            </div>
            <button onClick={handleSave} disabled={!formData.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">{editProg ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
