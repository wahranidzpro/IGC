'use client';

import { useState } from 'react';
import { useQueueStatus, useQueueActions } from '@/hooks/useQueueStatus';
import { useAuth } from '@/lib/auth/context';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Activity, Wifi, WifiOff, Clock, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Database, ArrowUp, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MonitoringPage() {
  const { role } = useAuth();
  const router = useRouter();
  const { status, isOnline } = useQueueStatus(3000);
  const { retryAll, clearOld } = useQueueActions();
  const [working, setWorking] = useState<'retry' | 'clear' | null>(null);
  const [message, setMessage] = useState('');

  const membersCount = useLiveQuery(() => db.members.count(), []);
  const paymentsCount = useLiveQuery(() => db.payments.count(), []);
  const checkinsCount = useLiveQuery(() => db.checkins.count(), []);
  const salesCount = useLiveQuery(() => db.sales.count(), []);
  const productsCount = useLiveQuery(() => db.products.count(), []);

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Activity className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
          <p>Seuls les administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg">Retour</button>
        </div>
      </div>
    );
  }

  const handleRetry = async () => {
    setWorking('retry');
    const count = await retryAll();
    setMessage(`${count} éléments ré-ajoutés à la file d'attente`);
    setWorking(null);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleClear = async () => {
    setWorking('clear');
    const count = await clearOld();
    setMessage(`${count} éléments nettoyés`);
    setWorking(null);
    setTimeout(() => setMessage(''), 4000);
  };

  const totalPending = status.pending;
  const pctOk = (status.completed + status.pending + status.failed) > 0
    ? Math.round((status.completed / (status.completed + status.failed + status.pending)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-orange-400" />
            Monitoring technique
          </h2>
          <p className="text-gray-400 mt-1">État de la synchronisation et santé du système</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {status.completed > 0 && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {pctOk}% succès
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
          {message}
        </div>
      )}

      {/* Connectivity & Queue health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          label="Connectivité"
          value={isOnline ? 'En ligne' : 'Hors ligne'}
          icon={isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          color={isOnline ? 'text-green-400' : 'text-red-400'}
          bg={isOnline ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}
        />
        <StatusCard
          label="En attente"
          value={totalPending}
          icon={<Clock className="w-5 h-5" />}
          color={totalPending > 10 ? 'text-yellow-400' : 'text-blue-400'}
          bg={totalPending > 10 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'}
        />
        <StatusCard
          label="Échoués"
          value={status.failed}
          icon={<XCircle className="w-5 h-5" />}
          color={status.failed > 0 ? 'text-red-400' : 'text-green-400'}
          bg={status.failed > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}
        />
        <StatusCard
          label="Traités (24h)"
          value={status.completed}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-400"
          bg="bg-green-500/10 border-green-500/30"
        />
      </div>

      {/* Queue detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            File d&apos;attente par priorité
          </h3>
          <div className="space-y-3">
            <PriorityRow label="Critical" count={status.byPriority.critical} color="text-red-400" barColor="bg-red-500" />
            <PriorityRow label="Important" count={status.byPriority.important} color="text-yellow-400" barColor="bg-yellow-500" />
            <PriorityRow label="Heavy" count={status.byPriority.heavy} color="text-blue-400" barColor="bg-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              disabled={working === 'retry' || status.failed === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${working === 'retry' ? 'animate-spin' : ''}`} />
              Ré-essayer échecs
            </button>
            <button
              onClick={handleClear}
              disabled={working === 'clear' || status.completed === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Nettoyer traités
            </button>
          </div>
        </div>

        {/* DB Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-400" />
            Base de données locale
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Membres" value={membersCount ?? '...'} />
            <MiniStat label="Paiements" value={paymentsCount ?? '...'} />
            <MiniStat label="Check-ins" value={checkinsCount ?? '...'} />
            <MiniStat label="Ventes POS" value={salesCount ?? '...'} />
            <MiniStat label="Produits" value={productsCount ?? '...'} />
            <MiniStat label="Queue" value={status.pending + status.completed + status.failed} />
          </div>
        </div>
      </div>

      {/* Sync config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ArrowUp className="w-5 h-5 text-orange-400" />
          Configuration synchronisation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <ConfigRow label="Critical" interval="1s" entities="Paiements, check-ins, RFID" />
          <ConfigRow label="Important" interval="5s" entities="Membres, produits, programmes, plans" />
          <ConfigRow label="Heavy" interval="30s" entities="Exports, analytics, bulk" />
        </div>
        <div className="flex items-center gap-2 pt-2 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          Pull cloud toutes les 120s
          {!isSupabaseConfigured && (
            <span className="text-yellow-400 flex items-center gap-1 ml-2">
              <AlertTriangle className="w-3 h-3" /> Supabase non configuré
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className={`rounded-xl p-4 border ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold text-white`}>{value}</p>
    </div>
  );
}

function PriorityRow({ label, count, color, barColor }: { label: string; count: number; color: string; barColor: string }) {
  const maxDisplay = 50;
  const pct = Math.min((count / maxDisplay) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <span className="text-sm text-gray-400">{count} en attente</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ConfigRow({ label, interval, entities }: { label: string; interval: string; entities: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-3.5 h-3.5 text-orange-400" />
        <span className="font-medium text-white">{label}</span>
        <span className="text-orange-400 font-mono ml-auto">{interval}</span>
      </div>
      <p className="text-xs text-gray-500">{entities}</p>
    </div>
  );
}
