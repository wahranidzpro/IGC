'use client'

import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Sale, type SaleItem } from '@/lib/db/dexie-db'
import { useAuth } from '@/lib/auth/context'
import {
  Search, ShoppingCart, Barcode, Minus, Plus, X, Printer, CreditCard, Star,
  Banknote, Receipt, User, Wifi, WifiOff,
  History, QrCode,
  Send, FileText, Mail,
} from 'lucide-react'
import { Sidebar } from "@/components/layout/Sidebar"
import { logAudit } from '@/lib/audit'
import { enqueueAndProcess } from '@/lib/offline/queue'
import { getLoyaltyConfig, calculatePointsValue, spendPoints, earnPoints } from '@/lib/loyalty'
import type { LoyaltyConfig } from '@/lib/loyalty'

interface CartItem {
  productId: number
  name: string
  qty: number
  price: number
  total: number
}

function idToNum(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

type PosTab = 'subscriptions' | 'consumables' | 'accessories'

const CONSUMABLES = [
  { id: 'c1', name: 'Eau PM', price: 30, stock: 100, emoji: '💧' },
  { id: 'c2', name: 'Eau GM', price: 50, stock: 80, emoji: '💧' },
  { id: 'c3', name: 'Infinity Water', price: 80, stock: 60, emoji: '🧃' },
  { id: 'c4', name: 'Checker Infinity', price: 100, stock: 40, emoji: '⚡' },
  { id: 'c5', name: 'Banane', price: 30, stock: 100, emoji: '🍌' },
  { id: 'c6', name: 'Pomme', price: 40, stock: 80, emoji: '🍎' },
  { id: 'c7', name: 'Barre protéinée', price: 160, stock: 60, emoji: '🍫' },
  { id: 'c8', name: 'Whey Dose', price: 400, stock: 30, emoji: '🥤' },
  { id: 'c9', name: 'Café', price: 60, stock: 100, emoji: '☕' },
  { id: 'c10', name: 'Boisson énerg.', price: 200, stock: 40, emoji: '🔋' },
  { id: 'c11', name: 'Boisson sans sucre', price: 80, stock: 60, emoji: '🥤' },
  { id: 'c12', name: 'Shake protéiné', price: 150, stock: 40, emoji: '🥛' },
]

const ACCESSORIES = [
  { id: 'a1', name: 'Gants de sport', price: 1500, stock: 20, emoji: '🧤' },
  { id: 'a2', name: 'Ceinture muscu.', price: 2500, stock: 15, emoji: '🔗' },
  { id: 'a3', name: 'Serviette', price: 500, stock: 30, emoji: '🧻' },
  { id: 'a4', name: 'Shaker', price: 300, stock: 25, emoji: '🍶' },
  { id: 'a5', name: 'T-shirt', price: 2000, stock: 20, emoji: '👕' },
  { id: 'a6', name: 'Débardeur', price: 1800, stock: 20, emoji: '🎽' },
  { id: 'a7', name: 'Casquette', price: 1500, stock: 15, emoji: '🧢' },
  { id: 'a8', name: 'Sac sport', price: 3500, stock: 10, emoji: '🎒' },
  { id: 'a9', name: 'Sangle tirage', price: 800, stock: 20, emoji: '🪢' },
  { id: 'a10', name: 'Poignets', price: 600, stock: 20, emoji: '✊' },
  { id: 'a11', name: 'Élastiques', price: 1000, stock: 15, emoji: '🔄' },
  { id: 'a12', name: 'Bouteille réutilisable', price: 1200, stock: 20, emoji: '🧴' },
]

const SERVICES = [
  { id: 'sv1', name: 'Analyse corporelle', price: 1000, desc: 'BIA complet', emoji: '📊' },
  { id: 'sv2', name: 'Bilan sportif', price: 2000, desc: 'Test physique complet', emoji: '📋' },
  { id: 'sv3', name: 'Coaching nutrition', price: 5000, desc: 'Plan alimentaire', emoji: '🥗' },
  { id: 'sv4', name: 'Programme perso', price: 3000, desc: 'Programme sur mesure', emoji: '📝' },
  { id: 'sv5', name: 'Carte remplacement', price: 500, desc: 'Nouvelle carte RFID', emoji: '🪪' },
]

interface ProductItem {
  id: string
  name: string
  price: number
  stock?: number
  desc?: string
  emoji?: string
  photo?: string
}

export default function PosPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<PosTab>('subscriptions')
  const [subTab, setSubTab] = useState<'subscriptions' | 'coaching'>('subscriptions')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paid, setPaid] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'points'>('cash')
  const [cardType, setCardType] = useState<string>('Visa')
  const [pointsConfig, setPointsConfig] = useState<LoyaltyConfig | null>(null)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [showSalesHistory, setShowSalesHistory] = useState(false)
  const [salesPage, setSalesPage] = useState(0)
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string; phone: string } | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const salesPageSize = 20

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => { window.removeEventListener('online', handler); window.removeEventListener('offline', handler) }
  }, [])

  useEffect(() => { getLoyaltyConfig().then(setPointsConfig) }, [])

  const products = useLiveQuery(() => db.products.toArray(), [])
  const subscriptionPlans = useLiveQuery(() => db.subscriptionPlans.toArray(), [])
  const members = useLiveQuery(() => db.members.toArray(), [])
  const totalSales = useLiveQuery(() => db.sales.count(), [])
  const todaySales = useLiveQuery(
    () => db.sales.orderBy('createdAt').reverse().offset(salesPage * salesPageSize).limit(salesPageSize).toArray(),
    [salesPage],
  )

  const addToCart = (item: { id: number; name: string; price: number }) => {
    const pid = item.id
    setCart(prev => {
      const existing = prev.find(i => i.productId === pid)
      if (existing) {
        return prev.map(i => i.productId === pid ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i)
      }
      return [...prev, { productId: pid, name: item.name, qty: 1, price: item.price, total: item.price }]
    })
  }

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item
      const newQty = item.qty + delta
      return newQty <= 0 ? null : { ...item, qty: newQty, total: newQty * item.price }
    }).filter(Boolean) as CartItem[])
  }

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const total = cart.reduce((s, item) => s + item.total, 0)
  const totalQty = cart.reduce((s, item) => s + item.qty, 0)
  const change = paid >= total ? paid - total : 0

  const activePlans = subscriptionPlans?.filter(p => p.isActive) || []
  const filteredSubscriptions = activePlans
    .filter(p => p.type === 'subscription')
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCoaching = activePlans
    .filter(p => p.type === 'free_session')
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredConsumables = CONSUMABLES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )
  const allAccessories = [...ACCESSORIES, ...SERVICES]
  const filteredAccessories = allAccessories.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (paymentMode !== 'points' && paid < total) return
    const items = [...cart]
    const changeAmount = Math.max(0, paid - total)
    const now = new Date()

    if (paymentMode === 'points') {
      if (!selectedMember) return
      if (pointsToUse <= 0) return
      if (!pointsConfig) return
      const discount = calculatePointsValue(pointsToUse, pointsConfig)
      if (discount < total) return
      const result = await spendPoints(selectedMember.id, selectedMember.name, pointsToUse, `Achat POS: ${items.map(i => i.name).join(', ')}`)
      if (!result.success) { alert(result.error || 'Erreur points'); return }
      await earnPoints(selectedMember.id, selectedMember.name, total, undefined, 'pos')
      setPaid(total)
    }

    const saleId = await db.sales.add({
      items,
      total,
      paid,
      change: changeAmount,
      paymentMode,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending' as const,
    })

    await enqueueAndProcess('sale', 'create', {
      p_local_id: saleId,
      p_items_json: JSON.stringify(items),
      p_total: total,
      p_paid: paid,
      p_change_amount: changeAmount,
      p_payment_mode: paymentMode,
      p_updated_at: now.toISOString(),
    }, 'important', String(saleId))

    const memberName = selectedMember?.name
    await logAudit({
      action: 'pos_transaction',
      memberId: selectedMember?.id,
      memberName,
      newValue: `${total} DA - ${items.map(i => `${i.name} x${i.qty}`).join(', ')}`,
      reason: `Mode: ${paymentMode}`,
    }, (user as { username?: string })?.username || 'unknown', 'reception')

    if (paymentMode !== 'points' && selectedMember) {
      await earnPoints(selectedMember.id, selectedMember.name, total, saleId, 'pos').catch(() => {})
    }

    setLastSale({ items, total, paid, change: changeAmount, paymentMode, createdAt: now, updatedAt: now, syncStatus: 'pending' })
    setCart([])
    setPaid(0)
    setSelectedMember(null)
    setMemberSearch('')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

  const printReceipt = () => {
    if (!lastSale) return
    const w = window.open('', '_blank', 'width=300,height=600')
    if (!w) return
    w.document.write(`
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
        ${lastSale.items.map(i => `<tr><td>${escapeHtml(i.name)}</td><td class="qty">${i.qty}</td><td class="price">${(i.price * i.qty).toLocaleString()}</td></tr>`).join('')}
      </table>
      <div class="divider"></div>
      <table>
        <tr class="total-row"><td>TOTAL</td><td></td><td class="price">${lastSale.total.toLocaleString()} DA</td></tr>
        <tr><td>Payé</td><td></td><td class="price">${lastSale.paid.toLocaleString()} DA</td></tr>
        <tr><td>Monnaie</td><td></td><td class="price">${lastSale.change.toLocaleString()} DA</td></tr>
      </table>
      <div class="divider"></div>
      <div class="footer">
        <p>Merci de votre visite !</p>
        <p>Reçu #${Date.now().toString(36).toUpperCase()}</p>
      </div>
      <script>window.print();window.close();<\/script>
      </body></html>
    `)
    w.document.close()
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = barcodeRef.current?.value.trim()
    if (code) {
      const product = products?.find(p => p.barcode === code)
      if (product) addToCart({ id: product.id!, name: product.name, price: product.sellPrice })
      if (barcodeRef.current) barcodeRef.current.value = ''
    }
    if (barcodeRef.current) barcodeRef.current.focus()
  }

  const renderProductCard = (item: ProductItem, compact = false) => (
    <button
      key={item.id}
      onClick={() => addToCart({ id: idToNum(item.id), name: item.emoji ? `${item.emoji} ${item.name}` : item.name, price: item.price })}
      className="group relative rounded-xl overflow-hidden transition-all duration-150 active:scale-[0.96] hover:shadow-lg hover:shadow-[#C89B3C]/10"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className={`${compact ? 'h-16' : 'h-24'} flex items-center justify-center bg-gradient-to-br from-[rgba(200,155,60,0.08)] to-[rgba(200,155,60,0.02)]`}>
        <span className={`${compact ? 'text-3xl' : 'text-4xl'} group-hover:scale-110 transition-transform duration-300`}>
          {item.emoji || '📦'}
        </span>
      </div>
      <div className={`${compact ? 'p-2' : 'p-3'}`}>
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-white leading-tight truncate`}>
          {item.name}
        </p>
        <p className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#C89B3C] mt-0.5 tabular-nums`}>
          {item.price.toLocaleString()} <span className="text-[10px] font-medium">DA</span>
        </p>
        {item.stock !== undefined && (
          <p className={`${compact ? 'text-[10px]' : 'text-[10px]'} text-white/30 mt-0.5`}>
            Stock: {item.stock}
          </p>
        )}
        {item.desc && (
          <p className="text-[10px] text-white/30 mt-0.5 leading-tight line-clamp-1">{item.desc}</p>
        )}
      </div>
    </button>
  )

  return (
    <div className="flex h-screen" style={{ background: '#050505' }}>
      {/* ═══ LEFT SIDEBAR (same as admin) ═══ */}
      <div className="h-full shrink-0">
        <Sidebar collapsed={false} onToggle={() => {}} />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Bar ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: 'rgba(8,17,32,0.6)', borderColor: 'rgba(200,155,60,0.08)' }}>
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher adhérent, abonnement, produit..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <QrCode className="w-3.5 h-3.5" /> QR
            </button>
            <form onSubmit={handleBarcodeSubmit} className="relative w-36">
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={barcodeRef} type="text" placeholder="Code-barres..." className="w-full pl-8 pr-2 py-2 rounded-xl text-white text-xs placeholder-white/30 focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }} />
            </form>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSalesHistory(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <History className="w-3.5 h-3.5" /> Historique
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {isOnline ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
              <span className={`text-[10px] font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 space-y-0">
          <div className="flex items-center gap-1 px-4 pt-2 border-b" style={{ borderColor: 'rgba(200,155,60,0.08)' }}>
            {[
              { id: 'subscriptions' as PosTab, label: 'Abonnements', icon: '📋' },
              { id: 'consumables' as PosTab, label: 'Consommations', icon: '⚡' },
              { id: 'accessories' as PosTab, label: 'Accessoires', icon: '🧤' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
                  activeTab === tab.id
                    ? 'text-[#C89B3C] shadow-[inset_0_-2px_0_#C89B3C]'
                    : 'text-white/40 hover:text-white/70'
                }`}
                style={activeTab === tab.id ? { background: 'rgba(200,155,60,0.06)' } : {}}
              >
                <span className="text-sm">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'subscriptions' && (
            <div className="flex items-center gap-1 px-4 pt-1.5 pb-0">
              {[
                { id: 'subscriptions' as const, label: 'Abonnements', icon: '📋' },
                { id: 'coaching' as const, label: 'Coaching', icon: '🏋️' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setSubTab(st.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold rounded-t-lg transition-all ${
                    subTab === st.id
                      ? 'text-[#C89B3C] bg-[rgba(200,155,60,0.08)]'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <span>{st.icon}</span> {st.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content Grid ── */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-gold">
          <div className="grid grid-cols-4 2xl:grid-cols-6 gap-2">
            {activeTab === 'subscriptions' && subTab === 'subscriptions' && (
              filteredSubscriptions.length === 0
                ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun abonnement trouvé</p>
                : filteredSubscriptions.map(item => renderProductCard({ id: item.id?.toString() || '', name: item.name, price: item.price, desc: item.description, emoji: '📋' }, false))
            )}
            {activeTab === 'subscriptions' && subTab === 'coaching' && (
              filteredCoaching.length === 0
                ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun forfait coaching trouvé</p>
                : filteredCoaching.map(item => renderProductCard({ id: item.id?.toString() || '', name: item.name, price: item.price, desc: item.description, emoji: '🏋️' }, false))
            )}
            {activeTab === 'consumables' && (
              filteredConsumables.length === 0
                ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun produit trouvé</p>
                : filteredConsumables.map(item => renderProductCard({ ...item, desc: undefined }, true))
            )}
            {activeTab === 'accessories' && (
              filteredAccessories.length === 0
                ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun accessoire trouvé</p>
                : filteredAccessories.map(item => renderProductCard(item, false))
            )}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT CART (FIXED) ═══ */}
      <aside className="w-[360px] shrink-0 flex flex-col overflow-hidden border-l" style={{ background: 'rgba(8,17,32,0.95)', borderColor: 'rgba(200,155,60,0.08)' }}>
        {/* Header */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-dashed" style={{ borderColor: 'rgba(200,155,60,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(200,155,60,0.15)' }}>
              <Receipt className="w-3.5 h-3.5 text-[#C89B3C] m-auto" style={{ marginTop: '7px' }} />
            </div>
            <span className="text-sm font-bold text-white">PANIER</span>
            {totalQty > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-black" style={{ background: 'linear-gradient(to right, #C89B3C, #D4AF37)' }}>
                {totalQty}
              </span>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 px-3 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: 'rgba(200,155,60,0.06)' }}>
                <ShoppingCart className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm text-white/30 font-medium">Panier vide</p>
              <p className="text-[11px] text-white/20 mt-1 max-w-[160px]">Cliquez sur un produit pour ajouter</p>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5 tabular-nums">{item.price.toLocaleString()} DA × {item.qty}</p>
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    <p className="text-xs font-bold text-white tabular-nums">{(item.price * item.qty).toLocaleString()} DA</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"><Minus className="w-2.5 h-2.5" /></button>
                    <span className="w-6 text-center text-xs font-bold text-white tabular-nums">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-[#C89B3C] hover:bg-[#C89B3C]/10 transition-all"><Plus className="w-2.5 h-2.5" /></button>
                    <button onClick={() => removeItem(item.productId)} className="w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"><X className="w-2.5 h-2.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Search */}
        <div className="shrink-0 px-4 pb-1">
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
            <input
              type="text"
              value={selectedMember ? selectedMember.name : memberSearch}
              onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }}
              placeholder="Adhérent (optionnel)..."
              className="w-full pl-8 pr-2 py-1.5 rounded-lg text-white text-[11px] placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            />
            {memberSearch && !selectedMember && (
              <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg max-h-28 overflow-y-auto z-10 shadow-xl backdrop-blur-xl" style={{ background: 'rgba(8,17,32,0.98)', borderColor: 'rgba(200,155,60,0.15)' }}>
                {members?.filter(m => {
                  const q = memberSearch.toLowerCase()
                  return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.phone.includes(q)
                }).slice(0, 5).map(m => (
                  <button key={m.id} onClick={() => { setSelectedMember({ id: m.id!, name: `${m.firstName} ${m.lastName}`, phone: m.phone }); setMemberSearch('') }} className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/[0.04] text-left transition-colors">
                    <User className="w-3 h-3 text-white/30 shrink-0" />
                    <span className="text-[11px] text-white truncate">{m.firstName} {m.lastName}</span>
                    <span className="text-[10px] text-white/20 ml-auto">{m.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Totaux */}
        <div className="shrink-0 px-4 pb-1">
          <div className="space-y-0.5 pt-2 border-t border-dashed" style={{ borderColor: 'rgba(200,155,60,0.08)' }}>
            <div className="flex items-center justify-between text-[11px] text-white/40 tabular-nums">
              <span>Sous-total ({totalQty} art.)</span>
              <span>{total.toLocaleString()} DA</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/40 tabular-nums">
              <span>TVA (0%)</span>
              <span>0 DA</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-lg font-extrabold text-white tabular-nums">
                {total.toLocaleString()} <span className="text-[10px] text-[#C89B3C]">DA</span>
              </span>
            </div>
          </div>
        </div>

        {/* Montant reçu / Monnaie */}
        <div className="shrink-0 px-4 pb-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 whitespace-nowrap">Montant reçu</span>
            <input
              type="number"
              value={paid || ''}
              onChange={e => setPaid(Number(e.target.value))}
              className="flex-1 px-2.5 py-1.5 rounded-lg text-white text-right text-xs font-semibold focus:outline-none tabular-nums transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              placeholder="0"
            />
          </div>
          {paid >= total && total > 0 && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-200"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <span className="text-[11px] text-green-400 font-medium">Monnaie à rendre</span>
              <span className="text-sm font-bold text-green-400 tabular-nums">{change.toLocaleString()} DA</span>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="shrink-0 px-4 pb-1">
          <div className="grid grid-cols-3 gap-1">
            {[
              { mode: 'cash' as const, label: 'Espèces', icon: Banknote, color: '#22c55e' },
              { mode: 'card' as const, label: 'Carte', icon: CreditCard, color: '#3b82f6' },
              { mode: 'points' as const, label: 'Points', icon: Star, color: '#f59e0b' },
            ].map(pm => (
              <button
                key={pm.mode}
                onClick={() => setPaymentMode(pm.mode)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-semibold transition-all active:scale-[0.97] ${
                  paymentMode === pm.mode ? 'text-white shadow-sm' : 'text-white/30 hover:text-white/60'
                }`}
                style={paymentMode === pm.mode ? { background: `${pm.color}15`, border: `1px solid ${pm.color}30` } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <pm.icon className="w-3.5 h-3.5" />
                {pm.label}
              </button>
            ))}
          </div>

        {/* Card Type Selector */}
        {paymentMode === 'card' && (
          <div className="shrink-0 px-4 pb-1">
            <div className="grid grid-cols-3 gap-1">
              {['Visa', 'MasterCard', 'CIB', 'Edahabia', 'Autre'].map(type => (
                <button
                  key={type}
                  onClick={() => setCardType(type)}
                  className={`flex items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    cardType === type ? 'text-white shadow-sm' : 'text-white/30 hover:text-white/60'
                  }`}
                  style={cardType === type ? { background: '#3b82f615', border: '1px solid #3b82f630' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Points Fidélité */}
        {paymentMode === 'points' && (
          <div className="shrink-0 px-4 pb-1">
            {selectedMember ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="text-[10px] text-yellow-400">Points disponibles</span>
                  <span className="text-[10px] text-yellow-400 font-semibold">{members?.find(m => m.id === selectedMember.id)?.fidelityPoints || 0} pts</span>
                </div>
                {pointsConfig && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span className="text-[10px] text-green-400">Valeur totale</span>
                    <span className="text-[10px] text-green-400 font-semibold">{calculatePointsValue(members?.find(m => m.id === selectedMember.id)?.fidelityPoints || 0, pointsConfig).toLocaleString()} DA</span>
                  </div>
                )}
                <input
                  type="number"
                  value={pointsToUse || ''}
                  onChange={e => setPointsToUse(Math.min(Number(e.target.value), members?.find(m => m.id === selectedMember.id)?.fidelityPoints || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-white text-right text-xs font-semibold focus:outline-none tabular-nums transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  placeholder="Points à utiliser"
                />
                {pointsToUse > 0 && pointsConfig && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span className="text-[10px] text-green-400">Réduction</span>
                    <span className="text-xs font-bold text-green-400">-{calculatePointsValue(pointsToUse, pointsConfig).toLocaleString()} DA</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-yellow-400/60 text-center py-1">Sélectionnez un adhérent pour utiliser ses points</p>
            )}
          </div>
        )}

        </div>

        {/* Checkout Button */}
        <div className="shrink-0 px-4 pb-3 pt-1">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || (paymentMode !== 'points' && paid < total)}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to right, #C89B3C, #D4AF37)',
              boxShadow: '0 4px 20px rgba(200,155,60,0.25)',
            }}
          >
            {cart.length === 0 ? 'Ajouter des articles' : `ENCAISSER ${total.toLocaleString()} DA`}
          </button>
        </div>
      </aside>

      {/* ═══ Success Modal ═══ */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="rounded-2xl p-8 text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: 'rgba(8,17,32,0.98)', border: '1px solid rgba(200,155,60,0.15)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vente effectuée !</h3>
            <p className="text-2xl font-bold text-[#C89B3C] mb-1">{total.toLocaleString()} DA</p>
            <p className="text-sm text-white/40">{paymentMode === 'cash' ? 'Espèces' : paymentMode === 'card' ? 'Carte' : 'Points Fidélité'} · {totalQty} article{totalQty > 1 ? 's' : ''}</p>
            <div className="flex gap-2 mt-6">
              <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all" style={{ background: 'linear-gradient(to right, #C89B3C, #D4AF37)', color: '#000' }}>
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Send className="w-4 h-4" /> WhatsApp
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white/50 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white/50 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Sales History Modal ═══ */}
      {showSalesHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowSalesHistory(false)}>
          <div className="w-full max-w-2xl border rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-2 sm:zoom-in-95 duration-200" style={{ background: 'rgba(8,17,32,0.98)', borderColor: 'rgba(200,155,60,0.15)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(200,155,60,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.12)' }}>
                  <Receipt className="w-4 h-4 text-[#C89B3C]" />
                </div>
                <h3 className="text-base font-bold text-white">Historique des ventes</h3>
                <span className="text-xs text-white/30">({totalSales || 0} vente{(totalSales || 0) !== 1 ? 's' : ''})</span>
              </div>
              <button onClick={() => setShowSalesHistory(false)} className="p-1.5 text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-gold">
              {todaySales && todaySales.length > 0 ? (
                todaySales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between px-4 py-3 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">{sale.items.map((i: SaleItem) => `${i.name} x${i.qty}`).join(', ')}</p>
                      <p className="text-xs text-white/30 mt-0.5">{new Date(sale.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-2.5 ml-3 shrink-0">
                      <span className="text-sm text-white/40 tabular-nums">{sale.paid.toLocaleString()} DA</span>
                      <span className="text-base font-bold text-[#C89B3C] tabular-nums">{sale.total.toLocaleString()} DA</span>
                      <button onClick={() => { setLastSale(sale); setTimeout(() => printReceipt(), 100) }} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(200,155,60,0.12)' }}>
                        <Printer className="w-3 h-3 text-[#C89B3C]" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <Receipt className="w-12 h-12 mb-3" />
                  <p className="text-sm">Aucune vente aujourd&apos;hui</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(200,155,60,0.08)' }}>
              <span className="text-xs text-white/30">Page {salesPage + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setSalesPage(p => Math.max(0, p - 1))} disabled={salesPage === 0} className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>Précédent</button>
                <button onClick={() => setSalesPage(p => (salesPage + 1) * salesPageSize < (totalSales || 0) ? p + 1 : p)} disabled={(salesPage + 1) * salesPageSize >= (totalSales || 0)} className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>Suivant</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
