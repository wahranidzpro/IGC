import { db } from '@/lib/db/dexie-db'

export interface StockIssue {
  type: 'negative_stock' | 'oversold' | 'low_stock' | 'zero_price' | 'negative_price'
  productId: number
  productName: string
  currentStock: number
  detail: string
}

const OVERSELL_THRESHOLD = 0

export async function detectStockIssues(): Promise<StockIssue[]> {
  const issues: StockIssue[] = []
  const products = await db.products.toArray()
  const sales = await db.sales.toArray()

  for (const product of products) {
    if ((product.stock ?? 0) < 0) {
      issues.push({
        type: 'negative_stock',
        productId: product.id!,
        productName: product.name || 'Sans nom',
        currentStock: product.stock ?? 0,
        detail: `Stock négatif: ${product.stock}`,
      })
    }

    if ((product.sellPrice ?? 0) <= 0) {
      issues.push({
        type: product.sellPrice === 0 ? 'zero_price' : 'negative_price',
        productId: product.id!,
        productName: product.name || 'Sans nom',
        currentStock: product.stock ?? 0,
        detail: `Prix de vente: ${product.sellPrice} DA`,
      })
    }

    if ((product.stock ?? 0) >= 0 && (product.stock ?? 0) <= 3) {
      issues.push({
        type: 'low_stock',
        productId: product.id!,
        productName: product.name || 'Sans nom',
        currentStock: product.stock ?? 0,
        detail: `Stock bas: ${product.stock} unités`,
      })
    }
  }

  for (const sale of sales) {
    if (!sale.items) continue
    for (const item of sale.items) {
      if (item.productId && item.qty) {
        const product = products.find(p => p.id === item.productId)
        if (product && item.qty > (product.stock ?? 0) + OVERSELL_THRESHOLD) {
          issues.push({
            type: 'oversold',
            productId: item.productId,
            productName: product.name || 'Inconnu',
            currentStock: product.stock ?? 0,
            detail: `Vente #${sale.id}: ${item.qty} unités vendues alors que le stock était ${product.stock}`,
          })
        }
      }
    }
  }

  return issues
}
