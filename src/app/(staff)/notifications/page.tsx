'use client';

import { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Member } from '@/lib/db/dexie-db';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { getTemplate, sendWhatsApp, MessageTemplate, formatPhoneDisplay } from '@/lib/whatsapp';
import { MessageSquare, AlertTriangle, Search, X, CheckCircle, Send, Bell, CalendarClock, UserX, Upload } from 'lucide-react';
import { ImportExportButtons, exportToXlsx } from '@/components/ui/ImportExportButtons';
import Link from 'next/link';

const templates: { key: MessageTemplate; label: string; desc: string; icon: string }[] = [
  { key: 'renewal_reminder', label: 'Rappel de renouvellement', desc: 'Avertir un adhérent dont l\'abonnement expire bientôt', icon: '⏰' },
  { key: 'expired', label: 'Abonnement expiré', desc: 'Relancer un adhérent dont l\'abonnement est terminé', icon: '❌' },
  { key: 'welcome', label: 'Bienvenue', desc: 'Message envoyé après inscription', icon: '👋' },
  { key: 'receipt', label: 'Reçu de paiement', desc: 'Confirmer un paiement reçu', icon: '🧾' },
];

function getEndDate(m: Member): Date {
  const map: Record<string, number> = { '1_mois': 30, '2_mois': 60, '3_mois': 90, '6_mois': 180, '12_mois': 365 };
  const days = map[m.subscriptionDuration] || 30;
  const end = new Date(m.createdAt);
  end.setDate(end.getDate() + days);
  return end;
}

function getDaysLeft(m: Member): number {
  return Math.ceil((getEndDate(m).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function NotificationsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>('renewal_reminder');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'renewal' | 'expired'>('all');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = useLiveQuery(() => db.members.toArray(), []);

  const renewalMembers = useMemo(() => {
    if (!members) return [];
    return members.filter(m => {
      if (m.status !== 'active') return false;
      const left = getDaysLeft(m);
      return left >= 0 && left <= 7;
    }).sort((a, b) => getDaysLeft(a) - getDaysLeft(b));
  }, [members]);

  const expiredMembers = useMemo(() => {
    if (!members) return [];
    const now = new Date();
    return members.filter(m => {
      if (m.status !== 'expired' || !m.updatedAt) return false;
      const diff = Math.floor((now.getTime() - new Date(m.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 2;
    });
  }, [members]);

  const notificationCount = renewalMembers.length + expiredMembers.length;

  const filtered = members?.filter(m => {
    const q = searchTerm.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const statusMatch = filterStatus === 'all' || m.status === filterStatus;
    const searchMatch = name.includes(q) || m.phone.includes(q);
    return statusMatch && searchMatch && m.phone;
  }) || [];

  const toggleMember = (id: number) => {
    const next = new Set(selectedMembers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedMembers(next);
  };

  const selectAll = () => {
    if (selectedMembers.size === filtered.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filtered.map(m => m.id!)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          <p className="text-gray-400 mt-1">Alertes de renouvellement et membres expirés</p>
        </div>
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'Toutes', count: notificationCount },
          { key: 'renewal' as const, label: 'Renouvellement', count: renewalMembers.length },
          { key: 'expired' as const, label: 'Expirés', count: expiredMembers.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Renewal section */}
      {(activeTab === 'all' || activeTab === 'renewal') && renewalMembers.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CalendarClock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-400">
              Renouvellement imminent — {renewalMembers.length} abonnement(s) expirent dans 7 jours
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {renewalMembers.map(m => {
              const left = getDaysLeft(m);
              return (
                <div key={m.id} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg">
                  <div>
                    <p className="text-sm text-white font-medium">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-400">{formatPhoneDisplay(m.phone)}</p>
                    <p className="text-xs text-yellow-400">{left} jour{left > 1 ? 's' : ''} restant{left > 1 ? 's' : ''}</p>
                  </div>
                    <WhatsAppButton
                    phone={m.phone}
                    template="renewal_reminder"
                    data={{ name: `${m.firstName} ${m.lastName}`, days: String(left) }}
                    size="sm"
                    label="Rappeler"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired section */}
      {(activeTab === 'all' || activeTab === 'expired') && expiredMembers.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <UserX className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">
              Abonnements expirés — {expiredMembers.length} membre(s) récemment expiré(s)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiredMembers.map(m => {
              const daysSince = m.updatedAt ? Math.floor((Date.now() - new Date(m.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <div key={m.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg">
                  <div>
                    <p className="text-sm text-white font-medium">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-400">{formatPhoneDisplay(m.phone)}</p>
                    <p className="text-xs text-red-400">Expiré depuis {daysSince} jour{daysSince > 1 ? 's' : ''}</p>
                  </div>
                  <WhatsAppButton
                    phone={m.phone}
                    template="expired"
                    data={{ name: `${m.firstName} ${m.lastName}` }}
                    size="sm"
                    label="Relancer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {notificationCount === 0 && (activeTab === 'all' || (activeTab === 'renewal' && renewalMembers.length === 0) || (activeTab === 'expired' && expiredMembers.length === 0)) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucune notification pour le moment</p>
          <p className="text-gray-500 text-sm mt-1">Tous les abonnements sont à jour</p>
        </div>
      )}

      {/* WhatsApp Campaign Tools */}
      <div className="border-t border-gray-800 pt-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Campagne WhatsApp</h3>
            <p className="text-gray-400 text-sm mt-1">Envoyez des messages personnalisés à vos adhérents</p>
          </div>
          <ImportExportButtons
            onExport={() => exportToXlsx(filtered.map(({ id, ...rest }) => rest), 'membres-notifications')}
            onImport={() => fileInputRef.current?.click()}
          />
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const XLSX = await import('xlsx');
              const data = await file.arrayBuffer();
              const workbook = XLSX.read(data, { type: 'array' });
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
              const phones = new Set(rows.map(r => String(r.phone || r.téléphone || r.Téléphone || r.tel || '').replace(/[^0-9]/g, '')));
              const matched = members?.filter(m => phones.has(m.phone)) || [];
              if (matched.length === 0) { alert('Aucun membre trouvé dans le fichier.'); return; }
              setSelectedMembers(new Set(matched.map(m => m.id!)));
            } catch { alert('Erreur de lecture du fichier.'); }
            e.target.value = '';
          }} />
        </div>

        {/* Templates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map(t => (
            <button key={t.key} onClick={() => setSelectedTemplate(t.key)} className={`text-left p-4 rounded-xl border transition-all ${selectedTemplate === t.key ? 'bg-green-500/10 border-green-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
              <span className="text-2xl">{t.icon}</span>
              <h3 className="text-sm font-semibold text-white mt-2">{t.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Template preview */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Aperçu du message</span>
          </div>
          <p className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg">
            {getTemplate(selectedTemplate, { name: '[Prénom Nom]', days: 5, amount: 5000, type: 'subscription' })}
          </p>
          <p className="text-xs text-gray-500 mt-2">Les messages s'ouvrent dans WhatsApp. Appuyez sur Envoyer pour confirmer.</p>
        </div>

        {/* Expiring alert */}
        {renewalMembers.length > 0 && selectedTemplate === 'renewal_reminder' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-yellow-400">{renewalMembers.length} abonnement(s) proches expiration</span>
            </div>
            <button onClick={() => setSelectedMembers(new Set(renewalMembers.map(m => m.id!)))} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30">Tout sélectionner</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un membre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
          </div>
          {(['all', 'active', 'expired', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : s === 'expired' ? 'Expirés' : 'Inactifs'}
            </button>
          ))}
        </div>

        {/* Members list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selectedMembers.size === filtered.length} onChange={selectAll} className="accent-orange-500" />
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Membre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Téléphone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Statut</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucun membre avec numéro de téléphone</td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedMembers.has(m.id!)} onChange={() => toggleMember(m.id!)} className="accent-orange-500" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{m.firstName} {m.lastName}</p>
                      {m.status === 'active' && selectedTemplate === 'renewal_reminder' && (() => {
                        const left = getDaysLeft(m);
                        return left <= 7 ? <p className="text-xs text-yellow-400">{left}j restants</p> : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatPhoneDisplay(m.phone)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-green-500/20 text-green-400' : m.status === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {m.status === 'active' ? 'Actif' : m.status === 'expired' ? 'Expiré' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <WhatsAppButton
                        phone={m.phone}
                        template={selectedTemplate}
                        data={{
                          name: `${m.firstName} ${m.lastName}`,
                          days: String(selectedTemplate === 'renewal_reminder' ? getDaysLeft(m) : ''),
                        }}
                        size="md"
                        label="Envoyer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk send bar */}
        {selectedMembers.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 border border-green-500/30 rounded-xl px-6 py-3 shadow-2xl flex items-center gap-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm">{sending ? `Envoi... (${sentCount}/${selectedMembers.size})` : `${selectedMembers.size} membre(s) sélectionné(s)`}</span>
              <button
                disabled={sending}
                onClick={async () => {
                  setSending(true);
                  setSentCount(0);
                  const selected = members?.filter(m => selectedMembers.has(m.id!)) || [];
                  for (const m of selected) {
                    const message = getTemplate(selectedTemplate, {
                      name: `${m.firstName} ${m.lastName}`,
                      days: String(selectedTemplate === 'renewal_reminder' ? getDaysLeft(m) : ''),
                    });
                    sendWhatsApp(m.phone, message);
                    await db.whatsappCampaigns.add({
                      template: selectedTemplate, memberId: m.id!, memberName: `${m.firstName} ${m.lastName}`,
                      phone: m.phone, message, status: 'sent', createdAt: new Date(), syncStatus: 'pending',
                    });
                    setSentCount(prev => prev + 1);
                  }
                  setSelectedMembers(new Set());
                  setSending(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${sending ? 'bg-gray-600 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                <Send className="w-4 h-4" /> {sending ? 'Envoi en cours...' : 'Envoyer à tous'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
