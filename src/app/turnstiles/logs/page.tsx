'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getAccessLogs, subscribeToAccessLogs, getTurnstiles, AccessLog } from '@/lib/supabase/turnstile-service';
import { ArrowLeft, RefreshCw, Clock, User, ShieldCheck, ShieldX, Wifi, Filter, Loader2, Download } from 'lucide-react';

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [turnstiles, setTurnstiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'allowed' | 'denied'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [l, t] = await Promise.all([
        getAccessLogs(100),
        getTurnstiles().catch(() => []),
      ]);
      setLogs(l);
      setTurnstiles(t);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToAccessLogs((newLog) => {
      setLogs(prev => [newLog, ...prev].slice(0, 200));
    });
    return unsub;
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  const exportLogs = () => {
    const csv = [
      ['Date', 'Membre', 'Tourniquet', 'Statut', 'Méthode', 'Raison'].join(','),
      ...filteredLogs.map(l => [
        new Date(l.timestamp).toLocaleString('fr-FR'),
        l.member_name || 'Inconnu',
        l.turnstile_name || '-',
        l.status === 'allowed' ? 'Autorisé' : 'Refusé',
        l.method,
        l.reason || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/turnstiles" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Journaux d'accès</h2>
            <p className="text-gray-400 text-sm">Temps réel · {logs.length} entrées chargées</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportLogs} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={fetchInitial} className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        {(['all', 'allowed', 'denied'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filter === f
                ? f === 'allowed' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : f === 'denied' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {f === 'all' ? 'Tous' : f === 'allowed' ? 'Autorisés' : 'Refusés'}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{filteredLogs.length} résultat(s)</span>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Heure</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Membre</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Tourniquet</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Méthode</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Raison</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">Aucun accès enregistré</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(log.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white">{log.member_name || 'Inconnu'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.turnstile_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'allowed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status === 'allowed' ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                          {log.status === 'allowed' ? 'Autorisé' : 'Refusé'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 uppercase">{log.method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${log.reason ? 'text-gray-400' : 'text-gray-600'}`}>
                          {log.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div ref={logsEndRef} />

      {/* Legend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Légende des statuts :</p>
        <p><span className="text-green-400">allowed</span> = Accès autorisé · <span className="text-red-400">denied</span> = Accès refusé</p>
        <p className="mt-1">Raisons courantes : <span className="text-gray-300">UNKNOWN_MEMBER</span> (RFID inconnu), <span className="text-gray-300">SUBSCRIPTION_EXPIRED</span> (abonnement expiré), <span className="text-gray-300">BLOCKED</span> (bloqué), <span className="text-gray-300">BANNED</span> (banni), <span className="text-gray-300">ANTIPASSBACK</span> (déjà en salle)</p>
      </div>
    </div>
  );
}
