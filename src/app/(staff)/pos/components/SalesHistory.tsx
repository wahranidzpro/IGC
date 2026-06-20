'use client'

import { Receipt, X, Printer } from 'lucide-react'
import type { Sale, SaleItem } from '@/lib/db/dexie-db'

interface SalesHistoryProps {
  showSalesHistory: boolean
  setShowSalesHistory: (v: boolean) => void
  todaySales: Sale[] | undefined
  totalSales: number | undefined
  salesPage: number
  setSalesPage: (v: number | ((prev: number) => number)) => void
  salesPageSize: number
  setLastSale: (v: Sale) => void
  printReceipt: (sale: Sale) => void
}

export default function SalesHistory({
  showSalesHistory, setShowSalesHistory, todaySales, totalSales,
  salesPage, setSalesPage, salesPageSize, setLastSale, printReceipt,
}: SalesHistoryProps) {
  if (!showSalesHistory) return null

  return (
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
                  <button onClick={() => { setLastSale(sale); setTimeout(() => printReceipt(sale), 100) }} className="p-1.5 rounded-lg transition-all" style={{ background: 'rgba(200,155,60,0.12)' }}>
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
  )
}
