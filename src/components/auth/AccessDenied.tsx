'use client';

import { ShieldAlert, RefreshCw, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

export default function AccessDenied() {
  const { accessStatus, checkAccess, logout, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-gradient-to-tl from-red-600/10 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <div className="relative z-10 text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
        <p className="text-gray-400 mb-6">{accessStatus?.message || 'Abonnement ou validation requis.'}</p>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-3">
          {accessStatus?.reason && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Raison</p>
                <p className="text-sm text-white font-medium">{accessStatus.reason.replace(/_/g, ' ')}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <p className="text-sm text-white">{accessStatus?.message}</p>
            </div>
          </div>
          {user && 'name' in user && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-700/50">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-orange-400">{(user as any).name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Connecté en tant que</p>
                <p className="text-sm text-white font-medium">{(user as any).name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => checkAccess()}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Vérifier à nouveau
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all text-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
