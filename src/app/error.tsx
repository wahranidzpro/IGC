'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Une erreur est survenue</h2>
        <p className="text-gray-400 mb-8">{error.message || 'Erreur inattendue'}</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="flex items-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all cursor-pointer">
            <RefreshCw className="w-4 h-4" />Réessayer
          </button>
          <Link href="/" className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all">
            <Home className="w-4 h-4" />Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
