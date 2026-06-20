import type { Sale } from '@/lib/db/dexie-db'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function printReceipt(lastSale: Sale | null) {
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
