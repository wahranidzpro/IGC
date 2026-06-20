'use client'

import { type PosTab, type ProductItem, CONSUMABLES, ACCESSORIES, SERVICES, idToNum } from '../pos-constants'
import type { SubscriptionPlan } from '@/lib/db/dexie-db'

interface ProductGridProps {
  search: string
  activeTab: PosTab
  setActiveTab: (tab: PosTab) => void
  subTab: 'subscriptions' | 'coaching'
  setSubTab: (tab: 'subscriptions' | 'coaching') => void
  addToCart: (item: { id: number; name: string; price: number }) => void
  addPlanToCart: (plan: { id?: number; name: string; price: number }) => void
  subscriptionPlans: SubscriptionPlan[] | undefined
  stockMap: Record<string, number>
}

const renderProductCard = (item: ProductItem, compact: boolean, addToCart: (item: { id: number; name: string; price: number }) => void) => (
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

export default function ProductGrid({
  search, activeTab, setActiveTab, subTab, setSubTab,
  addToCart, addPlanToCart, subscriptionPlans, stockMap,
}: ProductGridProps) {
  const activePlans = subscriptionPlans?.filter(p => p.isActive) || []
  const filteredSubscriptions = activePlans
    .filter(p => p.type === 'subscription')
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCoaching = activePlans
    .filter(p => p.type === 'free_session')
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const filteredConsumables = CONSUMABLES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  ).map(c => ({ ...c, stock: stockMap[c.id] ?? c.stock }))
  const allAccessories = [...ACCESSORIES, ...SERVICES]
  const filteredAccessories = allAccessories.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  ).map(a => ({ ...a, stock: stockMap[a.id] ?? (a as Record<string, unknown>).stock ?? 0 }))

  return (
    <>
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

      <div className="flex-1 overflow-y-auto p-3 scrollbar-gold">
        <div className="grid grid-cols-4 2xl:grid-cols-6 gap-2">
          {activeTab === 'subscriptions' && subTab === 'subscriptions' && (
            filteredSubscriptions.length === 0
              ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun abonnement trouvé</p>
              : filteredSubscriptions.map(item => (
                  <button key={item.id ?? `plan-${item.name}`} onClick={() => addPlanToCart({ id: item.id, name: item.name, price: item.price })}
                    className="group relative rounded-xl overflow-hidden transition-all duration-150 active:scale-[0.96] hover:shadow-lg hover:shadow-[#C89B3C]/10"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="h-24 flex items-center justify-center bg-gradient-to-br from-[rgba(200,155,60,0.08)] to-[rgba(200,155,60,0.02)]">
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📋</span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white leading-tight truncate">{item.name}</p>
                      <p className="text-base font-bold text-[#C89B3C] mt-0.5 tabular-nums">{item.price.toLocaleString()} <span className="text-[10px] font-medium">DA</span></p>
                      {item.description && <p className="text-[10px] text-white/30 mt-0.5 leading-tight line-clamp-1">{item.description}</p>}
                    </div>
                  </button>
                ))
          )}
          {activeTab === 'subscriptions' && subTab === 'coaching' && (
            filteredCoaching.length === 0
              ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun forfait coaching trouvé</p>
              : filteredCoaching.map(item => (
                  <button key={item.id ?? `coach-${item.name}`} onClick={() => addPlanToCart({ id: item.id, name: item.name, price: item.price })}
                    className="group relative rounded-xl overflow-hidden transition-all duration-150 active:scale-[0.96] hover:shadow-lg hover:shadow-[#C89B3C]/10"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="h-24 flex items-center justify-center bg-gradient-to-br from-[rgba(200,155,60,0.08)] to-[rgba(200,155,60,0.02)]">
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🏋️</span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white leading-tight truncate">{item.name}</p>
                      <p className="text-base font-bold text-[#C89B3C] mt-0.5 tabular-nums">{item.price.toLocaleString()} <span className="text-[10px] font-medium">DA</span></p>
                      {item.description && <p className="text-[10px] text-white/30 mt-0.5 leading-tight line-clamp-1">{item.description}</p>}
                    </div>
                  </button>
                ))
          )}
          {activeTab === 'consumables' && (
            filteredConsumables.length === 0
              ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun produit trouvé</p>
              : filteredConsumables.map(item => renderProductCard({ ...item, desc: undefined }, true, addToCart))
          )}
          {activeTab === 'accessories' && (
            filteredAccessories.length === 0
              ? <p className="col-span-full text-center text-white/30 py-12 text-sm">Aucun accessoire trouvé</p>
              : filteredAccessories.map(item => renderProductCard(item, false, addToCart))
          )}
        </div>
      </div>
    </>
  )
}
