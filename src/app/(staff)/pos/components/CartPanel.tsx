'use client'

import { type CartItem } from '../pos-constants'
import { type Reward } from '@/lib/db/dexie-db'
import type { LoyaltyConfig } from '@/lib/loyalty'
import { ShoppingCart, Minus, Plus, X, Receipt, User, CreditCard, Banknote, Star, Percent } from 'lucide-react'

interface CartPanelProps {
  cart: CartItem[]
  total: number
  rawTotal: number
  totalQty: number
  change: number
  paid: number
  setPaid: (v: number) => void
  paymentMode: 'cash' | 'card' | 'points'
  setPaymentMode: (v: 'cash' | 'card' | 'points') => void
  cardType: string
  setCardType: (v: string) => void
  discountPercent: number
  setDiscountPercent: (v: number) => void
  loyaltyConfig: LoyaltyConfig | null
  memberSearch: string
  setMemberSearch: (v: string) => void
  selectedMember: { id: number; name: string; phone: string } | null
  setSelectedMember: (v: { id: number; name: string; phone: string } | null) => void
  members: { id?: number; firstName: string; lastName: string; phone: string; fidelityPoints?: number }[] | undefined
  rewards: Reward[] | undefined
  rewardQty: Record<number, number>
  setRewardQty: (v: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void
  addRewardToCart: (reward: { id: number; name: string; pointsRequired: number }, qty: number) => void
  handleCheckout: () => void
  updateQty: (productId: number, delta: number) => void
  removeItem: (productId: number) => void
}

export default function CartPanel({
  cart, total, rawTotal, totalQty, change, paid, setPaid,
  paymentMode, setPaymentMode, cardType, setCardType,
  discountPercent, setDiscountPercent, loyaltyConfig,
  memberSearch, setMemberSearch, selectedMember, setSelectedMember,
  members, rewards, rewardQty, setRewardQty, addRewardToCart,
  handleCheckout, updateQty, removeItem,
}: CartPanelProps) {
  return (
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
          {discountPercent > 0 && (
            <div className="flex items-center justify-between text-[11px] text-green-400 tabular-nums">
              <span>Remise ({discountPercent}%)</span>
              <span>-{Math.round(rawTotal * discountPercent / 100).toLocaleString()} DA</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="text-lg font-extrabold text-white tabular-nums">
              {total.toLocaleString()} <span className="text-[10px] text-[#C89B3C]">DA</span>
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Percent className="w-3 h-3 text-purple-400/60" />
            <input
              type="number"
              value={discountPercent || ''}
              onChange={e => setDiscountPercent(Math.min(Math.max(0, Number(e.target.value)), loyaltyConfig?.posDiscountMaxPercent || 30))}
              className="w-16 px-2 py-1 rounded-lg text-white text-right text-[10px] font-semibold focus:outline-none tabular-nums transition-all"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}
              placeholder="%"
            />
            {discountPercent > 0 && (
              <button onClick={() => setDiscountPercent(0)} className="text-[10px] text-white/30 hover:text-white">Annuler</button>
            )}
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
                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-gold">
                  {rewards?.filter((r): r is Reward & { id: number } => !!r.id && r.stock > 0).map(r => {
                    const memberPts = members?.find(m => m.id === selectedMember.id)?.fidelityPoints || 0
                    const canAfford = memberPts >= r.pointsRequired
                    const qty = rewardQty[r.id] || 0
                    return (
                      <div key={r.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{r.name}</p>
                          <p className="text-[10px] text-yellow-400">{r.pointsRequired.toLocaleString()} pts</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {qty > 0 && (
                            <>
                              <button onClick={() => setRewardQty(prev => ({ ...prev, [r.id]: Math.max(0, qty - 1) }))} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/[0.06]"><Minus className="w-2.5 h-2.5" /></button>
                              <span className="w-4 text-center text-xs font-bold text-white">{qty}</span>
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (qty === 0) { setRewardQty(prev => ({ ...prev, [r.id]: 1 })); addRewardToCart({ id: r.id, name: r.name, pointsRequired: r.pointsRequired }, 1) }
                              else { setRewardQty(prev => ({ ...prev, [r.id]: qty + 1 })); addRewardToCart({ id: r.id, name: r.name, pointsRequired: r.pointsRequired }, 1) }
                            }}
                            disabled={!canAfford || qty >= r.stock}
                            className={`w-5 h-5 flex items-center justify-center rounded transition-all ${canAfford && qty < r.stock ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-white/10 cursor-not-allowed'}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {(!rewards || rewards.filter(r => r.stock > 0).length === 0) && (
                    <p className="text-[10px] text-white/30 text-center py-2">Aucune récompense disponible</p>
                  )}
                </div>
                {cart.some(i => i.rewardId) && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span className="text-[10px] text-green-400">Récompenses dans le panier</span>
                    <span className="text-xs font-bold text-green-400">{cart.filter(i => i.rewardId).reduce((s, i) => s + i.qty, 0)} articles</span>
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
            background: paymentMode === 'points' ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #C89B3C, #D4AF37)',
            boxShadow: paymentMode === 'points' ? '0 4px 20px rgba(245,158,11,0.25)' : '0 4px 20px rgba(200,155,60,0.25)',
          }}
        >
          {cart.length === 0 ? 'Ajouter des articles' :
           paymentMode === 'points' ? `ÉCHANGER ${total.toLocaleString()} PTS` :
           `ENCAISSER ${total.toLocaleString()} DA`}
        </button>
      </div>
    </aside>
  )
}
