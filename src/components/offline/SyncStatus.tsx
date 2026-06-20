'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, WifiOff, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { getQueueStatus, retryFailed, processQueue } from '@/lib/offline/queue';

type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

async function getUnresolvedConflicts(): Promise<{ length: number }> {
  try {
    const mod = await import('@/lib/offline/conflicts');
    return mod.getUnresolvedConflicts();
  } catch {
    return { length: 0 };
  }
}

export default function SyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const status = await getQueueStatus();
      setPendingCount(status.pending);
      setFailedCount(status.failed);

      const conflicts = await getUnresolvedConflicts();
      setConflictCount(conflicts.length);

      if (!navigator.onLine) {
        setSyncState('offline');
      } else if (status.failed > 0) {
        setSyncState('error');
      } else if (status.pending > 0) {
        setSyncState('syncing');
      } else {
        setSyncState('synced');
      }
    } catch {
      setSyncState('error');
      setError('Failed to get sync status');
    }
  }, []);

  useEffect(() => {
    const init = setTimeout(() => refresh(), 0);
    const interval = setInterval(refresh, 5000);
    const handleOnline = () => { refresh(); processQueue(); };
    const handleOffline = () => setSyncState('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearTimeout(init);
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  const handleSyncNow = async () => {
    setSyncState('syncing');
    setError(null);
    try {
      await retryFailed();
      await processQueue();
      await refresh();
    } catch {
      setError('Sync failed');
      setSyncState('error');
    }
  };

  const icon = syncState === 'synced' ? <CheckCircle2 className="w-4 h-4 text-green-400" />
    : syncState === 'syncing' ? <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
    : syncState === 'offline' ? <WifiOff className="w-4 h-4 text-yellow-400" />
    : <AlertTriangle className="w-4 h-4 text-red-400" />;

  const label = syncState === 'synced' ? 'Synced'
    : syncState === 'syncing' ? 'Syncing...'
    : syncState === 'offline' ? 'Offline'
    : 'Sync Error';

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
        title={`Sync: ${label}`}
      >
        {icon}
        <span className="text-gray-300">{label}</span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
            <Clock className="w-3 h-3" />
            {pendingCount}
          </span>
        )}
        {failedCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
            {failedCount} failed
          </span>
        )}
        {conflictCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs">
            <AlertTriangle className="w-3 h-3" />
            {conflictCount} conflit{conflictCount > 1 ? 's' : ''} à résoudre
          </span>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-200">Sync Status</h3>
            <button onClick={() => setExpanded(false)} className="text-gray-500 hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Status</span>
              <span className="text-gray-200">{label}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Network</span>
              <span className={navigator.onLine ? 'text-green-400' : 'text-yellow-400'}>
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Pending</span>
              <span className="text-gray-200">{pendingCount}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Failed</span>
              <span className="text-gray-200">{failedCount}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Conflicts</span>
              <span className={conflictCount > 0 ? 'text-yellow-400' : 'text-gray-200'}>
                {conflictCount}
              </span>
            </div>
          </div>

          {(failedCount > 0 || pendingCount > 0) && (
            <button
              onClick={handleSyncNow}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
          )}

          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}