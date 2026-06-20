'use client';

import { CheckCircle, X } from 'lucide-react';
import IGCQRCode from '@/components/IGCQRCode';
import { getMemberQRValue, getQrWhatsAppMessage, openWhatsAppDirect } from '@/lib/whatsapp';
import type { Member } from '@/lib/db/dexie-db';

interface SavedMemberData {
  name: string;
  phone: string;
  qrValue: string;
  rfidCode: string;
}

interface QrDisplayProps {
  member: Member | null;
  savedMemberData: SavedMemberData | null;
  onCloseQr: () => void;
  onCloseSaved: () => void;
}

export default function QrDisplay({ member, savedMemberData, onCloseQr, onCloseSaved }: QrDisplayProps) {
  return (
    <>
      {savedMemberData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Membre cree avec succes</h3>
            <IGCQRCode id="qr-saved-svg" value={savedMemberData.qrValue} size={200} memberName={savedMemberData.name} />
            <button
              onClick={() => {
                const svg = document.getElementById('qr-saved-svg') as unknown as Element;
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = 300;
                    canvas.height = 300;
                    ctx?.drawImage(img, 0, 0);
                    const link = document.createElement('a');
                    link.download = `QR_${savedMemberData.name.replace(/\s/g, '_')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Telecharger QR
            </button>
            <p className="text-xs text-gray-500 mb-4 font-mono">{savedMemberData.qrValue}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => openWhatsAppDirect(
                  savedMemberData.phone,
                  getQrWhatsAppMessage(savedMemberData.name, savedMemberData.qrValue, savedMemberData.rfidCode)
                )}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Envoyer par WhatsApp
              </button>
              <button onClick={onCloseSaved} className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {member && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">QR Code IGC</h3>
              <button onClick={onCloseQr} className="p-2 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <IGCQRCode id="qr-modal-svg" value={getMemberQRValue(member.id!)} size={200} memberName={`${member.firstName} ${member.lastName}`} />
            <p className="text-xs text-gray-500 mb-4 font-mono">RFID: {member.rfidCode || 'Non défini'}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const svg = document.getElementById('qr-modal-svg') as unknown as Element;
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = 300;
                      canvas.height = 300;
                      ctx?.drawImage(img, 0, 0);
                      const link = document.createElement('a');
                      link.download = `IGC_QR_${member.firstName}_${member.lastName}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Telecharger QR
              </button>
              <button
                onClick={() => openWhatsAppDirect(
                  member.phone,
                  getQrWhatsAppMessage(`${member.firstName} ${member.lastName}`, getMemberQRValue(member.id!), member.rfidCode || '')
                )}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm w-full"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Envoyer QR + RFID
              </button>
            </div>
            <button onClick={onCloseQr} className="w-full py-3 mt-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700">Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}
