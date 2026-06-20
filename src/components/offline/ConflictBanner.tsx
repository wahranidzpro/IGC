'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Upload, Download, HelpCircle } from 'lucide-react';
import { getUnresolvedConflicts, resolveConflict } from '@/lib/offline/conflicts';
import type { SyncConflict, ConflictResolution } from '@/lib/offline/conflicts';

export default function ConflictBanner() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [resolving, setResolving] = useState<Record<number, boolean>>({});

  const refresh = useCallback(async () => {
    try {
      const list = await getUnresolvedConflicts();
      setConflicts(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 10000);
    return () => { clearTimeout(id); clearInterval(interval); };
  }, [refresh]);

  const handleResolve = async (conflictId: number, resolution: ConflictResolution) => {
    setResolving(prev => ({ ...prev, [conflictId]: true }));
    try {
      await resolveConflict(conflictId, resolution);
      await refresh();
    } catch {
      // ignore
    } finally {
      setResolving(prev => ({ ...prev, [conflictId]: false }));
    }
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">
          {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} de synchronisation
        </h3>
      </div>

      <div className="space-y-3">
        {conflicts.map(conflict => (
          <div key={conflict.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {conflict.table}
                  </span>
                  <span className="text-xs text-gray-500">#{conflict.recordId}</span>
                </div>
                <p className="text-sm text-gray-300">
                  Modifié localement le{' '}
                  {new Date(conflict.localUpdatedAt).toLocaleString('fr-FR')}
                  {' '}et sur le cloud le{' '}
                  {new Date(conflict.cloudUpdatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => conflict.id && handleResolve(conflict.id, 'local_wins')}
                disabled={resolving[conflict.id ?? 0]}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {resolving[conflict.id ?? 0] ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Conserver local
              </button>

              <button
                onClick={() => conflict.id && handleResolve(conflict.id, 'remote_wins')}
                disabled={resolving[conflict.id ?? 0]}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {resolving[conflict.id ?? 0] ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Conserver cloud
              </button>

              <button
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-500 rounded-lg text-xs font-medium cursor-not-allowed"
              >
                <HelpCircle className="w-3 h-3" />
                Manuel
              </button>
            </div>
          </div>
        ))}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            onClick={refresh}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            Rafraîchir
          </button>
        </div>
      )}
    </div>
  );
}
