import { describe, it, expect } from 'vitest';
import { getMemberQRValue, parseMemberIdFromQR, getQrWhatsAppMessage, formatPhone, formatPhoneDisplay, getTemplate } from '@/lib/whatsapp';

describe('getMemberQRValue', () => {
  it('returns IGC: prefixed string for a numeric ID', () => {
    expect(getMemberQRValue(42)).toBe('IGC:42');
  });

  it('returns IGC: prefixed string for zero', () => {
    expect(getMemberQRValue(0)).toBe('IGC:0');
  });

  it('handles large member IDs', () => {
    expect(getMemberQRValue(999999)).toBe('IGC:999999');
  });
});

describe('parseMemberIdFromQR', () => {
  it('extracts ID from valid IGC: QR code', () => {
    expect(parseMemberIdFromQR('IGC:42')).toBe(42);
  });

  it('extracts ID from large numbers', () => {
    expect(parseMemberIdFromQR('IGC:999999')).toBe(999999);
  });

  it('returns null for empty string', () => {
    expect(parseMemberIdFromQR('')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(parseMemberIdFromQR('QR:42')).toBeNull();
  });

  it('returns null for missing colon', () => {
    expect(parseMemberIdFromQR('IGC42')).toBeNull();
  });

  it('returns null for non-numeric suffix', () => {
    expect(parseMemberIdFromQR('IGC:abc')).toBeNull();
  });

  it('returns null for negative number', () => {
    expect(parseMemberIdFromQR('IGC:-5')).toBeNull();
  });

  it('is idempotent - round trip', () => {
    const id = 77;
    expect(parseMemberIdFromQR(getMemberQRValue(id))).toBe(id);
  });
});

describe('getQrWhatsAppMessage', () => {
  it('generates message with name and QR value', () => {
    const msg = getQrWhatsAppMessage('Ahmed Benali', 'IGC:42');
    expect(msg).toContain('Ahmed Benali');
    expect(msg).toContain('IGC:42');
  });

  it('includes RFID code when provided', () => {
    const msg = getQrWhatsAppMessage('Ahmed Benali', 'IGC:42', 'RFID001');
    expect(msg).toContain('RFID001');
  });

  it('omits RFID line when not provided', () => {
    const msg = getQrWhatsAppMessage('Ahmed Benali', 'IGC:42');
    expect(msg).not.toContain('RFID');
  });
});

describe('formatPhone', () => {
  it('removes spaces', () => {
    expect(formatPhone('06 12 34 56 78')).toBe('0612345678');
  });

  it('removes dashes', () => {
    expect(formatPhone('06-12-34-56-78')).toBe('0612345678');
  });

  it('handles empty string', () => {
    expect(formatPhone('')).toBe('');
  });
});

describe('formatPhoneDisplay', () => {
  it('formats a 10-digit number with spaces', () => {
    expect(formatPhoneDisplay('0612345678')).toBe('06 12 34 56 78');
  });

  it('leaves short numbers unchanged', () => {
    expect(formatPhoneDisplay('1234')).toBe('1234');
  });
});

describe('getTemplate (message templates)', () => {
  it('renders renewal_reminder with variables', () => {
    const result = getTemplate('renewal_reminder', { name: 'Ahmed', days: '5' });
    expect(result).toBe('Bonjour Ahmed, votre abonnement expire dans 5 jours. Pensez à le renouveler !');
  });

  it('renders expired template', () => {
    const result = getTemplate('expired', { name: 'Sara' });
    expect(result).toContain('Sara');
    expect(result).toContain('expiré');
  });

  it('renders welcome template', () => {
    const result = getTemplate('welcome', { name: 'Test' });
    expect(result).toContain('Bienvenue Test');
  });

  it('renders receipt template', () => {
    const result = getTemplate('receipt', { name: 'Omar', amount: '5000' });
    expect(result).toContain('5000 DA');
  });

  it('falls back to default for unknown template', () => {
    const result = getTemplate('unknown_key', { name: 'X' });
    expect(result).toBe('Bonjour X !');
  });
});
