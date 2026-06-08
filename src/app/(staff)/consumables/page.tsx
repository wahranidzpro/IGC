'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { Sparkles, Droplets, Package, Wrench, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3, PieChart, Plus, X, Edit, Save, Box, Monitor, ClipboardList, Printer, Tag, Trash2 } from 'lucide-react';

interface PurchaseRecord {
  id: number;
  date: string;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplier: string;
}

interface MonthlyExpense {
  month: string;
  cleaning: number;
  hygiene: number;
  maintenance: number;
  electricity: number;
  other: number;
  total: number;
}

// Generate sample data
const purchaseHistory: PurchaseRecord[] = [
  { id: 1, date: '2026-05-15', product: 'Gel douche 500ml', category: 'Nettoyage', quantity: 10, unitPrice: 150, total: 1500, supplier: 'Grossiste' },
  { id: 2, date: '2026-05-12', product: 'Spray désinfectant', category: 'Désinfection', quantity: 6, unitPrice: 160, total: 960, supplier: 'Pharma' },
  { id: 3, date: '2026-05-10', product: 'Détergent lantai', category: 'Nettoyage', quantity: 15, unitPrice: 100, total: 1500, supplier: 'Hammache' },
  { id: 4, date: '2026-05-08', product: 'Papier toilette (paquet 12)', category: 'Hygiène', quantity: 8, unitPrice: 250, total: 2000, supplier: 'Hammache' },
  { id: 5, date: '2026-05-05', product: 'Désodorisant spray', category: 'Désodorisation', quantity: 12, unitPrice: 120, total: 1440, supplier: 'Grossiste' },
  { id: 6, date: '2026-04-28', product: 'Eau de Javel', category: 'Nettoyage', quantity: 20, unitPrice: 60, total: 1200, supplier: 'Hammache' },
  { id: 7, date: '2026-04-25', product: 'Gants latex (boîte 100)', category: 'Hygiène', quantity: 10, unitPrice: 300, total: 3000, supplier: 'Pharma' },
  { id: 8, date: '2026-04-20', product: 'Nettoyant vitres', category: 'Nettoyage', quantity: 8, unitPrice: 90, total: 720, supplier: 'Grossiste' },
  { id: 9, date: '2026-04-18', product: 'Sac poubelle noir (30)', category: 'Hygiène', quantity: 10, unitPrice: 160, total: 1600, supplier: 'Hammache' },
  { id: 10, date: '2026-04-15', product: 'Serpillière microfibre', category: 'Accessoires', quantity: 5, unitPrice: 160, total: 800, supplier: 'Hammache' },
  { id: 11, date: '2026-04-10', product: 'Graisse WD-40', category: 'Entretien', quantity: 3, unitPrice: 300, total: 900, supplier: 'Brico' },
  { id: 12, date: '2026-04-05', product: 'Shampooing nettoyant', category: 'Nettoyage', quantity: 5, unitPrice: 200, total: 1000, supplier: 'Grossiste' },
  { id: 13, date: '2026-03-28', product: 'Ampoules LED', category: 'Électricité', quantity: 15, unitPrice: 100, total: 1500, supplier: 'Brico' },
  { id: 14, date: '2026-03-25', product: 'Bougie parfumée', category: 'Désodorisation', quantity: 5, unitPrice: 200, total: 1000, supplier: 'Grossiste' },
  { id: 15, date: '2026-03-20', product: 'Nettoyant équipements', category: 'Nettoyage', quantity: 4, unitPrice: 250, total: 1000, supplier: 'SportTech' },
];

const monthlyExpenses: MonthlyExpense[] = [
  { month: 'Janvier', cleaning: 4200, hygiene: 2800, maintenance: 1500, electricity: 800, other: 500, total: 9800 },
  { month: 'Février', cleaning: 3800, hygiene: 3200, maintenance: 2000, electricity: 900, other: 400, total: 10300 },
  { month: 'Mars', cleaning: 5500, hygiene: 4500, maintenance: 1800, electricity: 1200, other: 600, total: 13600 },
  { month: 'Avril', cleaning: 6200, hygiene: 4800, maintenance: 2500, electricity: 1100, other: 800, total: 15400 },
  { month: 'Mai', cleaning: 5400, hygiene: 3600, maintenance: 900, electricity: 1000, other: 500, total: 11400 },
];

// Equipment data
const INITIAL_EQUIPMENT = [
  { id: 1, name: 'Machine tirage horizontal', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, value: 85000 },
  { id: 2, name: 'Machine tirage vertical', brand: 'Cybex', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, value: 80000 },
  { id: 3, name: 'Presse à cuisses', brand: 'Hammer Strength', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, value: 95000 },
  { id: 4, name: 'Smith machine', brand: 'Hoist', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 1, value: 120000 },
  { id: 5, name: 'Set haltères 1-30kg', brand: 'Eleiko', category: 'Musculation', location: 'Zone Haltères', status: 'en_service', quantity: 1, value: 150000 },
  { id: 6, name: 'Barres olympiques x4', brand: 'Eleiko', category: 'Musculation', location: 'Salle Muscu', status: 'en_service', quantity: 4, value: 60000 },
  { id: 7, name: 'Kettlebells 8-32kg', brand: 'Rogue', category: 'CrossFit', location: 'Zone CrossFit', status: 'en_service', quantity: 1, value: 35000 },
  { id: 8, name: 'Tapis de course Technogym', brand: 'Technogym', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 2, value: 130000 },
  { id: 9, name: 'Vélo elliptique', brand: 'Precor', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 2, value: 160000 },
  { id: 10, name: 'Power rack', brand: 'Rogue', category: 'Musculation', location: 'Salle Muscu', status: 'maintenance', quantity: 2, value: 170000 },
  { id: 11, name: 'Sac de frappe', brand: 'Everlast', category: 'Cardio', location: 'Salle C', status: 'en_service', quantity: 2, value: 50000 },
  { id: 12, name: 'Vélo droit', brand: 'Life Fitness', category: 'Cardio', location: 'Zone Cardio', status: 'en_service', quantity: 3, value: 135000 },
];

interface OfficeSupply {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
}

const INITIAL_OFFICE: OfficeSupply[] = [
  { id: 1, name: 'Ramette papier A4 (x5)', category: 'Papeterie', quantity: 20, unitPrice: 500, supplier: 'BureauPlus' },
  { id: 2, name: 'Cartouches encre HP', category: 'Encre', quantity: 6, unitPrice: 1200, supplier: 'BureauPlus' },
  { id: 3, name: 'Classeurs dossiers', category: 'Papeterie', quantity: 30, unitPrice: 150, supplier: 'BureauPlus' },
  { id: 4, name: 'Stylos (boîte 50)', category: 'Papeterie', quantity: 10, unitPrice: 200, supplier: 'BureauPlus' },
  { id: 5, name: 'Post-it (paquet 10)', category: 'Papeterie', quantity: 8, unitPrice: 180, supplier: 'FournOffice' },
  { id: 6, name: 'Agendas 2026', category: 'Papeterie', quantity: 5, unitPrice: 400, supplier: 'FournOffice' },
  { id: 7, name: 'Piles AAA (lot 20)', category: 'Électronique', quantity: 4, unitPrice: 600, supplier: 'Brico' },
  { id: 8, name: 'Souris sans fil', category: 'Électronique', quantity: 3, unitPrice: 900, supplier: 'TechShop' },
  { id: 9, name: 'Câbles HDMI 3m', category: 'Électronique', quantity: 5, unitPrice: 350, supplier: 'TechShop' },
  { id: 10, name: 'Marqueurs tableau', category: 'Papeterie', quantity: 12, unitPrice: 120, supplier: 'BureauPlus' },
];

const CATEGORIES = {
  'Nettoyage': { color: '#3b82f6', icon: <Sparkles className="w-4 h-4" /> },
  'Désinfection': { color: '#ef4444', icon: <Droplets className="w-4 h-4" /> },
  'Désodorisation': { color: '#a855f7', icon: <Sparkles className="w-4 h-4" /> },
  'Hygiène': { color: '#22c55e', icon: <Package className="w-4 h-4" /> },
  'Entretien': { color: '#f97316', icon: <Wrench className="w-4 h-4" /> },
  'Électricité': { color: '#eab308', icon: <Package className="w-4 h-4" /> },
  'Accessoires': { color: '#06b6d4', icon: <Package className="w-4 h-4" /> },
};

export default function ConsumablesPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analysis' | 'inventory'>('dashboard');
  const [invSubTab, setInvSubTab] = useState<'products' | 'consumables' | 'equipment' | 'office'>('products');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<PurchaseRecord | null>(null);
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT);
  const [officeSupplies, setOfficeSupplies] = useState<OfficeSupply[]>(INITIAL_OFFICE);
  const [officeEdit, setOfficeEdit] = useState<number | null>(null);
  const [officeEditData, setOfficeEditData] = useState<OfficeSupply | null>(null);
  const [newOffice, setNewOffice] = useState({ name: '', category: 'Papeterie', quantity: 1, unitPrice: 0, supplier: 'BureauPlus' });
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    product: '',
    category: 'Nettoyage',
    quantity: 1,
    unitPrice: 0,
    supplier: 'Hammache'
  });

  const [mainTab, setMainTab] = useState<'conso' | 'categories'>('conso');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '' });
  const productCategories = useLiveQuery(() => db.productCategories.toArray(), []);

  const products = useLiveQuery(() => db.products.toArray(), []);

  const totalInventoryValue = (products || []).reduce((s, p) => s + ((p.buyPrice || 0) * (p.stock || 0)), 0)
    + equipment.reduce((s, e) => s + (e.value || 0) * e.quantity, 0)
    + officeSupplies.reduce((s, o) => s + o.unitPrice * o.quantity, 0);

  const suppliers = ['Hammache', 'Grossiste', 'Pharma', 'Brico', 'SportTech', 'Autre'];
  const categories = ['Nettoyage', 'Désinfection', 'Désodorisation', 'Hygiène', 'Entretien', 'Électricité', 'Accessoires'];

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedHistory = [...purchaseHistory].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn as keyof PurchaseRecord];
    const bVal = b[sortColumn as keyof PurchaseRecord];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const addRecord = () => {
    if (newRecord.product && newRecord.unitPrice > 0) {
      const newId = purchaseHistory.length + 1;
      const total = newRecord.quantity * newRecord.unitPrice;
      purchaseHistory.unshift({
        id: newId,
        ...newRecord,
        total
      } as PurchaseRecord);
      setShowAddModal(false);
      setNewRecord({
        date: new Date().toISOString().split('T')[0],
        product: '',
        category: 'Nettoyage',
        quantity: 1,
        unitPrice: 0,
        supplier: 'Hammache'
      });
    }
  };

  const startEdit = (purchase: PurchaseRecord) => {
    setEditingId(purchase.id);
    setEditData({ ...purchase });
  };

  const saveEdit = () => {
    if (editData) {
      const index = purchaseHistory.findIndex(p => p.id === editData.id);
      if (index !== -1) {
        purchaseHistory[index] = { ...editData, total: editData.quantity * editData.unitPrice };
      }
      setEditingId(null);
      setEditData(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const totalSpent = purchaseHistory.reduce((sum, p) => sum + p.total, 0);
  const avgMonthly = totalSpent / 5; // 5 months
  
  const categoryTotals = purchaseHistory.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.total;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryTotals).map(([cat, total]) => ({
    category: cat,
    total,
    percentage: (total / totalSpent) * 100,
    color: CATEGORIES[cat as keyof typeof CATEGORIES]?.color || '#888'
  })).sort((a, b) => b.total - a.total);

  const monthlyTotal = monthlyExpenses.reduce((sum, m) => sum + m.total, 0);
  const lastMonth = monthlyExpenses[monthlyExpenses.length - 1];
  const prevMonth = monthlyExpenses[monthlyExpenses.length - 2];
  const trend = ((lastMonth.total - prevMonth.total) / prevMonth.total * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setMainTab('conso')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mainTab === 'conso' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Consommables</button>
        <button onClick={() => setMainTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mainTab === 'categories' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Catégories</button>
      </div>

      {mainTab === 'conso' && (
      <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Consommables & Dépenses</h2>
          <p className="text-gray-400 mt-1">Suivi des achats et comptabilité</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'history', label: 'Historique Achats', icon: Calendar },
          { id: 'analysis', label: 'Analyse', icon: PieChart },
          { id: 'inventory', label: 'Inventaire', icon: Box },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-orange-500 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Dépensé (5 mois)</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{monthlyTotal.toLocaleString()} DA</p>
              <p className="text-gray-500 text-sm mt-1">Moyenne: {(monthlyTotal/5).toLocaleString()}/mois</p>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Ce Mois (Mai)</span>
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{lastMonth.total.toLocaleString()} DA</p>
              <div className={`flex items-center gap-1 mt-1 ${parseFloat(trend) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(trend) < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                <span className="text-sm">{Math.abs(parseFloat(trend))}% vs mois dernier</span>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Achats ce Mois</span>
                <ShoppingBag className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-white">{purchaseHistory.filter(p => p.date.startsWith('2026-05')).length}</p>
              <p className="text-gray-500 text-sm mt-1">{purchaseHistory.filter(p => p.date.startsWith('2026-05')).reduce((s, p) => s + p.total, 0).toLocaleString()} DA</p>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Fournisseurs</span>
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">4</p>
              <p className="text-gray-500 text-sm mt-1">Actifs ce mois</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Répartition par Catégorie</h3>
              <div className="space-y-4">
                {categoryData.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-white">{cat.category}</span>
                      </div>
                      <span className="text-gray-400">{cat.total.toLocaleString()} DA ({cat.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Évolution Mensuelle</h3>
              <div className="space-y-3">
                {monthlyExpenses.map(month => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">{month.month}</span>
                    <span className="text-orange-400 font-bold">{month.total.toLocaleString()} DA</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-sm">📈 Projection annuelle: {(monthlyTotal * 2.4).toLocaleString()} DA</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-5 h-5" />
              Ajouter un consommable
            </button>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('product')}>
                    <div className="flex items-center gap-1">Produit {sortColumn === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">Catégorie {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('quantity')}>
                    <div className="flex items-center justify-center gap-1">Qté {sortColumn === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('unitPrice')}>
                    <div className="flex items-center justify-center gap-1">Prix Unit. {sortColumn === 'unitPrice' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end gap-1">Total {sortColumn === 'total' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-orange-400" onClick={() => handleSort('supplier')}>
                    <div className="flex items-center gap-1">Fournisseur {sortColumn === 'supplier' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map(purchase => (
                  <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/5">
                    {editingId === purchase.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input 
                            type="date" 
                            value={editData?.date || ''}
                            onChange={(e) => setEditData({...editData!, date: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={editData?.product || ''}
                            onChange={(e) => setEditData({...editData!, product: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            value={editData?.category || ''}
                            onChange={(e) => setEditData({...editData!, category: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editData?.quantity || 0}
                            onChange={(e) => setEditData({...editData!, quantity: Number(e.target.value)})}
                            className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={editData?.unitPrice || 0}
                            onChange={(e) => setEditData({...editData!, unitPrice: Number(e.target.value)})}
                            className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-orange-400 font-bold">{(editData?.quantity || 0) * (editData?.unitPrice || 0)} DA</span>
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            value={editData?.supplier || ''}
                            onChange={(e) => setEditData({...editData!, supplier: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                          >
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300"><Save className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="p-1 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-gray-300">{purchase.date}</td>
                        <td className="px-4 py-3 text-white font-medium">{purchase.product}</td>
                        <td className="px-4 py-4">
                          <span 
                            className="px-3 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: CATEGORIES[purchase.category as keyof typeof CATEGORIES]?.color + '20',
                              color: CATEGORIES[purchase.category as keyof typeof CATEGORIES]?.color
                            }}
                          >
                            {purchase.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-center">{purchase.quantity}</td>
                        <td className="px-4 py-3 text-gray-300 text-center">{purchase.unitPrice} DA</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-orange-400 font-bold">{purchase.total} DA</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{purchase.supplier}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => startEdit(purchase)} className="p-2 text-gray-400 hover:text-orange-400"><Edit className="w-4 h-4" /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Breakdown */}
          <div className="col-span-2 bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Détail Mensuel</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Mois</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Nettoyage</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Hygiène</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Entretien</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Électricité</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyExpenses.map(month => (
                  <tr key={month.month} className="border-b border-white/5">
                    <td className="py-3 text-white font-medium">{month.month}</td>
                    <td className="py-3 text-right text-gray-300">{month.cleaning.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-300">{month.hygiene.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-300">{month.maintenance.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-300">{month.electricity.toLocaleString()}</td>
                    <td className="py-3 text-right text-orange-400 font-bold">{month.total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-white/5">
                  <td className="py-3 text-white font-bold">TOTAL</td>
                  <td className="py-3 text-right text-white font-bold">{monthlyExpenses.reduce((s,m) => s+m.cleaning,0).toLocaleString()}</td>
                  <td className="py-3 text-right text-white font-bold">{monthlyExpenses.reduce((s,m) => s+m.hygiene,0).toLocaleString()}</td>
                  <td className="py-3 text-right text-white font-bold">{monthlyExpenses.reduce((s,m) => s+m.maintenance,0).toLocaleString()}</td>
                  <td className="py-3 text-right text-white font-bold">{monthlyExpenses.reduce((s,m) => s+m.electricity,0).toLocaleString()}</td>
                  <td className="py-3 text-right text-orange-400 font-bold">{monthlyTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Top Dépenses</h4>
              <div className="space-y-3">
                {categoryData.slice(0, 3).map(cat => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-white">{cat.category}</span>
                    <span className="text-orange-400 font-bold">{cat.total.toLocaleString()} DA</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Indicateurs Clés</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Coût moyen par membre/an</p>
                  <p className="text-2xl font-bold text-white">{(monthlyTotal * 12 / 25).toFixed(0)} DA</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">% des revenus (estimé)</p>
                  <p className="text-2xl font-bold text-yellow-400">~15%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Tendance</p>
                  <p className={`text-lg font-bold ${parseFloat(trend) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(trend) < 0 ? '📉 En baisse' : '📈 En hausse'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            {[
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'consumables', label: 'Consommables', icon: ShoppingBag },
              { id: 'equipment', label: 'Matériels', icon: Wrench },
              { id: 'office', label: 'Bureautique', icon: Printer },
            ].map(st => (
              <button key={st.id} onClick={() => setInvSubTab(st.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  invSubTab === st.id ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                <st.icon className="w-4 h-4" />
                {st.label}
              </button>
            ))}
            <div className="flex-1 text-right text-sm text-gray-500 py-2">
              Valeur totale inventaire: <span className="text-emerald-400 font-bold">{totalInventoryValue.toLocaleString()} DA</span>
            </div>
          </div>

          {/* Produits */}
          {invSubTab === 'products' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Produit</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Stock</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Prix achat</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Prix vente</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Valeur stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(!products || products.length === 0) ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">Aucun produit</td></tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-white">{p.name}</td>
                        <td className={`px-4 py-3 text-right font-medium ${(p.stock || 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>{p.stock || 0}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{((p.buyPrice || 0)).toLocaleString()} DA</td>
                        <td className="px-4 py-3 text-right text-gray-400">{((p.sellPrice || 0)).toLocaleString()} DA</td>
                        <td className="px-4 py-3 text-right text-white font-medium">{((p.buyPrice || 0) * (p.stock || 0)).toLocaleString()} DA</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Consommables */}
          {invSubTab === 'consumables' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {categoryData.slice(0, 4).map(cat => (
                  <div key={cat.category} className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{cat.category}</p>
                    <p className="text-lg font-bold text-white mt-1">{cat.total.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">{cat.percentage.toFixed(0)}% du total</p>
                  </div>
                ))}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Produit</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Catégorie</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Dépenses</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map(cat => (
                    <tr key={cat.category} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-white">{cat.category}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">{cat.total.toLocaleString()} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Matériels */}
          {invSubTab === 'equipment' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Équipement</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Catégorie</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Localisation</th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">Qté</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Statut</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map(eq => (
                    <tr key={eq.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-white">{eq.name}</td>
                      <td className="px-4 py-3 text-gray-400">{eq.category}</td>
                      <td className="px-4 py-3 text-gray-400">{eq.location}</td>
                      <td className="px-4 py-3 text-center text-white">{eq.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          eq.status === 'en_service' ? 'bg-green-500/20 text-green-400' :
                          eq.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {eq.status === 'en_service' ? 'En service' : eq.status === 'maintenance' ? 'Maintenance' : 'Hors service'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">{(eq.value * eq.quantity).toLocaleString()} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bureautique */}
          {invSubTab === 'office' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowOfficeModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm text-white font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Article</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Catégorie</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Qté</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Prix unit.</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Total</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Fournisseur</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeSupplies.map(os => (
                      <tr key={os.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        {officeEdit === os.id ? (
                          <>
                            <td className="px-4 py-2">
                              <input type="text" value={officeEditData?.name || ''} onChange={e => setOfficeEditData({...officeEditData!, name: e.target.value})}
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
                            </td>
                            <td className="px-4 py-2">
                              <select value={officeEditData?.category || ''} onChange={e => setOfficeEditData({...officeEditData!, category: e.target.value})}
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                                <option value="Papeterie">Papeterie</option>
                                <option value="Encre">Encre</option>
                                <option value="Électronique">Électronique</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={officeEditData?.quantity || 0} onChange={e => setOfficeEditData({...officeEditData!, quantity: Number(e.target.value)})}
                                className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={officeEditData?.unitPrice || 0} onChange={e => setOfficeEditData({...officeEditData!, unitPrice: Number(e.target.value)})}
                                className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center" />
                            </td>
                            <td className="px-4 py-2 text-right text-white font-medium">{(officeEditData?.quantity || 0) * (officeEditData?.unitPrice || 0)} DA</td>
                            <td className="px-4 py-2">
                              <select value={officeEditData?.supplier || ''} onChange={e => setOfficeEditData({...officeEditData!, supplier: e.target.value})}
                                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm">
                                <option value="BureauPlus">BureauPlus</option>
                                <option value="FournOffice">FournOffice</option>
                                <option value="TechShop">TechShop</option>
                                <option value="Brico">Brico</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => { const idx = officeSupplies.findIndex(o => o.id === os.id); if (idx !== -1) { const updated = [...officeSupplies]; updated[idx] = officeEditData!; setOfficeSupplies(updated); } setOfficeEdit(null); }} className="p-1 text-green-400 hover:text-green-300"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setOfficeEdit(null)} className="p-1 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-white">{os.name}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">{os.category}</span></td>
                            <td className="px-4 py-3 text-center text-white">{os.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{os.unitPrice} DA</td>
                            <td className="px-4 py-3 text-right text-white font-medium">{(os.quantity * os.unitPrice).toLocaleString()} DA</td>
                            <td className="px-4 py-3 text-gray-400">{os.supplier}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => { setOfficeEdit(os.id); setOfficeEditData({...os}); }} className="p-1 text-gray-400 hover:text-orange-400"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => setOfficeSupplies(prev => prev.filter(o => o.id !== os.id))} className="p-1 text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Office Add Modal */}
          {showOfficeModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Nouvel article bureau</h3>
                  <button onClick={() => setShowOfficeModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Article</label>
                    <input type="text" value={newOffice.name} onChange={e => setNewOffice({...newOffice, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Catégorie</label>
                      <select value={newOffice.category} onChange={e => setNewOffice({...newOffice, category: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                        <option value="Papeterie">Papeterie</option>
                        <option value="Encre">Encre</option>
                        <option value="Électronique">Électronique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Quantité</label>
                      <input type="number" value={newOffice.quantity} onChange={e => setNewOffice({...newOffice, quantity: Number(e.target.value)})} min="1"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Prix unitaire</label>
                      <input type="number" value={newOffice.unitPrice || ''} onChange={e => setNewOffice({...newOffice, unitPrice: Number(e.target.value)})} min="0"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Fournisseur</label>
                      <select value={newOffice.supplier} onChange={e => setNewOffice({...newOffice, supplier: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white">
                        <option value="BureauPlus">BureauPlus</option>
                        <option value="FournOffice">FournOffice</option>
                        <option value="TechShop">TechShop</option>
                        <option value="Brico">Brico</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={() => { if (newOffice.name) { setOfficeSupplies(prev => [...prev, { ...newOffice, id: Date.now() }]); setShowOfficeModal(false); setNewOffice({ name: '', category: 'Papeterie', quantity: 1, unitPrice: 0, supplier: 'BureauPlus' }); } }}
                  className="w-full mt-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700">
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Ajouter */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nouveau Consommable</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Fournisseur</label>
                  <select
                    value={newRecord.supplier}
                    onChange={(e) => setNewRecord({...newRecord, supplier: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Produit</label>
                <input
                  type="text"
                  value={newRecord.product}
                  onChange={(e) => setNewRecord({...newRecord, product: e.target.value})}
                  placeholder="Nom du produit"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Catégorie</label>
                  <select
                    value={newRecord.category}
                    onChange={(e) => setNewRecord({...newRecord, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Quantité</label>
                  <input
                    type="number"
                    value={newRecord.quantity}
                    onChange={(e) => setNewRecord({...newRecord, quantity: Number(e.target.value)})}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prix Unitaire (DA)</label>
                <input
                  type="number"
                  value={newRecord.unitPrice || ''}
                  onChange={(e) => setNewRecord({...newRecord, unitPrice: Number(e.target.value)})}
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-2xl font-bold text-orange-400">{(newRecord.quantity * newRecord.unitPrice).toLocaleString()} DA</span>
                </div>
              </div>
            </div>
            <button 
              onClick={addRecord}
              disabled={!newRecord.product || !newRecord.unitPrice}
              className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
      </>)}

      {/* Categories Section */}
      <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-400" />
            Catégories Produits
          </h3>
          <button onClick={() => { setCatForm({ name: '' }); setShowCategoryModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nouvelle Catégorie
          </button>
        </div>
        {(!productCategories || productCategories.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucune catégorie</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {productCategories.map(cat => (
              <div key={cat.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center group hover:border-orange-500/30 transition-all">
                <p className="text-white font-medium text-sm">{cat.name}</p>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={async () => {
                    if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                      await db.productCategories.delete(cat.id!);
                    }
                  }} className="text-red-400 hover:text-red-300 text-xs">
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nouvelle Catégorie</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nom</label>
                <input type="text" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="Ex: Eaux, Fruits, Protéines..." />
              </div>
            </div>
            <button onClick={async () => {
              if (!catForm.name) return;
              await db.productCategories.add({ name: catForm.name, createdAt: new Date() });
              setShowCategoryModal(false);
            }} disabled={!catForm.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50">Créer</button>
          </div>
        </div>
      )}
    </div>
  );
}