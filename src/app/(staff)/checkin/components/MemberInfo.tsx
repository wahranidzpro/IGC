'use client';

import Image from 'next/image';
import { User, CheckCircle, Award, XCircle, Unlock, UserCheck, RefreshCw } from 'lucide-react';
import type { Member } from '@/lib/db/dexie-db';
import type { ScanStatus } from '../checkin-utils';
import { calculateAge } from '../checkin-utils';
import { formatPhoneDisplay } from '@/lib/whatsapp';

export default function MemberInfo({ scanStatus, scannedMember, earnedPoints, cameraError, handleBypass, kioskMode, startScanner }: {
  scanStatus: ScanStatus;
  scannedMember: Member | null | undefined;
  earnedPoints: number;
  cameraError?: string;
  handleBypass: () => Promise<void>;
  kioskMode: boolean;
  startScanner?: () => void;
}) {
  const renderPhoto = (status: string) => {
    if (!scannedMember) return null;
    const borderColor = status === 'success' ? 'border-green-500' : status === 'blocked' ? 'border-red-500' : status === 'expired' ? 'border-red-500' : 'border-yellow-500';
    const isBanned = !scannedMember.blockedUntil;
    return (
      <div className="mb-3">
        <div className={`relative w-40 h-40 mx-auto rounded-full overflow-hidden border-[3px] ${borderColor} shadow-xl`}>
          {scannedMember.photo ? (
            <Image src={scannedMember.photo} fill className="object-cover" alt="" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-500" />
            </div>
          )}
          {status === 'blocked' && (
            <div className={`absolute inset-0 ${isBanned ? 'bg-black/70' : 'bg-red-600/60'} flex items-center justify-center`}>
              <span className="text-white font-black text-2xl">{isBanned ? 'BANNI' : 'BLOQUÉ'}</span>
            </div>
          )}
        </div>
        <p className="text-white font-semibold mt-2">{scannedMember.firstName} {scannedMember.lastName}</p>
        <div className="text-xs text-gray-400 mt-1 space-y-1">
          <p>&#x1F4C5; {calculateAge(scannedMember.birthDate || '')} ans • &#x1F4F1; {formatPhoneDisplay(scannedMember.phone)}</p>
          <p>&#x1F3F7;&#xFE0F; RFID: {scannedMember.rfidCode || 'Non assigné'}</p>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
      {scannedMember && renderPhoto('success')}
      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
      <p className="text-green-400 font-semibold">Check-in réussi !</p>
      <div className="flex items-center justify-center gap-1 mt-2 text-yellow-400">
        <Award className="w-4 h-4" />
        <span className="text-sm font-medium">+{earnedPoints} points fidelite</span>
      </div>
    </div>
  );

  if (scanStatus === 'success') return renderSuccess();

  if (scanStatus === 'error') {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        {cameraError ? (
          <>
            <p className="text-red-400 font-semibold">Erreur camera</p>
            <p className="text-xs text-red-400/70 mt-1">{cameraError}</p>
            <button onClick={startScanner} className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
              <RefreshCw className="w-4 h-4 inline mr-1" /> Reessayer
            </button>
          </>
        ) : (
          <>
            <p className="text-red-400 font-semibold">Aucun membre trouvé</p>
            <p className="text-xs text-red-400/70 mt-1">Vérifiez les informations saisies</p>
          </>
        )}
      </div>
    );
  }

  if (scanStatus === 'blocked') {
    return (
      <div className="p-4 bg-black border-2 border-red-500 rounded-xl text-center">
        {scannedMember && renderPhoto('blocked')}
        <p className="text-red-400 text-sm">{scannedMember?.blockReason ? `Motif: ${scannedMember.blockReason}` : ''}</p>
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-500 font-bold text-lg">INTERDIT D&apos;ACCÈS</p>
        <p className="text-gray-400 text-xs mt-2">Contactez la direction</p>
        {kioskMode && (
          <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
            <Unlock className="w-4 h-4" /> Autoriser une fois
          </button>
        )}
      </div>
    );
  }

  if (scanStatus === 'expired') {
    return (
      <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-center">
        {scannedMember && renderPhoto('expired')}
        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 font-bold text-lg">ABONNEMENT EXPIRÉ</p>
        <p className="text-red-300 text-sm mt-2">Veuillez renouveler votre abonnement</p>
        <p className="text-gray-400 text-xs mt-2">Allez à &quot;Adhérents&quot; pour voir les détails</p>
        {kioskMode && (
          <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
            <Unlock className="w-4 h-4" /> Autoriser une fois
          </button>
        )}
      </div>
    );
  }

  if (scanStatus === 'inactive') {
    return (
      <div className="p-4 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl text-center">
        {scannedMember && renderPhoto('inactive')}
        <XCircle className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-400 font-bold text-lg">COMPTE INACTIF</p>
        <p className="text-yellow-300 text-sm mt-2">Veuillez contacter la salle</p>
        {kioskMode && (
          <button onClick={handleBypass} className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 mx-auto">
            <Unlock className="w-4 h-4" /> Autoriser une fois
          </button>
        )}
      </div>
    );
  }

  if (scanStatus === 'inside') {
    return (
      <div className="p-4 bg-blue-500/10 border-2 border-blue-500 rounded-xl text-center">
        {scannedMember && (
          <div className="mb-3">
            <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-[3px] border-blue-500 shadow-lg">
              {scannedMember.photo ? (
                <Image src={scannedMember.photo} fill className="object-cover" style={{ imageRendering: 'crisp-edges' }} alt="" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-500" />
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-blue-400">EN SALLE</div>
            </div>
            <p className="text-white font-semibold mt-4">{scannedMember.firstName} {scannedMember.lastName}</p>
          </div>
        )}
        <UserCheck className="w-10 h-10 text-blue-400 mx-auto mb-2" />
        <p className="text-blue-400 font-bold text-lg">DÉJÀ EN SALLE</p>
        <p className="text-blue-300 text-xs mt-2">Ce membre a déjà pointé son entrée aujourd&apos;hui</p>
      </div>
    );
  }

  return null;
}
