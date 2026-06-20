'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { logAudit } from '@/lib/audit';
import { useRouter } from 'next/navigation';
import { Gift, Settings, Save, TrendingUp, TrendingDown, Users, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { getLoyaltyConfig, saveLoyaltyConfig, type LoyaltyConfig } from '@/lib/loyalty';

export default function LoyaltyPage() {
  const { role, user } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<LoyaltyConfig>({
    earnRateDzd: 100,
    earnRatePoints: 1,
    redemptionEnabled: true,
    redemptionRatePoints: 100,
    redemptionRateDzd: 10,
    redemptionMaxPercent: 50,
    posRedemptionEnabled: true,
    subscriptionRedemptionEnabled: true,
    earlyPaymentBonusEnabled: true,
    earlyPaymentMinAmount: 5000,
    earlyPaymentBonusPercent: 10,
    earlyPaymentMinMonths: 3,
    posDiscountMaxPercent: 30,
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'ledger'>('settings');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPage, setLedgerPage] = useState(0);
  const ledgerPageSize = 20;

  useEffect(() => {
    getLoyaltyConfig().then(setConfig);
  }, []);

  const allLedger = useLiveQuery(() => db.pointsLedger.orderBy('createdAt').reverse().toArray(), []);
  const members = useLiveQuery(() => db.members.toArray(), []);

  if (role !== 'admin') {
    router.push('/');
    return null;
  }

  const filteredLedger = allLedger?.filter(entry => {
    if (!ledgerSearch) return true;
    const q = ledgerSearch.toLowerCase();
    return entry.memberName.toLowerCase().includes(q) || entry.reason.toLowerCase().includes(q);
  }) || [];

  const totalPages = Math.ceil(filteredLedger.length / ledgerPageSize);
  const paginatedLedger = filteredLedger.slice(ledgerPage * ledgerPageSize, (ledgerPage + 1) * ledgerPageSize);

  const handleSave = async () => {
    await saveLoyaltyConfig(config);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logAudit({ action: 'settings_change', newValue: 'Configuration fidélité mise à jour' }, (user as any)?.username || 'unknown', role || 'unknown');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalPoints = members?.reduce((sum, m) => sum + (m.fidelityPoints || 0), 0) || 0;
  const membersWithPoints = members?.filter(m => (m.fidelityPoints || 0) > 0).length || 0;



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift className="w-7 h-7 text-orange-400" />
            FIDELITE & POINTS
          </h2>
          <p className="text-gray-400 mt-1">Configuration du programme de fidelite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20"><TrendingUp className="w-5 h-5 text-orange-400" /></div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Points Total</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20"><Users className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Membres avec Points</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{membersWithPoints}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20"><Gift className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Taux Acquisition</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{config.earnRateDzd} DA = {config.earnRatePoints} pt</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          <Settings className="w-4 h-4 inline mr-2" />
          PARAMETRES
        </button>
        <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ledger' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          <TrendingUp className="w-4 h-4 inline mr-2" />
          HISTORIQUE ({filteredLedger.length})
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              ACQUISITION DE POINTS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Montant pour 1 point (DA)
                </label>
                <input
                  type="number"
                  value={config.earnRateDzd}
                  onChange={e => setConfig({ ...config, earnRateDzd: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ex: 100 DA depenses = 1 point</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Points gagnes par tranche
                </label>
                <input
                  type="number"
                  value={config.earnRatePoints}
                  onChange={e => setConfig({ ...config, earnRatePoints: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Points attribues par tranche atteinte</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-400" />
              UTILISATION DES POINTS
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--input-bg)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text)' }}>Activer l&apos;echange de points</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Permettre aux membres d&apos;utiliser leurs points</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, redemptionEnabled: !config.redemptionEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.redemptionEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.redemptionEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Points pour echange
                  </label>
                  <input
                    type="number"
                    value={config.redemptionRatePoints}
                    onChange={e => setConfig({ ...config, redemptionRatePoints: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ex: 100 points = X DA de reduction</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Valeur de reduction (DA)
                  </label>
                  <input
                    type="number"
                    value={config.redemptionRateDzd}
                    onChange={e => setConfig({ ...config, redemptionRateDzd: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Reduction obtenue pour le nombre de points ci-dessus</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Reduction maximale (% du total)
                </label>
                <input
                  type="number"
                  value={config.redemptionMaxPercent}
                  onChange={e => setConfig({ ...config, redemptionMaxPercent: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 max-w-xs"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ex: 50% = reduction max de la moitie du prix</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--input-bg)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text)' }}>Echange pour abonnements</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Utiliser les points sur les abonnements</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, subscriptionRedemptionEnabled: !config.subscriptionRedemptionEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.subscriptionRedemptionEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.subscriptionRedemptionEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--input-bg)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text)' }}>Echange pour POS</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Utiliser les points au point de vente</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, posRedemptionEnabled: !config.posRedemptionEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.posRedemptionEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.posRedemptionEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              BONUS PAIEMENT ANTICIPÉ
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--input-bg)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text)' }}>Activer le bonus</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Points bonus pour paiements anticipés</p>
                </div>
                <button onClick={() => setConfig({ ...config, earlyPaymentBonusEnabled: !config.earlyPaymentBonusEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.earlyPaymentBonusEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.earlyPaymentBonusEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Montant minimum (DA)</label>
                  <input type="number" value={config.earlyPaymentMinAmount} onChange={e => setConfig({ ...config, earlyPaymentMinAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Bonus (%)</label>
                  <input type="number" value={config.earlyPaymentBonusPercent} onChange={e => setConfig({ ...config, earlyPaymentBonusPercent: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Mois minimum</label>
                  <input type="number" value={config.earlyPaymentMinMonths} onChange={e => setConfig({ ...config, earlyPaymentMinMonths: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="w-5 h-5" />
              {saved ? 'SAUVEGARDE !' : 'SAUVEGARDER'}
            </button>
            {saved && <span className="text-green-400 text-sm">Parametres mis a jour avec succes</span>}
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={ledgerSearch}
                onChange={e => { setLedgerSearch(e.target.value); setLedgerPage(0); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)', borderWidth: 1 }}
              />
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderWidth: 1 }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>DATE</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>MEMBRE</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>TYPE</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>POINTS</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>SOLDE APRES</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>RAISON</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedger.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Aucune operation</td></tr>
                ) : (
                  paginatedLedger.map(entry => (
                    <tr key={entry.id} style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{entry.memberName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.type === 'earn' ? 'bg-green-500/20 text-green-400' :
                          entry.type === 'spend' ? 'bg-red-500/20 text-red-400' :
                          entry.type === 'adjust' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {entry.type === 'earn' ? 'GAIN' : entry.type === 'spend' ? 'UTILISATION' : entry.type === 'adjust' ? 'AJUSTEMENT' : 'EXPIRATION'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${entry.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.points > 0 ? '+' : ''}{entry.points}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{entry.balanceAfter}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{entry.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {ledgerPage * ledgerPageSize + 1}-{Math.min((ledgerPage + 1) * ledgerPageSize, filteredLedger.length)} sur {filteredLedger.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLedgerPage(p => Math.max(0, p - 1))}
                  disabled={ledgerPage === 0}
                  className="p-2 rounded-lg disabled:opacity-50"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', borderWidth: 1 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLedgerPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={ledgerPage >= totalPages - 1}
                  className="p-2 rounded-lg disabled:opacity-50"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', borderWidth: 1 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
