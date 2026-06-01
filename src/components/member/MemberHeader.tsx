'use client';

import IGCQRCode from '@/components/IGCQRCode';
import { Download, CreditCard, User, Calendar } from 'lucide-react';
import { Member } from '@/lib/db/dexie-db';

interface MemberHeaderProps {
  member: Member;
}

export function MemberHeader({ member }: MemberHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const qrValue = `IGC:${member.id}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('member-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${member.firstName}_${member.lastName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Photo */}
        <div className="relative">
          {member.photo ? (
            <img 
              src={member.photo} 
              alt={`${member.firstName} ${member.lastName}`}
              className="w-28 h-28 rounded-full object-cover border-4 border-orange-500/50"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center border-4 border-orange-500/50">
              <User className="w-14 h-14 text-white" />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(member.status)}`}>
            {getStatusLabel(member.status)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">
            {member.firstName} {member.lastName}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-gray-400 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Membre depuis {new Date(member.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            {member.sessionsLeft !== undefined && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                member.sessionsLeft > 5 ? 'bg-green-500/20 text-green-400' :
                member.sessionsLeft > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {member.sessionsLeft} sessions restantes
              </span>
            )}
          </div>
        </div>

        {/* QR Code & RFID */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <IGCQRCode id="member-qr-code" value={qrValue} size={160} />
            <button
              onClick={handleDownloadQR}
              className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Download className="w-3 h-3" />
              Télécharger QR
            </button>
          </div>

          {/* RFID */}
          <div className="bg-gray-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[140px]">
            <CreditCard className="w-8 h-8 text-orange-400 mb-2" />
            <span className="text-xs text-gray-400 mb-1">Code RFID</span>
            <span className="text-lg font-mono font-bold text-orange-400">
              {member.rfidCode || 'Non défini'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
