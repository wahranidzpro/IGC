export type MessageTemplate = string

export interface TemplateData {
  [key: string]: string
}

export function sendWhatsApp(phone: string, message: string): void {
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
}

export function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export function openWhatsApp(phone: string, template: MessageTemplate, data: TemplateData): void {
  const message = Object.entries(data).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }, template)
  sendWhatsApp(phone, message)
}

export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  return phone
}

export function getMemberQRValue(memberId: number): string {
  return `IGC:${memberId}`
}

export function parseMemberIdFromQR(qrValue: string): number | null {
  const match = qrValue.match(/^IGC:(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

export function getQrWhatsAppMessage(memberName: string, qrValue: string, rfidCode?: string): string {
  return `Bonjour ${memberName}, voici votre code QR IGC: ${qrValue}${rfidCode ? `\nCode RFID: ${rfidCode}` : ''}`
}

export async function downloadQRAndOpenWhatsApp(canvasId: string, filename: string, phone: string, message: string): Promise<void> {
  sendWhatsApp(phone, message)
}

const messageTemplates: Record<string, string> = {
  renewal_reminder: "Bonjour {{name}}, votre abonnement expire dans {{days}} jours. Pensez à le renouveler !",
  expired: "Bonjour {{name}}, votre abonnement a expiré. Rejoignez-nous vite pour continuer votre progression !",
  welcome: "Bienvenue {{name}} à l'IGC ! Nous sommes ravis de vous accueillir.",
  receipt: "Bonjour {{name}}, nous avons bien reçu votre paiement de {{amount}} DA. Merci !",
  receipt_reminder: "Bonjour {{name}}, vous avez un solde restant de {{balance}} DA.",
  subscription_reminder: "Bonjour {{name}}, votre abonnement expire bientôt.",
  attendance: "Bonjour {{name}}, merci pour votre visite aujourd'hui !",
}

export function getTemplate(templateName: string, data: Record<string, any>): string {
  const template = messageTemplates[templateName] || 'Bonjour {{name}} !'
  return Object.entries(data).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }, template)
}
