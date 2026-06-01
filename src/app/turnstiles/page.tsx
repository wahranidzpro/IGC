'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTurnstiles, updateTurnstile, deleteTurnstile, getActiveSessions, getDeviceHealth, Turnstile } from '@/lib/supabase/turnstile-service';
import { Plus, Settings, Wifi, WifiOff, DoorOpen, RefreshCw, Trash2, Edit, ToggleLeft, ToggleRight, Users, Activity, Loader2 } from 'lucide-react';

export default function TurnstilesPage() {
  const router = useRouter();
  const [turnstiles, setTurnstiles] = useState<Turnstile[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [deviceHealth, setDeviceHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [t, s, h] = await Promise.all([
        getTurnstiles(),
        getActiveSessions().catch(() => []),
        getDeviceHealth().catch(() => []),
      ]);
      setTurnstiles(t);
      setActiveSessions(s);
      setDeviceHealth(h);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
      setTurnstiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleActive = async (t: Turnstile) => {
    try {
      await updateTurnstile(t.id, { is_active: !t.is_active });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer le tourniquet "${name}" ?`)) return;
    try {
      await deleteTurnstile(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getLastHeartbeat = (deviceId: number) => {
    const hb = deviceHealth.find((h: any) => h.turnstile_id === deviceId);
    return hb ? new Date(hb.timestamp).toLocaleString('fr-FR') : null;
  };

  const isOnline = (t: Turnstile) => {
    if (!t.last_heartbeat) return false;
    return Date.now() - new Date(t.last_heartbeat).getTime() < 30000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        <p className="text-gray-400 ml-3">Chargement des tourniquets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <DoorOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Contrôle d'accès</h2>
            <p className="text-gray-400 text-sm">Tourniquets · {activeSessions.length} personne(s) en salle · {turnstiles.filter(t => t.is_active).length} actif(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/turnstiles/add" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm text-white font-medium transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un tourniquet
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total tourniquets</p>
          <p className="text-2xl font-bold text-white mt-1">{turnstiles.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">En ligne</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{turnstiles.filter(t => isOnline(t)).length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">Personnes en salle</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{activeSessions.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500">Entrées aujourd'hui</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">-</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
          <p className="text-xs text-red-400/70 mt-1">Vérifiez la configuration Supabase (.env.local)</p>
        </div>
      )}

      {/* Turnstile list */}
      {turnstiles.length === 0 && !error ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <DoorOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun tourniquet configuré</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
            Ajoutez un tourniquet pour commencer à contrôler les accès. 
            Les tourniquets ZKTeco, Hikvision, Dahua et HTTP générique sont supportés.
          </p>
          <Link href="/turnstiles/add" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors">
            <Plus className="w-5 h-5" /> Configurer un tourniquet
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {turnstiles.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline(t) ? 'bg-green-500/20' : 'bg-gray-800'}`}>
                    {isOnline(t) ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {t.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t.location} · {t.device_type} · {t.direction === 'entry' ? 'Entrée' : t.direction === 'exit' ? 'Sortie' : 'Bidirectionnel'}</p>
                    {t.ip_address && <p className="text-xs text-gray-500 mt-0.5">{t.ip_address}:{t.port}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(t)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors" title={t.is_active ? 'Désactiver' : 'Activer'}>
                    {t.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <Link href={`/turnstiles/add?id=${t.id}`} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-orange-400 transition-colors" title="Modifier">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/turnstiles/logs" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-white">Journaux d'accès</p>
              <p className="text-xs text-gray-500">Historique en temps réel</p>
            </div>
          </div>
        </Link>
        <Link href="/turnstiles/install" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">Installation Bridge</p>
              <p className="text-xs text-gray-500">Connecter un tourniquet</p>
            </div>
          </div>
        </Link>
        <Link href="/checkin" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-white">Pointage manuel</p>
              <p className="text-xs text-gray-500">QR / RFID / Téléphone</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
