'use client';

import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Sale } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { Search, ShoppingCart, Trash2, Barcode, Minus, Plus, X, Printer, CreditCard, Banknote, Receipt, Package, User, Wallet, Award, Download, Upload, Wifi, WifiOff } from 'lucide-react';
import { ImportExportButtons, exportToXlsx, importFromXlsx } from '@/components/ui/ImportExportButtons';
import { logAudit } from '@/lib/audit';
import { enqueueAndProcess } from '@/lib/offline/queue';
import { getLoyaltyConfig, calculatePointsValue, calculateMaxDiscount, spendPoints } from '@/lib/loyalty';

interface CartItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export default function PosPage() {
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paid, setPaid] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'wallet' | 'points'>('cash');
  const [walletMemberId, setWalletMemberId] = useState(0);
  const [walletSearch, setWalletSearch] = useState('');
  const [cashMemberId, setCashMemberId] = useState(0);
  const [cashSearch, setCashSearch] = useState('');
  const [pointsMemberId, setPointsMemberId] = useState(0);
  const [pointsSearch, setPointsSearch] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number; paid: number; change: number } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => { window.removeEventListener('online', handler); window.removeEventListener('offline', handler); };
  }, []);

  const products = useLiveQuery(() => db.products.toArray(), []);
  const members = useLiveQuery(() => db.members.toArray(), []);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [salesPage, setSalesPage] = useState(0);
  const salesPageSize = 20;
  const totalSales = useLiveQuery(() => db.sales.count(), []);
  const todaySales = useLiveQuery(() => db.sales.orderBy('createdAt').reverse().offset(salesPage * salesPageSize).limit(salesPageSize).toArray(), [salesPage]);
  const walletMember = walletMemberId ? members?.find(m => m.id === walletMemberId) : null;
  const walletBalance = walletMember?.advance || 0;
  const pointsMember = pointsMemberId ? members?.find(m => m.id === pointsMemberId) : null;
  const availablePoints = pointsMember?.fidelityPoints || 0;
  const [loyaltyConfig, setLoyaltyConfig] = useState({ earnRateDzd: 100, earnRatePoints: 1, redemptionEnabled: true, redemptionRatePoints: 100, redemptionRateDzd: 10, redemptionMaxPercent: 50, posRedemptionEnabled: true, subscriptionRedemptionEnabled: true });
  const pointsValue = calculatePointsValue(pointsToRedeem, loyaltyConfig);

  useEffect(() => {
    getLoyaltyConfig().then(setLoyaltyConfig);
  }, []);

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  ).filter(p => p.stock > 0);

  const lowStock = products?.filter(p => p.stock > 0 && p.stock <= 10) || [];

  const addToCart = (p: { id?: number; name: string; sellPrice: number }) => {
    const pid = p.id!;
    if (!pid) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === pid);
      if (existing) {
        return prev.map(item => item.productId === pid ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price } : item);
      }
      return [...prev, { productId: pid, name: p.name, qty: 1, price: p.sellPrice, total: p.sellPrice }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const newQty = item.qty + delta;
      return newQty <= 0 ? null : { ...item, qty: newQty, total: newQty * item.price };
    }).filter(Boolean) as CartItem[]);
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((s, item) => s + item.total, 0);
  const totalQty = cart.reduce((s, item) => s + item.qty, 0);
  const change = paid >= total ? paid - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMode !== 'wallet' && paymentMode !== 'points' && paid < total) return;
    if (paymentMode === 'wallet' && (!walletMemberId || walletBalance < total)) return;
    if (paymentMode === 'points' && (!pointsMemberId || pointsToRedeem <= 0 || pointsValue < total)) return;
    if (paymentMode === 'points' && !loyaltyConfig.posRedemptionEnabled) return;
    const items = [...cart];
    const actualPaid = paymentMode === 'wallet' ? total : paymentMode === 'points' ? pointsValue : paid;
    for (const item of items) {
      const product = products?.find(p => p.id === item.productId);
      if (product) {
        await db.products.update(item.productId, { stock: product.stock - item.qty });
        await db.payments.add({
          memberId: paymentMode === 'wallet' ? walletMemberId : paymentMode === 'points' ? pointsMemberId : 0,
          amount: item.total, type: 'product', mode: paymentMode,
          date: new Date(), description: `Vente: ${item.name} x${item.qty}`, createdAt: new Date()
        });
      }
    }
    if (paymentMode === 'wallet' && walletMemberId) {
      const current = walletMember?.advance || 0;
      await db.members.update(walletMemberId, { advance: current - total });
    }
    if (paymentMode === 'points' && pointsMemberId) {
      const memberName = `${pointsMember?.firstName} ${pointsMember?.lastName}`;
      const result = await spendPoints(pointsMemberId, memberName, pointsToRedeem, `Achat POS: ${total} DA`);
      if (!result.success) {
        alert(result.error || 'Erreur lors de l\'utilisation des points');
        return;
      }
    }
    const changeAmount = Math.max(0, actualPaid - total);
    const now = new Date();
    const saleId = await db.sales.add({ items, total: total, paid: actualPaid, change: changeAmount, paymentMode, createdAt: now, updatedAt: now, syncStatus: 'pending' });
    await enqueueAndProcess('sale', 'create', {
      p_local_id: saleId,
      p_items_json: JSON.stringify(items),
      p_total: total,
      p_paid: actualPaid,
      p_change_amount: changeAmount,
      p_payment_mode: paymentMode,
      p_updated_at: now.toISOString(),
    }, 'important', String(saleId));
    const memberName = paymentMode === 'wallet' ? walletMember?.firstName + ' ' + walletMember?.lastName : paymentMode === 'points' ? pointsMember?.firstName + ' ' + pointsMember?.lastName : undefined;
    await logAudit({ action: 'pos_transaction', memberId: paymentMode === 'wallet' ? walletMemberId : paymentMode === 'points' ? pointsMemberId : undefined, memberName, newValue: `${total} DA - ${items.map(i => `${i.name} x${i.qty}`).join(', ')}`, reason: `Mode: ${paymentMode}` }, (user as { username?: string })?.username || 'unknown', role || 'unknown');
    setLastSale({ items: [...cart], total, paid: actualPaid, change: changeAmount });
    setCart([]);
    setPaid(0);
    setWalletMemberId(0);
    setWalletSearch('');
    setCashMemberId(0);
    setCashSearch('');
    setPointsMemberId(0);
    setPointsSearch('');
    setPointsToRedeem(0);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const printReceipt = () => {
    if (!lastSale) return;
    printSaleReceipt(lastSale.items, lastSale.total, lastSale.paid, lastSale.change);
  };

  const printSaleReceipt = (items: { name: string; qty: number; price: number; total?: number }[], t: number, p: number, c: number) => {
    const receiptWindow = window.open('', '_blank', 'width=300,height=600');
    if (!receiptWindow) return;
    receiptWindow.document.write(`
      <html><head><title>Reçu</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; color: #000; }
        .header { text-align: center; margin-bottom: 15px; }
        .header h2 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0; font-size: 11px; color: #555; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding-bottom: 4px; }
        td { padding: 3px 0; font-size: 11px; }
        .qty { text-align: center; }
        .price { text-align: right; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 6px; border-top: 1px solid #000; }
        .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #888; }
        .nowrap { white-space: nowrap; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <div class="header">
        <h2>INFINITY GYM CENTER</h2>
        <p>Reçu de caisse</p>
        <p>${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>
      <div class="divider"></div>
      <table>
        <tr><th>Article</th><th class="qty">Qté</th><th class="price">Prix</th></tr>
        ${items.map(i => `<tr><td>${i.name}</td><td class="qty">${i.qty}</td><td class="price">${(i.total ?? i.price * i.qty).toLocaleString()}</td></tr>`).join('')}
      </table>
      <div class="divider"></div>
      <table>
        <tr class="total-row"><td>TOTAL</td><td></td><td class="price">${t.toLocaleString()} DA</td></tr>
        <tr><td>Payé</td><td></td><td class="price">${p.toLocaleString()} DA</td></tr>
        <tr><td>Monnaie</td><td></td><td class="price">${c.toLocaleString()} DA</td></tr>
      </table>
      <div class="divider"></div>
      <div class="footer">
        <p>Merci de votre visite !</p>
        <p>Reçu #${Date.now().toString(36).toUpperCase()}</p>
      </div>
      <script>window.print();window.close();<\/script>
      </body></html>
    `);
    receiptWindow.document.close();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeRef.current?.value.trim();
    if (code) {
      const product = products?.find(p => p.barcode === code);
      if (product) { addToCart(product); }
      if (barcodeRef.current) barcodeRef.current.value = '';
    }
    if (barcodeRef.current) barcodeRef.current.focus();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Top Bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 backdrop-blur-xl border-b" style={{ background: 'color-mix(in srgb, var(--surface) 60%, transparent)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Caisse</h2>
            <p className="text-xs text-gray-500 leading-tight">{today.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2 max-w-xl ml-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', fontSize: '14px' }} />
          </div>
          <form onSubmit={handleBarcodeSubmit} className="relative w-44 shrink-0">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input ref={barcodeRef} type="text" placeholder="Code-barres..." autoFocus className="w-full pl-9 pr-3 py-2 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }} />
          </form>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ImportExportButtons
            onExport={() => {
  const data = (todaySales || []).map(s => ({
    Date: new Date(s.createdAt).toLocaleDateString('fr-FR'),
    Heure: new Date(s.createdAt).toLocaleTimeString('fr-FR'),
    Articles: s.items.map(i => `${i.name} x${i.qty}`).join(', '),
    Total: `${s.total.toLocaleString()} DA`,
    Payé: `${s.paid.toLocaleString()} DA`,
    Monnaie: `${s.change.toLocaleString()} DA`,
  }));
  exportToXlsx(data, 'ventes');
}}
            onImport={() => importFromXlsx<Sale>(async (items) => { await db.sales.bulkAdd(items); })}
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--surface-alt)' }}>
            {isOnline ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
            <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* ── Products Area (70%) ── */}
        <div className="flex-[7] flex flex-col min-h-0 p-4 pr-3 overflow-hidden">
          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 mb-3 border rounded-xl text-sm shrink-0" style={{ background: 'color-mix(in srgb, #f59e0b 10%, transparent)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <Package className="w-3.5 h-3.5" />
              {lowStock.length} produit(s) en stock faible
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto min-h-0 h-0 scrollbar-thin -mx-1 px-1">
            {filtered?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Package className="w-14 h-14 mb-3 text-gray-700" />
                <p className="text-sm font-medium">Aucun produit trouvé</p>
                <p className="text-xs text-gray-600 mt-1">Modifiez votre recherche ou ajoutez des produits</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filtered?.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 active:scale-[0.97]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 80%, transparent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
                  >
                    <div className="h-20 flex items-center justify-center overflow-hidden relative" style={{ background: 'var(--surface-alt)' }}>
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-700 group-hover:text-gray-600 transition-colors" />
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
                          p.stock > 5 ? 'bg-green-500/20 text-green-400' :
                          p.stock > 0 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {p.stock}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white truncate group-hover:text-orange-300 transition-colors">{p.name}</p>
                      <p className="text-sm font-bold text-orange-400 mt-0.5 tabular-nums">{p.sellPrice.toLocaleString()} <span className="text-[10px] font-medium">DA</span></p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Cart Area (30%) ── */}
        <div className="flex-[3] flex flex-col min-h-0 overflow-hidden backdrop-blur-xl border-l" style={{ background: 'linear-gradient(to bottom, var(--surface), var(--surface-alt))', borderColor: 'var(--border)' }}>
          {/* Cart receipt header */}
          <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-dashed" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-sm font-semibold text-white">Ticket de caisse</span>
            </div>
            <span className="text-xs text-gray-500 font-mono">#{Date.now().toString(36).slice(-4).toUpperCase()}</span>
          </div>

          {/* Items — scrollable uniquement */}
          <div className="flex-1 overflow-y-auto min-h-0 h-0 px-4 scrollbar-thin">
            <div className="space-y-1 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 min-h-[120px]">
                <div className="w-12 h-12 rounded-2xl bg-gray-800/40 flex items-center justify-center mb-2">
                  <Receipt className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Ticket vide</p>
                <p className="text-xs text-gray-600 mt-0.5 max-w-[140px]">Cliquez sur un produit</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-150"
                  style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono tabular-nums">{item.price.toLocaleString()} DA × {item.qty}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-white tabular-nums">{(item.price * item.qty).toLocaleString()} DA</p>
                  </div>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-700/40 text-gray-400 hover:bg-gray-700 hover:text-white transition-all text-[10px]"><Minus className="w-2.5 h-2.5" /></button>
                    <span className="w-6 text-center text-xs font-bold text-white tabular-nums">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-700/40 text-gray-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all text-[10px]"><Plus className="w-2.5 h-2.5" /></button>
                    <button onClick={() => removeItem(item.productId)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all text-[10px]"><X className="w-2.5 h-2.5" /></button>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>

          {/* Totaux — toujours visibles */}
          <div className="shrink-0 px-4 pb-1">
            <div className="space-y-0.5 pt-1.5 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>Sous-total ({totalQty} article{totalQty !== 1 ? 's' : ''})</span>
                <span className="tabular-nums">{total.toLocaleString()} DA</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-xs font-semibold text-white">Total</span>
                <span className="text-base font-extrabold text-white tabular-nums">{total.toLocaleString()} <span className="text-[10px] text-orange-400">DA</span></span>
              </div>
            </div>
          </div>

          {/* Modes paiement — toujours visibles */}
          <div className="shrink-0 px-4 pb-1">
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setPaymentMode('cash')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${paymentMode === 'cash' ? 'text-green-400 border shadow-sm' : 'text-gray-400 border hover:text-gray-200'}`} style={paymentMode === 'cash' ? { background: 'color-mix(in srgb, #22c55e 15%, transparent)', borderColor: 'rgba(34, 197, 94, 0.3)' } : { background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <Banknote className="w-3.5 h-3.5" /> Espèces
              </button>
              <button onClick={() => setPaymentMode('card')} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${paymentMode === 'card' ? 'text-blue-400 border shadow-sm' : 'text-gray-400 border hover:text-gray-200'}`} style={paymentMode === 'card' ? { background: 'color-mix(in srgb, #3b82f6 15%, transparent)', borderColor: 'rgba(59, 130, 246, 0.3)' } : { background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <CreditCard className="w-3.5 h-3.5" /> Carte
              </button>
              <button onClick={() => { setPaymentMode('wallet'); setWalletMemberId(0); setWalletSearch(''); setPointsMemberId(0); setPointsToRedeem(0); }} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${paymentMode === 'wallet' ? 'text-purple-400 border shadow-sm' : 'text-gray-400 border hover:text-gray-200'}`} style={paymentMode === 'wallet' ? { background: 'color-mix(in srgb, #a855f7 15%, transparent)', borderColor: 'rgba(168, 85, 247, 0.3)' } : { background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <Wallet className="w-3.5 h-3.5" /> Recharge
              </button>
              <button onClick={() => { setPaymentMode('points'); setPointsMemberId(0); setPointsSearch(''); setPointsToRedeem(0); setWalletMemberId(0); setWalletSearch(''); }} className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97] ${paymentMode === 'points' ? 'text-yellow-400 border shadow-sm' : 'text-gray-400 border hover:text-gray-200'}`} style={paymentMode === 'points' ? { background: 'color-mix(in srgb, #eab308 15%, transparent)', borderColor: 'rgba(234, 179, 8, 0.3)' } : { background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                <Award className="w-3.5 h-3.5" /> Points
              </button>
            </div>
          </div>

          {/* Détails paiement — toujours visible */}
          <div className="shrink-0 px-4 pb-1 min-h-0">
            {paymentMode === 'wallet' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {!walletMemberId ? (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input type="text" value={walletSearch} onChange={e => setWalletSearch(e.target.value)} placeholder="Membre..." className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-white text-[11px] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} autoFocus />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg border" style={{ background: 'color-mix(in srgb, #a855f7 10%, transparent)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-purple-400" />
                      <span className="text-[11px] text-purple-300">{walletMember?.firstName} {walletMember?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-purple-400">{walletBalance.toLocaleString()} DA</span>
                      <button onClick={() => { setWalletMemberId(0); setWalletSearch(''); }} className="text-[10px] text-gray-500 hover:text-purple-400 transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
                {walletBalance < total && total > 0 && (
                  <p className="text-[10px] text-red-400 px-2 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)' }}>Solde insuffisant · manque {(total - walletBalance).toLocaleString()} DA</p>
                )}
              </div>
            )}

            {paymentMode === 'points' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {!pointsMemberId ? (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input type="text" value={pointsSearch} onChange={e => setPointsSearch(e.target.value)} placeholder="Membre..." className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-white text-[11px] placeholder-gray-500 focus:outline-none focus:ring-1 transition-all" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} autoFocus />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 rounded-lg border" style={{ background: 'color-mix(in srgb, #eab308 10%, transparent)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-yellow-400" />
                        <span className="text-[11px] text-yellow-300">{pointsMember?.firstName} {pointsMember?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-yellow-400">{availablePoints} pts</span>
                        <button onClick={() => { setPointsMemberId(0); setPointsSearch(''); setPointsToRedeem(0); }} className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={pointsToRedeem || ''} onChange={e => setPointsToRedeem(Math.min(Number(e.target.value), availablePoints))} className="flex-1 px-2.5 py-1.5 rounded-lg text-white text-right text-xs focus:outline-none transition-all tabular-nums" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} placeholder="0" max={availablePoints} />
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">= {pointsValue.toLocaleString()} DA</span>
                    </div>
                    {availablePoints >= total && (
                      <button onClick={() => setPointsToRedeem(total)} className="text-[10px] text-yellow-400 hover:text-yellow-300 transition-colors">Utiliser {total} pts</button>
                    )}
                    {pointsValue < total && total > 0 && (
                      <p className="text-[10px] text-red-400 px-2 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)' }}>Points insuffisants · manque {(total - pointsValue).toLocaleString()} DA</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {paymentMode !== 'wallet' && paymentMode !== 'points' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {!cashMemberId ? (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                    <input type="text" value={cashSearch} onChange={e => setCashSearch(e.target.value)} className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-white text-[11px] placeholder-gray-500 focus:outline-none focus:border-gray-600" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} placeholder="Client..." />
                    {cashSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg max-h-28 overflow-y-auto z-10 shadow-xl backdrop-blur-xl" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        {members?.filter(m => {
                          const q = cashSearch.toLowerCase();
                          return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.phone.includes(q);
                        }).slice(0, 5).map(m => (
                          <button key={m.id} onClick={() => { setCashMemberId(m.id!); setCashSearch(`${m.firstName} ${m.lastName}`); }} className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-700/50 text-left transition-colors">
                            <User className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="text-[11px] text-white truncate">{m.firstName} {m.lastName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg border" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] text-gray-300">{cashSearch}</span>
                    </div>
                    <button onClick={() => { setCashMemberId(0); setCashSearch(''); }} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Annuler</button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Montant reçu ({paymentMode === 'cash' ? 'Espèces' : 'Carte'})</label>
                  <input type="number" value={paid || ''} onChange={e => setPaid(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg text-white text-right text-xs font-semibold focus:outline-none transition-all tabular-nums" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} placeholder="0" />
                </div>
              </div>
            )}

            {paymentMode !== 'wallet' && paymentMode !== 'points' && paid >= total && total > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-200 mt-1" style={{ background: 'color-mix(in srgb, #22c55e 10%, transparent)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <span className="text-[11px] text-green-400 font-medium">Monnaie</span>
                <span className="text-sm font-bold text-green-400 tabular-nums">{change.toLocaleString()} DA</span>
              </div>
            )}
          </div>

          {/* Checkout button — always visible */}
          <div className="shrink-0 px-4 pb-3">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || (paymentMode === 'wallet' ? (!walletMemberId || walletBalance < total) : paymentMode === 'points' ? (!pointsMemberId || pointsToRedeem <= 0 || pointsValue < total) : paid < total)}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:from-orange-500 disabled:hover:to-orange-600 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25"
            >
              {cart.length === 0 ? 'Ajouter des articles' : `Payer ${total.toLocaleString()} DA`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="rounded-2xl p-8 text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, #22c55e 20%, transparent)' }}>
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Vente effectuée !</h3>
            <p className="text-2xl font-bold text-green-400 mb-1">{total.toLocaleString()} DA</p>
            <p className="text-gray-400 text-sm">{paymentMode === 'wallet' ? 'Payé par Recharge' : paymentMode === 'points' ? `Payé avec ${pointsToRedeem} pts` : `Monnaie rendue: ${change.toLocaleString()} DA`} · {totalQty} articles</p>
            <div className="flex gap-3 mt-6">
              <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all text-sm font-medium">
                <Printer className="w-4 h-4" /> Imprimer reçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales History Button ── */}
      <button
        onClick={() => setShowSalesHistory(!showSalesHistory)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 backdrop-blur-xl border rounded-xl text-white shadow-lg transition-all"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Receipt className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-medium">Historique ({totalSales || 0})</span>
      </button>

      {/* ── Sales History Modal ── */}
      {showSalesHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowSalesHistory(false)}>
          <div className="w-full max-w-2xl border rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-2 sm:zoom-in-95 duration-200" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Historique</h3>
                <span className="text-xs text-gray-500">({totalSales || 0} vente{(totalSales || 0) !== 1 ? 's' : ''})</span>
              </div>
              <button onClick={() => setShowSalesHistory(false)} className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              {todaySales && todaySales.length > 0 ? (
                todaySales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between px-4 py-3 border rounded-xl transition-all" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{sale.items.map(i => `${i.name} x${i.qty}`).join(', ')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(sale.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2.5 ml-3 shrink-0">
                      <span className="text-sm text-gray-400 tabular-nums">{sale.paid.toLocaleString()} DA</span>
                      <span className="text-base font-bold text-orange-400 tabular-nums">{sale.total.toLocaleString()} DA</span>
                      <button onClick={() => printSaleReceipt(sale.items, sale.total, sale.paid, sale.change)} className="p-1.5 bg-orange-500/15 text-orange-400 rounded-lg hover:bg-orange-500/25 transition-all" title="Imprimer reçu">
                        <Printer className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Receipt className="w-12 h-12 mb-3 text-gray-700" />
                  <p className="text-sm">Aucune vente aujourd'hui</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs text-gray-500">Page {salesPage + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setSalesPage(p => Math.max(0, p - 1))} disabled={salesPage === 0} className="px-3.5 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Précédent</button>
                <button onClick={() => setSalesPage(p => (salesPage + 1) * salesPageSize < (totalSales || 0) ? p + 1 : p)} disabled={(salesPage + 1) * salesPageSize >= (totalSales || 0)} className="px-3.5 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Suivant</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}