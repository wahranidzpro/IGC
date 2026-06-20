'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Monitor, Wifi, Terminal, CheckCircle, ArrowRight, Smartphone } from 'lucide-react';
import { useState } from 'react';

export default function InstallBridgePage() {
  const [selectedOS, setSelectedOS] = useState<'windows' | 'macos' | 'linux'>('windows');

  const downloads = {
    windows: { url: '#', label: 'LovableBridge-windows.exe', icon: '🪟' },
    macos: { url: '#', label: 'LovableBridge-mac.dmg', icon: '🍎' },
    linux: { url: '#', label: 'LovableBridge-linux.AppImage', icon: '🐧' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/turnstiles" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Installation du Bridge</h2>
          <p className="text-gray-400 text-sm">Connecter un tourniquet physique au système Infinity Gym</p>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Architecture de connexion</h3>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Monitor className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-300 font-medium">Bridge PC</p>
            <p className="text-gray-500">App locale</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-300 font-medium">Internet</p>
            <p className="text-gray-500">Supabase</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Terminal className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-gray-300 font-medium">Edge Function</p>
            <p className="text-gray-500">Validation</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-300 font-medium">Tourniquet</p>
            <p className="text-gray-500">ZKTeco/Hikvision</p>
          </div>
        </div>
      </div>

      {/* Step by step */}
      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
            <h3 className="text-lg font-semibold text-white">Télécharger le Bridge</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Téléchargez l&apos;application Bridge pour le système d&apos;exploitation du PC qui restera allumé en permanence à proximité du tourniquet.</p>
          
          <div className="flex gap-2 mb-4">
            {(['windows', 'macos', 'linux'] as const).map(os => (
              <button key={os} onClick={() => setSelectedOS(os)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  selectedOS === os
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {os === 'windows' ? '🪟 Windows' : os === 'macos' ? '🍎 macOS' : '🐧 Linux'}
              </button>
            ))}
          </div>

          <a href={downloads[selectedOS].url}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-all cursor-pointer">
            <Download className="w-5 h-5" />
            Télécharger {downloads[selectedOS].label}
          </a>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">2</div>
            <h3 className="text-lg font-semibold text-white">Lancer l&apos;application</h3>
          </div>
          <p className="text-sm text-gray-400">Exécutez le fichier téléchargé. L&apos;application Bridge s&apos;ouvrira automatiquement dans votre navigateur par défaut à l&apos;adresse :</p>
          <code className="block mt-2 px-4 py-2 bg-gray-800 rounded-lg text-sm text-green-300 font-mono w-fit">http://localhost:5173</code>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">3</div>
            <h3 className="text-lg font-semibold text-white">Connecter le tourniquet</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-400">
            <p>1. Connectez-vous avec un compte <strong className="text-white">administrateur</strong></p>
            <p>2. Cliquez sur <strong className="text-white">&quot;Ajouter un appareil&quot;</strong></p>
            <p>3. Saisissez l&apos;<strong className="text-white">adresse IP</strong> du tourniquet (ex: 192.168.1.100)</p>
            <p>4. Entrez le <strong className="text-white">port</strong> de communication (défaut: 80 pour HTTP, 4370 pour ZKTeco)</p>
            <p>5. Sélectionnez le <strong className="text-white">type d&apos;appareil</strong> (ZKTeco, Hikvision, Dahua, HTTP)</p>
            <p>6. Cliquez sur <strong className="text-white">&quot;Confirmer le pairage&quot;</strong></p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">4</div>
            <h3 className="text-lg font-semibold text-white">Configuration du webhook</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">Le Bridge configurera automatiquement le webhook. Vérifiez que l&apos;URL de destination est correcte :</p>
          <code className="block px-4 py-3 bg-gray-800 rounded-xl text-sm text-blue-300 font-mono break-all mb-3">
            {process.env.NEXT_PUBLIC_SUPABASE_URL || 'VOTRE_URL_SUPABASE'}/functions/v1/turnstile-access
          </code>
          <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Headers requis :</p>
            <p><code className="text-orange-400">Content-Type: application/json</code></p>
            <p><code className="text-orange-400">X-Device-Id</code> : l&apos;ID du tourniquet (UUID)</p>
            <p><code className="text-orange-400">X-Signature</code> : HMAC-SHA256 optionnel pour sécuriser</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">5</div>
            <h3 className="text-lg font-semibold text-white">Test et vérification</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Présentez un badge RFID ou QR code au tourniquet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Vérifiez le statut dans <Link href="/turnstiles/logs" className="text-orange-400 hover:text-orange-300">Journaux d&apos;accès</Link></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Le statut &quot;allowed&quot; confirme que le système fonctionne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm">
        <h3 className="font-semibold text-white mb-2">Prérequis techniques</h3>
        <ul className="space-y-1 text-gray-400">
          <li>• PC sous Windows 10+, macOS 12+ ou Linux (Ubuntu 20.04+)</li>
          <li>• Connexion Internet stable</li>
          <li>• Le PC doit rester allumé en permanence (ou utiliser un Raspberry Pi)</li>
          <li>• Accès réseau au tourniquet (même VLAN ou passerelle)</li>
          <li>• Compte administrateur Infinity Gym pour le pairage</li>
        </ul>
      </div>

      {/* Alternative: No Bridge */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-5 h-5 text-orange-400" />
          <h3 className="font-semibold text-white">Configuration directe (sans Bridge)</h3>
        </div>
        <p className="text-gray-400 mb-2">Si votre tourniquet supporte les webhooks HTTP sortants, configurez-le directement :</p>
        <code className="block px-4 py-2 bg-gray-800 rounded-lg text-xs text-blue-300 font-mono break-all">
          POST {process.env.NEXT_PUBLIC_SUPABASE_URL || 'VOTRE_URL_SUPABASE'}/functions/v1/turnstile-access
        </code>
        <p className="text-xs text-gray-500 mt-2">Payload attendu : <code className="text-gray-300">{'{"cardno": "RFID_UID", "device_id": "TURNSTILE_ID", "method": "rfid"}'}</code></p>
      </div>
    </div>
  );
}
