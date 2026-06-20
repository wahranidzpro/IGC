'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getTurnstile, createTurnstile, updateTurnstile } from '@/lib/supabase/turnstile-service';
import { ArrowLeft, Save, Loader2, Wifi } from 'lucide-react';

const DEVICE_TYPES = ['ZKTeco', 'Hikvision', 'Dahua', 'HTTP_GENERIC'] as const;
const DIRECTIONS = ['entry', 'exit', 'bidirectional'] as const;

export default function AddTurnstilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Chargement...</div>}>
      <AddTurnstileContent />
    </Suspense>
  );
}

function AddTurnstileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    location: '',
    ip_address: '',
    port: 80,
    device_type: 'HTTP_GENERIC',
    direction: 'entry',
    is_active: true,
  });

  useEffect(() => {
    if (editId) {
      getTurnstile(parseInt(editId, 10))
        .then(t => {
          setForm({
            name: t.name,
            location: t.location,
            ip_address: t.ip_address,
            port: t.port,
            device_type: t.device_type,
            direction: t.direction,
            is_active: t.is_active,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Le nom est requis'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await updateTurnstile(parseInt(editId, 10), form);
      } else {
        await createTurnstile(form);
      }
      router.push('/turnstiles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/turnstiles" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">{editId ? 'Modifier' : 'Ajouter'} un tourniquet</h2>
          <p className="text-gray-400 text-sm">{editId ? 'Modifier la configuration' : 'Configurer un nouveau contrôleur d\'accès'}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tourniquet principal"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Emplacement</label>
            <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Entrée principale"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse IP</label>
            <input type="text" value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
              placeholder="192.168.1.100"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Port</label>
            <input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: parseInt(e.target.value) || 80 }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Type d&apos;appareil</label>
            <select value={form.device_type} onChange={e => setForm(f => ({ ...f, device_type: e.target.value as typeof DEVICE_TYPES[number] }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500">
              {DEVICE_TYPES.map(dt => <option key={dt} value={dt}>{dt === 'HTTP_GENERIC' ? 'HTTP Générique' : dt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Direction</label>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value as typeof DIRECTIONS[number] }))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500">
              {DIRECTIONS.map(d => <option key={d} value={d}>{d === 'entry' ? 'Entrée' : d === 'exit' ? 'Sortie' : 'Bidirectionnel'}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-gray-300">Tourniquet actif</span>
        </div>
      </div>

      {/* Webhook URL display */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">URL du Webhook</h3>
        </div>
        <p className="text-xs text-gray-400 mb-2">Configurez votre tourniquet pour envoyer les requêtes POST à cette URL :</p>
        <code className="block px-4 py-3 bg-gray-800 rounded-xl text-sm text-blue-300 font-mono break-all">
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'VOTRE_URL_SUPABASE'}/functions/v1/turnstile-access
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Headers requis : <code className="text-orange-400">Content-Type: application/json</code> · <code className="text-orange-400">X-Device-Id: {editId || 'ID_DU_TOURNIQUET'}</code>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-white font-medium transition-all cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Ajouter le tourniquet'}
        </button>
        <Link href="/turnstiles" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-colors">
          Annuler
        </Link>
      </div>
    </div>
  );
}
