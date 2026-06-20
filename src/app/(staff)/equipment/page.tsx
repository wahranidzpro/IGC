'use client';

import { useState } from 'react';
import { Box, Plus, Search, Edit, AlertTriangle, Save, X, Wrench, DollarSign } from 'lucide-react';

interface Equipment {
  id: number;
  name: string;
  brand: string;
  category: string;
  location: string;
  status: 'en_service' | 'maintenance' | 'hors_service' | 'retire' | 'en_commande' | 'garantie' | 'prete';
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  notes: string;
}

const EQUIPMENT_CATEGORIES = [
  'Musculation', 'Cardio', 'CrossFit', 'Accessoire',
  'Etirement', 'Boxe', 'Functional Training', 'Recovery',
  'Audiovisuel', 'Bureautique', 'Mobilier', 'Climatisation',
  'Plomberie', 'Electricite', 'Securite', 'Autre'
];

const EQUIPMENT_STATUSES: { value: Equipment['status']; label: string; color: string }[] = [
  { value: 'en_service', label: 'En service', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'maintenance', label: 'En maintenance', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'hors_service', label: 'Hors service', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'retire', label: 'Retire', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'en_commande', label: 'En commande', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'garantie', label: 'Sous garantie', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'prete', label: 'Prête', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

const INITIAL_EQUIPMENTS: Equipment[] = [
  { id: 1, name: 'Tapis de yoga (lot 20)', brand: 'Manduka', category: 'Accessoire', location: 'Salle B', status: 'en_service', quantity: 20, unitPrice: 2500, purchaseDate: '2024-01-15', lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', notes: 'Lot complet' },
  { id: 2, name: 'Machine tirage horizontal', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 85000, purchaseDate: '2024-02-20', lastMaintenance: '2026-03-15', nextMaintenance: '2026-06-15', notes: '' },
  { id: 3, name: 'Machine tirage vertical', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 80000, purchaseDate: '2024-02-20', lastMaintenance: '2026-03-15', nextMaintenance: '2026-06-15', notes: '' },
  { id: 4, name: 'Presse à cuisses', brand: 'Hammer Strength', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 95000, purchaseDate: '2024-01-10', lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', notes: '' },
  { id: 5, name: 'Leg curl', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 75000, purchaseDate: '2024-02-15', lastMaintenance: '2026-03-20', nextMaintenance: '2026-06-20', notes: '' },
  { id: 6, name: 'Leg extension', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 72000, purchaseDate: '2024-02-15', lastMaintenance: '2026-03-20', nextMaintenance: '2026-06-20', notes: '' },
  { id: 7, name: 'Smith machine', brand: 'Hoist', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 120000, purchaseDate: '2024-01-05', lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', notes: '' },
  { id: 8, name: 'Set haltères 1-30kg', brand: 'Eleiko', category: 'Musculation', location: 'Zone Haltères', status: 'en_service', quantity: 1, unitPrice: 150000, purchaseDate: '2024-01-10', lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', notes: 'Série complète' },
  { id: 9, name: 'Barres olympiques x4', brand: 'Eleiko', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 4, unitPrice: 15000, purchaseDate: '2024-01-10', lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', notes: '' },
  { id: 10, name: 'Kettlebells 8-32kg', brand: 'Rogue', category: 'CrossFit', location: 'Zone CrossFit', status: 'en_service', quantity: 1, unitPrice: 35000, purchaseDate: '2024-02-15', lastMaintenance: '2026-04-01', nextMaintenance: '2026-07-01', notes: 'Série 8-32kg' },
  { id: 11, name: 'Box pliométriques', brand: 'Generic', category: 'CrossFit', location: 'Zone CrossFit', status: 'en_service', quantity: 6, unitPrice: 8000, purchaseDate: '2024-03-01', lastMaintenance: '2026-05-10', nextMaintenance: '2026-08-10', notes: '' },
  { id: 12, name: 'Sac de frappe', brand: 'Everlast', category: 'Cardio', location: 'Salle C', status: 'en_service', quantity: 2, unitPrice: 25000, purchaseDate: '2024-02-20', lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', notes: '' },
  { id: 13, name: 'Power rack', brand: 'Rogue', category: 'Musculation', location: 'Salle Muscu', status: 'maintenance', quantity: 2, unitPrice: 85000, purchaseDate: '2024-01-05', lastMaintenance: '2026-05-01', nextMaintenance: '2026-05-20', notes: 'En maintenance' },
  { id: 14, name: 'Vélo droit', brand: 'Life Fitness', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 3, unitPrice: 45000, purchaseDate: '2024-02-01', lastMaintenance: '2026-03-20', nextMaintenance: '2026-06-20', notes: '' },
  { id: 15, name: 'Tapis de course Technogym 1', brand: 'Technogym', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 1, unitPrice: 65000, purchaseDate: '2024-01-20', lastMaintenance: '2026-04-20', nextMaintenance: '2026-07-20', notes: '' },
  { id: 16, name: 'Tapis de course Technogym 2', brand: 'Technogym', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 1, unitPrice: 65000, purchaseDate: '2024-01-20', lastMaintenance: '2026-04-20', nextMaintenance: '2026-07-20', notes: '' },
  { id: 17, name: 'Tapis de course Life Fitness', brand: 'Life Fitness', category: 'Cardio', location: 'Zone Cardio', status: 'hors_service', quantity: 1, unitPrice: 55000, purchaseDate: '2023-06-15', lastMaintenance: '2026-02-28', nextMaintenance: '2026-05-28', notes: 'Hors service' },
  { id: 18, name: 'Vélo elliptique 1', brand: 'Precor', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 1, unitPrice: 80000, purchaseDate: '2024-02-10', lastMaintenance: '2026-03-25', nextMaintenance: '2026-06-25', notes: '' },
  { id: 19, name: 'Vélo elliptique 2', brand: 'Precor', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 1, unitPrice: 80000, purchaseDate: '2024-02-10', lastMaintenance: '2026-03-25', nextMaintenance: '2026-06-25', notes: '' },
  { id: 20, name: 'Vélo spinning Schwinn 1', brand: 'Schwinn', category: 'Cardio', location: 'Salle Spinning', status: 'en_service', quantity: 1, unitPrice: 35000, purchaseDate: '2024-03-05', lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', notes: '' },
  { id: 21, name: 'Vélo spinning Schwinn 2', brand: 'Schwinn', category: 'Cardio', location: 'Salle Spinning', status: 'en_service', quantity: 1, unitPrice: 35000, purchaseDate: '2024-03-05', lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', notes: '' },
  { id: 22, name: 'Rameur Concept2', brand: 'Concept2', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 2, unitPrice: 55000, purchaseDate: '2024-01-25', lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', notes: '' },
  { id: 23, name: 'Banc développé couché', brand: 'Hammer Strength', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 2, unitPrice: 45000, purchaseDate: '2024-01-08', lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', notes: '' },
  { id: 24, name: 'Banc développé incliné', brand: 'Hammer Strength', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, unitPrice: 48000, purchaseDate: '2024-01-08', lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', notes: '' },
  { id: 25, name: 'Squat rack', brand: 'Rogue', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 3, unitPrice: 55000, purchaseDate: '2024-01-05', lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', notes: '' },
];

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState(INITIAL_EQUIPMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Equipment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState<Omit<Equipment, 'id'>>({
    name: '', brand: '', category: 'Musculation', location: '',
    status: 'en_service', quantity: 1, unitPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    lastMaintenance: '', nextMaintenance: '', notes: '',
  });

  const filtered = equipments.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = equipments.reduce((sum, e) => sum + (e.quantity * e.unitPrice), 0);
  const needsAttention = equipments.filter(e => e.status === 'hors_service' || e.status === 'retire').length;
  const enMaintenance = equipments.filter(e => e.status === 'maintenance').length;

  const getStatusColor = (status: string) => {
    return EQUIPMENT_STATUSES.find(s => s.value === status)?.color || 'bg-gray-500/20 text-gray-400';
  };

  const startEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setEditData({ ...eq });
  };

  const saveEdit = () => {
    if (editData) {
      setEquipments(equipments.map(e => e.id === editData.id ? editData : e));
      setEditingId(null);
      setEditData(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    setEquipments(equipments.map(e => e.id === id ? { ...e, status: newStatus as Equipment['status'] } : e));
  };

  const addEquipment = () => {
    if (!newEquipment.name || !newEquipment.brand) return;
    const newId = Math.max(...equipments.map(e => e.id), 0) + 1;
    setEquipments([...equipments, { ...newEquipment, id: newId }]);
    setShowAddModal(false);
    setNewEquipment({
      name: '', brand: '', category: 'Musculation', location: '',
      status: 'en_service', quantity: 1, unitPrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      lastMaintenance: '', nextMaintenance: '', notes: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">EQUIPEMENTS</h2>
          <p className="text-gray-400 mt-1">Suivi du materiel et maintenance</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700">
          <Plus className="w-5 h-5" />
          Nouvel Equipement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Équipements</span>
          </div>
          <p className="text-3xl font-bold text-white">{equipments.length}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Valeur Totale</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalValue.toLocaleString()} DA</p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">En Maintenance</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{enMaintenance}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400 text-sm">Hors Service</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{needsAttention}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-12 pl-12 pr-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-12 px-4 bg-black/30 border border-white/10 rounded-xl text-white"
        >
          <option value="all">Toutes categories</option>
          {EQUIPMENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-12 px-4 bg-black/30 border border-white/10 rounded-xl text-white"
        >
          <option value="all">Tous statuts</option>
          <option value="en_service">En service</option>
          <option value="maintenance">Maintenance</option>
          <option value="hors_service">Hors service</option>
          <option value="retire">Retiré</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Équipement</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Catégorie</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Emplacement</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Statut</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Qté</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Prix Unit.</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Total</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="case-normal">
              {filtered.map(eq => (
                <tr key={eq.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Box className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-medium text-white block">{eq.name}</span>
                        <span className="text-gray-500 text-xs">{eq.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{eq.category}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{eq.location}</td>
                  <td className="px-4 py-3">
                    <select
                      value={eq.status}
                      onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(eq.status)} bg-transparent`}
                    >
                      {EQUIPMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === eq.id ? (
                      <input
                        type="number"
                        value={editData?.quantity || 0}
                        onChange={(e) => setEditData({...editData!, quantity: Number(e.target.value)})}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center"
                        min="0"
                      />
                    ) : (
                      <span className="text-white font-medium">{eq.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === eq.id ? (
                      <input
                        type="number"
                        value={editData?.unitPrice || 0}
                        onChange={(e) => setEditData({...editData!, unitPrice: Number(e.target.value)})}
                        className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-right"
                        min="0"
                      />
                    ) : (
                      <span className="text-white">{eq.unitPrice.toLocaleString()} DA</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-orange-400 font-bold">{(eq.quantity * eq.unitPrice).toLocaleString()} DA</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === eq.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"><Save className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(eq)} className="p-2 text-gray-400 hover:text-orange-400"><Edit className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-2xl p-6 w-full max-w-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nouvel Equipement</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Nom de l&apos;equipement *</label>
                  <input type="text" value={newEquipment.name} onChange={e => setNewEquipment({...newEquipment, name: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} placeholder="Ex: Tapis de course" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Marque *</label>
                  <input type="text" value={newEquipment.brand} onChange={e => setNewEquipment({...newEquipment, brand: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} placeholder="Ex: Technogym" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Categorie</label>
                  <select value={newEquipment.category} onChange={e => setNewEquipment({...newEquipment, category: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}>
                    {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Emplacement</label>
                  <input type="text" value={newEquipment.location} onChange={e => setNewEquipment({...newEquipment, location: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} placeholder="Ex: Salle Muscu" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Quantite</label>
                  <input type="number" value={newEquipment.quantity} onChange={e => setNewEquipment({...newEquipment, quantity: Number(e.target.value)})} min="1" className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prix unitaire (DA)</label>
                  <input type="number" value={newEquipment.unitPrice || ''} onChange={e => setNewEquipment({...newEquipment, unitPrice: Number(e.target.value)})} min="0" className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Statut</label>
                  <select value={newEquipment.status} onChange={e => setNewEquipment({...newEquipment, status: e.target.value as Equipment['status']})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}>
                    {EQUIPMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Date d&apos;achat</label>
                  <input type="date" value={newEquipment.purchaseDate} onChange={e => setNewEquipment({...newEquipment, purchaseDate: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Derniere maintenance</label>
                  <input type="date" value={newEquipment.lastMaintenance} onChange={e => setNewEquipment({...newEquipment, lastMaintenance: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Prochaine maintenance</label>
                  <input type="date" value={newEquipment.nextMaintenance} onChange={e => setNewEquipment({...newEquipment, nextMaintenance: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Notes</label>
                <textarea value={newEquipment.notes} onChange={e => setNewEquipment({...newEquipment, notes: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 resize-none" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} placeholder="Observations, garanties..." />
              </div>
            </div>
            <button onClick={addEquipment} disabled={!newEquipment.name || !newEquipment.brand} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">
              Ajouter l&apos;equipement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}