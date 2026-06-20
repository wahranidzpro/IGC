'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Plus, X, Package, Camera, Search, ChevronUp, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';

type SortKey = 'name' | 'buyPrice' | 'sellPrice' | 'stock' | 'margin' | 'totalProfit';
type SortDir = 'asc' | 'desc';
type StockFilter = 'all' | 'low' | 'out' | 'available';

export default function ProductsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const autoSave = useAutoSave<Product>({
    entityName: 'products',
    onCreate: isAdmin ? 'product_create' : undefined,
    onUpdate: isAdmin ? 'product_edit' : undefined,
    onDelete: isAdmin ? 'product_delete' : undefined,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [formData, setFormData] = useState({ barcode: '', name: '', buyPrice: 0, sellPrice: 0, stock: 0, photo: '' });
  const [inlineEdit, setInlineEdit] = useState<{ id: number; field: string; value: string } | null>(null);

  const products = useLiveQuery(() => db.products.toArray(), []);

  const enriched = useMemo(() => {
    if (!products) return [];
    return products.map(p => {
      const margin = p.buyPrice > 0 ? ((p.sellPrice - p.buyPrice) / p.buyPrice) * 100 : 0;
      const totalProfit = (p.sellPrice - p.buyPrice) * p.stock;
      const stockStatus = p.stock === 0 ? 'out' : p.stock <= 10 ? 'low' : 'available';
      return { ...p, margin, totalProfit, stockStatus };
    });
  }, [products]);

  const filtered = useMemo(() => {
    let items = enriched;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q));
    }
    if (stockFilter !== 'all') {
      items = items.filter(p => p.stockStatus === stockFilter);
    }
    items.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * dir;
      return ((aVal as number) - (bVal as number)) * dir;
    });
    return items;
  }, [enriched, search, stockFilter, sortKey, sortDir]);

  const totalInvest = products?.reduce((s, p) => s + p.buyPrice * p.stock, 0) || 0;
  const totalRevenue = products?.reduce((s, p) => s + p.sellPrice * p.stock, 0) || 0;
  const totalBenefit = totalRevenue - totalInvest;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setPhotoPreview(result);
        setFormData({ ...formData, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ barcode: '', name: '', buyPrice: 0, sellPrice: 0, stock: 0, photo: '' });
    setPhotoPreview('');
    setEditProduct(null);
    setShowAddModal(false);
  };

  const openEdit = (p: Product) => {
    setFormData({ barcode: p.barcode, name: p.name, buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock, photo: p.photo });
    setPhotoPreview(p.photo);
    setEditProduct(p);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (editProduct?.id) await autoSave.update(editProduct.id, formData);
    else await autoSave.save(formData);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    await autoSave.remove(id);
  };

  const ThButton = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 font-semibold text-gray-400 hover:text-white transition-colors ${className || ''}`}>
      {label} <SortIcon k={k} />
    </button>
  );

  // ── Mobile card view ──
  if (filtered.length === 0 && products && products.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="text-center py-12 text-gray-500">Aucun produit</div>
        <Modal />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher produit ou code-barres..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <SlidersHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {(['all', 'available', 'low', 'out'] as StockFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                stockFilter === f
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'available' ? 'Disponible' : f === 'low' ? 'Stock bas' : 'Rupture'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Investissement total</p>
          <p className="text-lg font-bold text-white">{totalInvest.toLocaleString()} DA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Revenu potentiel</p>
          <p className="text-lg font-bold text-green-400">{totalRevenue.toLocaleString()} DA</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Bénéfice total</p>
          <p className={`text-lg font-bold ${totalBenefit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalBenefit >= 0 ? '+' : ''}{totalBenefit.toLocaleString()} DA
          </p>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/80">
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3.5"><ThButton k="name" label="Produit" /></th>
              {isAdmin && <th className="text-right px-4 py-3.5"><ThButton k="buyPrice" label="Prix achat" className="ml-auto" /></th>}
              <th className="text-right px-4 py-3.5"><ThButton k="sellPrice" label="Prix vente" className="ml-auto" /></th>
              <th className="text-right px-4 py-3.5"><ThButton k="stock" label="Stock" className="ml-auto" /></th>
              {isAdmin && <th className="text-right px-4 py-3.5"><ThButton k="margin" label="Marge" className="ml-auto" /></th>}
              {isAdmin && <th className="text-right px-4 py-3.5"><ThButton k="totalProfit" label="Bénéfice total" className="ml-auto" /></th>}
              {isAdmin && <th className="text-right px-4 py-3.5"><span className="text-gray-400 font-semibold">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map(p => {
              const marginPct = p.margin;
              const marginColor = marginPct > 50 ? 'text-emerald-400' : marginPct > 20 ? 'text-blue-400' : marginPct > 0 ? 'text-yellow-400' : 'text-red-400';
              return (
                <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                        {p.photo ? <Image src={p.photo} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized /> : <Package className="w-full h-full p-1.5 text-gray-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate max-w-[200px]">{p.name}</p>
                        {p.barcode && <p className="text-xs text-gray-500 truncate">{p.barcode}</p>}
                      </div>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <InlinePriceField product={p} field="buyPrice" autoSave={autoSave} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <InlinePriceField product={p} field="sellPrice" autoSave={autoSave} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InlineStockField product={p} autoSave={autoSave} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${marginColor}`}>
                        {p.buyPrice > 0 ? `${marginPct.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${p.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.totalProfit.toLocaleString()} DA
                      </span>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Modifier">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => p.id && handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 7 : 4} className="text-center py-10 text-gray-500">Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {filtered.map(p => {
          const marginPct = p.margin;
          return (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {p.photo ? <Image src={p.photo} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized /> : <Package className="w-full h-full p-2 text-gray-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{p.name}</p>
                  {p.barcode && <p className="text-xs text-gray-500 truncate">{p.barcode}</p>}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  p.stock === 0 ? 'bg-red-500/15 text-red-400' :
                  p.stock <= 10 ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    p.stock === 0 ? 'bg-red-400' : p.stock <= 10 ? 'bg-yellow-400' : 'bg-emerald-400'
                  }`} />
                  {p.stock}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {isAdmin && (
                  <div className="bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Achat</p>
                    <p className="text-gray-300 font-medium">{p.buyPrice.toLocaleString()} DA</p>
                  </div>
                )}
                <div className="bg-gray-800/50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500">Vente</p>
                  <p className="text-green-400 font-medium">{p.sellPrice.toLocaleString()} DA</p>
                </div>
                {isAdmin && (
                  <div className="bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Marge</p>
                    <p className={`font-medium ${marginPct > 50 ? 'text-emerald-400' : marginPct > 20 ? 'text-blue-400' : marginPct > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {p.buyPrice > 0 ? `${marginPct.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                )}
                {isAdmin && (
                  <div className="bg-gray-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Bénéfice</p>
                    <p className={`font-medium ${p.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.totalProfit.toLocaleString()} DA
                    </p>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm flex items-center justify-center gap-1.5 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Modifier
                  </button>
                  <button onClick={() => p.id && handleDelete(p.id)} className="flex-1 py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm flex items-center justify-center gap-1.5 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && products && products.length > 0 && (
          <div className="text-center py-10 text-gray-500">Aucun produit ne correspond à votre recherche</div>
        )}
      </div>

      <Modal />
    </div>
  );

  function Header() {
    return (
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Produits</h2>
          <p className="text-gray-400 mt-1 text-sm">
            {products?.length || 0} article{products?.length !== 1 ? 's' : ''}
            {isAdmin && <span className="hidden sm:inline"> · Invest: {totalInvest.toLocaleString()} DA · Revenu: {totalRevenue.toLocaleString()} DA</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <ImportExportButtons
              onExport={() => exportToXlsx(products || [], 'produits')}
              onImport={() => importFromXlsx<Product>(async (items) => { await db.products.bulkAdd(items); })}
            />
          )}
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all text-sm">
              <Plus className="w-4 h-4" /> Nouveau
            </button>
          )}
        </div>
      </div>
    );
  }

  function InlinePriceField({ product, field, autoSave, inlineEdit, setInlineEdit }: {
    product: Product; field: 'buyPrice' | 'sellPrice'; autoSave: ReturnType<typeof useAutoSave<Product>>;
    inlineEdit: { id: number; field: string; value: string } | null; setInlineEdit: (v: { id: number; field: string; value: string } | null) => void;
  }) {
    const isEditing = inlineEdit?.id === product.id && inlineEdit?.field === field;
    const val = field === 'buyPrice' ? product.buyPrice : product.sellPrice;
    if (isEditing) {
      return (
        <form onSubmit={e => { e.preventDefault(); if (inlineEdit) { autoSave.update(product.id!, { ...product, [field]: Number(inlineEdit.value) }); setInlineEdit(null); } }} className="inline-flex items-center gap-1">
          <input type="number" value={inlineEdit?.value || ''} onChange={e => setInlineEdit({ ...inlineEdit!, value: e.target.value })} className="w-20 px-2 py-1 bg-gray-700 border border-orange-500 rounded text-white text-xs text-right focus:outline-none" autoFocus onBlur={() => setTimeout(() => setInlineEdit(null), 200)} />
          <button type="submit" className="p-1 bg-green-600 rounded hover:bg-green-700 text-white"><Check className="w-3 h-3" /></button>
        </form>
      );
    }
    return (
      <button onClick={() => setInlineEdit({ id: product.id!, field, value: String(val) })} className="hover:text-orange-400 transition-colors cursor-pointer">
        {val.toLocaleString()} DA
      </button>
    );
  }

  function InlineStockField({ product, autoSave, inlineEdit, setInlineEdit }: {
    product: Product; autoSave: ReturnType<typeof useAutoSave<Product>>;
    inlineEdit: { id: number; field: string; value: string } | null; setInlineEdit: (v: { id: number; field: string; value: string } | null) => void;
  }) {
    const isEditing = inlineEdit?.id === product.id && inlineEdit?.field === 'stock';
    if (isEditing) {
      return (
        <form onSubmit={e => { e.preventDefault(); if (inlineEdit) { autoSave.update(product.id!, { ...product, stock: Number(inlineEdit.value) }); setInlineEdit(null); } }} className="inline-flex items-center gap-1">
          <input type="number" value={inlineEdit?.value || ''} onChange={e => setInlineEdit({ ...inlineEdit!, value: e.target.value })} className="w-16 px-2 py-1 bg-gray-700 border border-orange-500 rounded text-white text-xs text-right focus:outline-none" autoFocus onBlur={() => setTimeout(() => setInlineEdit(null), 200)} />
          <button type="submit" className="p-1 bg-green-600 rounded hover:bg-green-700 text-white"><Check className="w-3 h-3" /></button>
        </form>
      );
    }
    const pct = product.stock;
    return (
      <button onClick={() => setInlineEdit({ id: product.id!, field: 'stock', value: String(pct) })} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors hover:ring-2 hover:ring-orange-400 ${
        pct === 0 ? 'bg-red-500/15 text-red-400' :
        pct <= 10 ? 'bg-yellow-500/15 text-yellow-400' :
        'bg-emerald-500/15 text-emerald-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${pct === 0 ? 'bg-red-400' : pct <= 10 ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
        {pct}
      </button>
    );
  }

  function Modal() {
    if (!showAddModal) return null;
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">{editProduct ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-gray-800 overflow-hidden border-2 border-gray-700">
                  {photoPreview ? <Image src={photoPreview} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized /> : <Package className="w-full h-full p-4 text-gray-500" />}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <span className="text-sm text-gray-400">Photo produit</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Code-barres</label>
              <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="Scannez ou saisissez" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nom</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prix achat (DA)</label>
                <input type="number" value={formData.buyPrice || ''} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prix vente (DA)</label>
                <input type="number" value={formData.sellPrice || ''} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Stock</label>
              <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!formData.name} className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all">
            {editProduct ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    );
  }
}
