'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/dexie-db';
import { detectOrphanMembers } from '@/lib/audit/checks/orphan-members';
import type { OrphanMemberIssue } from '@/lib/audit/checks/orphan-members';
import { detectOrphanPayments, cleanupOrphanPayments } from '@/lib/audit/checks/orphan-payments';
import type { OrphanPaymentIssue } from '@/lib/audit/checks/orphan-payments';
import { detectExpiredSubscriptions, fixExpiredSubscriptions } from '@/lib/audit/checks/expired-subscriptions';
import type { ExpiredSubscriptionIssue } from '@/lib/audit/checks/expired-subscriptions';
import { detectDuplicates } from '@/lib/audit/checks/duplicates';
import type { DuplicateIssue } from '@/lib/audit/checks/duplicates';
import { detectStockIssues } from '@/lib/audit/checks/stock-audit';
import type { StockIssue } from '@/lib/audit/checks/stock-audit';
import { detectAttendanceIssues } from '@/lib/audit/checks/attendance-audit';
import type { AttendanceIssue } from '@/lib/audit/checks/attendance-audit';
import { detectBillingIssues, reconcileMemberBalance } from '@/lib/audit/checks/billing-audit';
import type { BillingIssue } from '@/lib/audit/checks/billing-audit';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ChevronDown, ChevronRight, DollarSign,
  Package, Clock, Trash2, Merge, UserX
} from 'lucide-react';

type CategoryStatus = 'pass' | 'fail' | 'warning';

interface CategoryData {
  id: string;
  label: string;
  icon: React.ReactNode;
  issues: unknown[];
  status: CategoryStatus;
  checks: { label: string; count: number; severity: 'error' | 'warning' | 'info' }[];
}

export default function DataHealthPage() {
  const { role } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (role && role !== 'admin') router.replace('/dashboard');
  }, [role, router]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [fixing, setFixing] = useState<string | null>(null);

  if (role && role !== 'admin') return null;

  const runAllChecks = async () => {
    setLoading(true);
    setStatus('Exécution de tous les audits...');
    setCategories([]);

    try {
      const [
        orphanMembers,
        orphanPayments,
        expired,
        duplicates,
        stock,
        attendance,
        billing,
      ] = await Promise.all([
        detectOrphanMembers().catch(() => [] as OrphanMemberIssue[]),
        detectOrphanPayments().catch(() => [] as OrphanPaymentIssue[]),
        detectExpiredSubscriptions().catch(() => [] as ExpiredSubscriptionIssue[]),
        detectDuplicates().catch(() => [] as DuplicateIssue[]),
        detectStockIssues().catch(() => [] as StockIssue[]),
        detectAttendanceIssues().catch(() => [] as AttendanceIssue[]),
        detectBillingIssues().catch(() => [] as BillingIssue[]),
      ]);

      const results: CategoryData[] = [
        {
          id: 'orphans',
          label: 'ORPHELINS',
          icon: <UserX className="w-5 h-5" />,
          issues: [...orphanMembers, ...orphanPayments],
          status: orphanMembers.length + orphanPayments.length > 0 ? 'warning' : 'pass',
          checks: [
            { label: 'Membres orphelins', count: orphanMembers.length, severity: orphanMembers.length > 0 ? 'error' : 'info' },
            { label: 'Paiements orphelins', count: orphanPayments.length, severity: orphanPayments.length > 0 ? 'error' : 'info' },
          ],
        },
        {
          id: 'subscriptions',
          label: 'ABONNEMENTS',
          icon: <Shield className="w-5 h-5" />,
          issues: expired,
          status: expired.length > 0 ? 'warning' : 'pass',
          checks: [
            { label: 'Expirés non marqués', count: expired.filter(e => e.type === 'expired_not_marked').length, severity: expired.filter(e => e.type === 'expired_not_marked').length > 0 ? 'error' : 'info' },
            { label: 'Auto-fixable', count: expired.filter(e => e.type === 'auto_fixable').length, severity: expired.filter(e => e.type === 'auto_fixable').length > 0 ? 'warning' : 'info' },
          ],
        },
        {
          id: 'duplicates',
          label: 'DOUBLONS',
          icon: <Merge className="w-5 h-5" />,
          issues: duplicates,
          status: duplicates.length > 0 ? 'fail' : 'pass',
          checks: [
            { label: 'Téléphones en double', count: duplicates.filter(d => d.type === 'duplicate_phone').length, severity: duplicates.filter(d => d.type === 'duplicate_phone').length > 0 ? 'error' : 'info' },
            { label: 'Emails en double', count: duplicates.filter(d => d.type === 'duplicate_email').length, severity: duplicates.filter(d => d.type === 'duplicate_email').length > 0 ? 'warning' : 'info' },
            { label: 'RFID en double', count: duplicates.filter(d => d.type === 'duplicate_rfid').length, severity: duplicates.filter(d => d.type === 'duplicate_rfid').length > 0 ? 'error' : 'info' },
          ],
        },
        {
          id: 'stock',
          label: 'STOCK',
          icon: <Package className="w-5 h-5" />,
          issues: stock,
          status: stock.length > 0 ? 'warning' : 'pass',
          checks: [
            { label: 'Produits avec anomalies', count: stock.length, severity: stock.length > 0 ? 'warning' : 'info' },
          ],
        },
        {
          id: 'attendance',
          label: 'PRÉSENCE',
          icon: <Clock className="w-5 h-5" />,
          issues: attendance,
          status: attendance.length > 0 ? 'warning' : 'pass',
          checks: [
            { label: 'Checkouts orphelins', count: attendance.filter(a => a.type === 'orphan_checkout').length, severity: attendance.filter(a => a.type === 'orphan_checkout').length > 0 ? 'warning' : 'info' },
            { label: 'Checkins sans checkout', count: attendance.filter(a => a.type === 'missing_checkout').length, severity: attendance.filter(a => a.type === 'missing_checkout').length > 0 ? 'warning' : 'info' },
          ],
        },
        {
          id: 'billing',
          label: 'FACTURATION',
          icon: <DollarSign className="w-5 h-5" />,
          issues: billing,
          status: billing.length > 0 ? 'fail' : 'pass',
          checks: [
            { label: 'Actifs sans paiement récent', count: billing.filter(b => b.type === 'active_no_recent_payment').length, severity: billing.filter(b => b.type === 'active_no_recent_payment').length > 0 ? 'error' : 'info' },
            { label: 'Montant incohérent', count: billing.filter(b => b.type === 'amount_mismatch').length, severity: billing.filter(b => b.type === 'amount_mismatch').length > 0 ? 'warning' : 'info' },
            { label: 'Solde négatif', count: billing.filter(b => b.type === 'negative_balance').length, severity: billing.filter(b => b.type === 'negative_balance').length > 0 ? 'error' : 'info' },
          ],
        },
        {
          id: 'deletion',
          label: 'IMPACT SUPPRESSION',
          icon: <Trash2 className="w-5 h-5" />,
          issues: [],
          status: 'pass',
          checks: [
            { label: 'Analyse avant suppression', count: 0, severity: 'info' },
          ],
        },
      ];

      setCategories(results);
      const totalIssues = results.reduce((s, c) => s + c.issues.length, 0);
      const failed = results.filter(r => r.status === 'fail').length;
      const warnings = results.filter(r => r.status === 'warning').length;
      setStatus(`${totalIssues} problème(s) · ${failed} catégorie(s) critique(s) · ${warnings} avertissement(s)`);
    } catch (err) {
      setStatus('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
    setLoading(false);
  };

  const handleFixExpired = async () => {
    setFixing('subscriptions');
    try {
      const { fixed, errors } = await fixExpiredSubscriptions();
      setStatus(`Abonnements corrigés: ${fixed} mis à jour${errors.length ? `, ${errors.length} erreur(s)` : ''}`);
      await runAllChecks();
    } catch (err) {
      setStatus('Erreur correction: ' + (err instanceof Error ? err.message : ''));
    }
    setFixing(null);
  };

  const handleCleanupOrphans = async () => {
    setFixing('orphans');
    try {
      const deleted = await cleanupOrphanPayments();
      setStatus(`Nettoyage terminé: ${deleted} paiements orphelins supprimés`);
      await runAllChecks();
    } catch (err) {
      setStatus('Erreur nettoyage: ' + (err instanceof Error ? err.message : ''));
    }
    setFixing(null);
  };

  const handleReconcileAll = async () => {
    setFixing('billing');
    try {
      const members = await db.members.toArray();
      let count = 0;
      for (const m of members) {
        if (m.balanceDue > 0 || m.balanceDue < 0) {
          await reconcileMemberBalance(m.id!);
          count++;
        }
      }
      setStatus(`${count} soldes membre(s) reconciliés`);
      await runAllChecks();
    } catch (err) {
      setStatus('Erreur réconciliation: ' + (err instanceof Error ? err.message : ''));
    }
    setFixing(null);
  };

  const statusIcon = (cat: CategoryData) => {
    if (cat.status === 'pass') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (cat.status === 'fail') return <XCircle className="w-5 h-5 text-red-400" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };

  const severityDot = (severity: 'error' | 'warning' | 'info') => {
    if (severity === 'error') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block flex-shrink-0" />;
    if (severity === 'warning') return <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block flex-shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />;
  };

  const totalIssues = categories.reduce((s, c) => s + c.issues.length, 0);
  const passed = categories.filter(c => c.status === 'pass').length;
  const failed = categories.filter(c => c.status === 'fail').length;
  const warned = categories.filter(c => c.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-orange-400" />
            Data Health Check
          </h2>
          <p className="text-gray-400 mt-1">Tableau de bord unifié de l&apos;intégrité des données</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{status || 'Prêt'}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={runAllChecks}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyse...' : 'Lancer tous les audits'}
        </button>
      </div>

      {categories.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-4 md:p-6 rounded-2xl">
              <p className="text-xs text-gray-500 mb-1">Total problèmes</p>
              <p className="text-2xl font-bold text-white">{totalIssues}</p>
            </div>
            <div className="glass p-4 md:p-6 rounded-2xl">
              <p className="text-xs text-gray-500 mb-1">Catégories OK</p>
              <p className="text-2xl font-bold text-green-400">{passed}</p>
            </div>
            <div className="glass p-4 md:p-6 rounded-2xl">
              <p className="text-xs text-gray-500 mb-1">Avertissements</p>
              <p className="text-2xl font-bold text-yellow-400">{warned}</p>
            </div>
            <div className="glass p-4 md:p-6 rounded-2xl">
              <p className="text-xs text-gray-500 mb-1">Critiques</p>
              <p className="text-2xl font-bold text-red-400">{failed}</p>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="glass rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer text-left"
                >
                  {expandedCategory === cat.id
                    ? <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    : <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  }
                  {statusIcon(cat)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span className="font-semibold text-white text-sm">{cat.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {cat.checks.map((c, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs">
                          {severityDot(c.severity)}
                          <span className={c.count > 0 ? 'text-gray-300' : 'text-gray-600'}>
                            {c.label}: {c.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cat.id === 'subscriptions' && cat.issues.length > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleFixExpired(); }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {fixing === 'subscriptions' ? 'Correction...' : 'Corriger'}
                      </span>
                    )}
                    {cat.id === 'orphans' && cat.issues.length > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleCleanupOrphans(); }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {fixing === 'orphans' ? 'Nettoyage...' : 'Nettoyer'}
                      </span>
                    )}
                    {cat.id === 'billing' && cat.issues.length > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleReconcileAll(); }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {fixing === 'billing' ? 'Réconciliation...' : 'Réconcilier'}
                      </span>
                    )}
                  </div>
                </button>

                {expandedCategory === cat.id && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-4 space-y-2">
                    {cat.issues.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm py-2">
                        <CheckCircle className="w-4 h-4" />
                        Aucun problème détecté
                      </div>
                    ) : (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (cat.issues as Record<string, any>[]).map((issue, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 glass-light rounded-lg">
                          {issue.type === 'orphan_member' || issue.type === 'orphan_payment' || issue.type === 'expired_not_marked' || issue.type === 'active_no_recent_payment' || issue.type === 'negative_balance' || issue.type === 'duplicate_phone' || issue.type === 'duplicate_rfid'
                            ? <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            : <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                              {issue.memberName || issue.productName || issue.value || `#${issue.memberId}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{issue.detail}</p>
                            {issue.type?.startsWith('duplicate') && issue.memberIds && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {issue.memberNames?.map((name: string, j: number) => (
                                  <span key={j} className="text-xs px-2 py-0.5 glass-light text-[#A8B2C7] rounded">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {cat.id === 'deletion' && (
                      <div className="text-sm text-gray-400 py-2 space-y-2">
                        <p>Analyse d&apos;impact avant suppression d&apos;une entité:</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-2 glass-light text-[#A8B2C7] rounded-lg text-xs">Membre</span>
                          <span className="px-3 py-2 glass-light text-[#A8B2C7] rounded-lg text-xs">Coach</span>
                          <span className="px-3 py-2 glass-light text-[#A8B2C7] rounded-lg text-xs">Produit</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
