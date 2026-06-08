'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Coach as CoachType, Coach, DAYS, Member, Program } from '@/lib/db/dexie-db';
import { Plus, X, User, Phone, Calendar, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

const HOURS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','00:00'];

export default function CoachesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCoach, setEditCoach] = useState<CoachType | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', programIds: [] as number[] });
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string; active: boolean }>>({});
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [selectedCoachMembers, setSelectedCoachMembers] = useState<Member[]>([]);

  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const members = useLiveQuery(() => db.members.toArray(), []);
  const programs = useLiveQuery(() => db.programs.toArray(), []);

  const resetForm = () => {
    setFormData({ name: '', phone: '', programIds: [] });
    setAvailability({});
    setEditCoach(null);
  };

     const openEdit = (c: CoachType) => {
     setFormData({ name: c.name, phone: c.phone, programIds: c.programIds || [] });
     const av: Record<string, { start: string; end: string; active: boolean }> = {};
     DAYS.forEach(d => {
     const existing = c.availability?.find(a => a.day === d);
     av[d] = existing ? { start: existing.start, end: existing.end, active: true } : { start: '06:00', end: '00:00', active: false };
     });
     setAvailability(av);
     setEditCoach(c);
     setShowAddModal(true);
     };

    const handleSave = async () => {
      if (!formData.name) return;
      const availArray = Object.entries(availability)
        .filter(([_, v]) => v.active)
        .map(([day, v]) => ({ day, start: v.start, end: v.end }));
      const now = new Date();
      const data = {
        name: formData.name,
        phone: formData.phone,
        availability: availArray,
        programIds: formData.programIds,
        isActive: editCoach?.isActive ?? true,
        createdAt: editCoach?.createdAt || now,
        syncStatus: 'pending' as const,
        updatedAt: now,
      };
      if (editCoach?.id) {
        await db.coaches.update(editCoach.id, data);
      } else {
        await db.coaches.add(data);
      }
     resetForm();
     setShowAddModal(false);
   };

  const handleDelete = async (id: number) => {
    await db.coaches.delete(id);
  };

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...(prev[day] || { start: '08:00', end: '20:00' }), active: !(prev[day]?.active || false) }
    }));
  };

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...(prev[day] || { start: '08:00', end: '20:00', active: true }), [field]: value }
    }));
  };

  const initDay = (day: string) => {
    if (!availability[day]) {
      setAvailability(prev => ({ ...prev, [day]: { start: '08:00', end: '20:00', active: false } }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Coachs</h2><p className="text-gray-400 mt-1">Gestion des coachs et planning</p></div>
        <div className="flex items-center gap-2">
          <ImportExportButtons
            onExport={() => { const data = coaches?.map(({ id, ...rest }) => rest) || []; exportToXlsx(data, 'coachs'); }}
            onImport={() => importFromXlsx<Coach>(async (items) => { await db.coaches.bulkAdd(items); })}
          />
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"><Plus className="w-5 h-5" /> Nouveau Coach</button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {coaches?.map(c => {
             const memberCount = members?.filter(m => m.coachId === c.id).length || 0;
             const availStr = c.availability?.map(a => `${a.day} ${a.start}-${a.end}`).join(', ') || 'Non défini';
               return (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                 <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => {
                   if (c.id !== undefined) {
                     setSelectedCoachId(c.id);
                     // Fetch members for this coach
                     if (members) {
                       const coachMembers = members.filter(m => m.coachId === c.id);
                       setSelectedCoachMembers(coachMembers);
                     }
                   }
                 }}>
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="w-6 h-6 text-blue-400" /></div>
                    <div><h3 className="font-semibold text-white">{c.name}</h3><p className="text-xs text-gray-400">{selectedCoachId === c.id ? '▲' : '▼'}</p></div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                     {c.programIds && c.programIds.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                         {c.programIds.map(programId => {
                           const program = programs?.find(p => p.id === programId);
                           return program ? (
                             <span key={programId} className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">
                               <Dumbbell className="w-3 h-3" /> {program.name}
                             </span>
                           ) : null;
                         })}
                       </div>
                     )}
                     <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {formatPhoneDisplay(c.phone)}</p>
                     <p className="flex items-center gap-2"><User className="w-4 h-4" /> {memberCount} adhérents</p>
                     <div className="flex items-start gap-2"><Calendar className="w-4 h-4 mt-0.5" /><span className="text-xs">{availStr}</span></div>
                   </div>
                   <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                     <button onClick={() => openEdit(c)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm">Modifier</button>
                     <button onClick={() => c.id && handleDelete(c.id)} className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm">X</button>
                   </div>
                 </div>
               );
            })}
            {coaches?.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">Aucun coach</div>}
          </div>

       {/* Selected coach members list */}
        {selectedCoachId && selectedCoachMembers.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" /> Membres du coach sélectionné
              </h3>
              <button onClick={() => { setSelectedCoachId(null); setSelectedCoachMembers([]); }} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm">
                <X className="w-4 h-4" /> Fermer
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Nom</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Téléphone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date naissance</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Programme</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Sessions restantes</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {selectedCoachMembers.map(m => (
                    <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">{m.firstName} {m.lastName}</td>
                      <td className="px-4 py-3 text-gray-200">{formatPhoneDisplay(m.phone)}</td>
                      <td className="px-4 py-3 text-gray-200">{m.birthDate}</td>
                      <td className="px-4 py-3 text-gray-200">
                        {m.programId && programs?.find(p => p.id === m.programId)?.name || 'Aucun'}
                      </td>
                      <td className="px-4 py-3 text-gray-200">{m.sessionsLeft}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          m.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          m.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {m.status === 'active' ? 'Actif' : m.status === 'inactive' ? 'Inactif' : 'Expiré'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

       {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold text-white">{editCoach ? 'Modifier' : 'Nouveau'} Coach</h3><button onClick={() => { resetForm(); setShowAddModal(false); }} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Nom complet</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">Téléphone</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" /></div>
              
               <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Programmes</label>
                 <div className="space-y-1">
                   {programs?.map(p => (
                     <label key={p.id} className="flex items-center gap-2 text-sm">
                       <input
                         type="checkbox"
                         checked={formData.programIds.includes(p.id!)}
                         onChange={e => {
                           if (e.target.checked) {
                             setFormData({ ...formData, programIds: [...formData.programIds, p.id!] });
                           } else {
                             setFormData({ ...formData, programIds: formData.programIds.filter(id => id !== p.id!) });
                           }
                         }}
                         className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                       />
                       <span className="text-white">{p.name}</span>
                     </label>
                   ))}
                 </div>
               </div>

              <div className="border-t border-gray-800 pt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Disponibilités hebdomadaires</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {DAYS.map(day => {
                    initDay(day);
                    const d = availability[day] || { start: '08:00', end: '20:00', active: false };
                    return (
                      <div key={day} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                        <button
                          onClick={() => toggleDay(day)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${d.active ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}
                        >
                          {d.active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className="text-sm text-gray-300 w-20">{day}</span>
                        {d.active && (
                          <>
                            <select value={d.start} onChange={e => updateTime(day, 'start', e.target.value)} className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600 focus:outline-none focus:border-orange-500">
                              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-gray-500">à</span>
                            <select value={d.end} onChange={e => updateTime(day, 'end', e.target.value)} className="px-2 py-1 bg-gray-700 text-white text-xs rounded border border-gray-600 focus:outline-none focus:border-orange-500">
                              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700">{editCoach ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </div>
      )}
    </div>
  );
}