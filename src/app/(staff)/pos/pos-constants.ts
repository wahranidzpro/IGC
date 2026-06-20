export interface CartItem {
  productId: number
  name: string
  qty: number
  price: number
  total: number
  rewardId?: number
  planId?: number
}

export function idToNum(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export type PosTab = 'subscriptions' | 'consumables' | 'accessories'

export const CONSUMABLES = [
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

export const ACCESSORIES = [
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

export const SERVICES = [
  { id: 'sv1', name: 'Analyse corporelle', price: 1000, desc: 'BIA complet', emoji: '📊' },
  { id: 'sv2', name: 'Bilan sportif', price: 2000, desc: 'Test physique complet', emoji: '📋' },
  { id: 'sv3', name: 'Coaching nutrition', price: 5000, desc: 'Plan alimentaire', emoji: '🥗' },
  { id: 'sv4', name: 'Programme perso', price: 3000, desc: 'Programme sur mesure', emoji: '📝' },
  { id: 'sv5', name: 'Carte remplacement', price: 500, desc: 'Nouvelle carte RFID', emoji: '🪪' },
]

export interface ProductItem {
  id: string
  name: string
  price: number
  stock?: number
  desc?: string
  emoji?: string
  photo?: string
}
