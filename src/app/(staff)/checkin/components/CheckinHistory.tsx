'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Member } from '@/lib/db/dexie-db';
import { History, Search, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { exportToXlsx } from '@/components/ui/ImportExportButtons';
import { formatPhoneDisplay } from '@/lib/whatsapp';

export default function CheckinHistory({ members }: {
  members: Member[] | undefined;
}) {
  const [showInvestigation, setShowInvestigation] = useState(false);
  const [invDateFrom, setInvDateFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [invDateTo, setInvDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [invSearch, setInvSearch] = useState('');
  const [invFilterMode, setInvFilterMode] = useState<'name' | 'phone' | 'birthdate'>('name');
  const [invRefresh] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 100;

  useEffect(() => { setTimeout(() => setHistoryPage(1)); }, [invDateFrom, invDateTo, invSearch, invFilterMode]);

  const historyData = useLiveQuery(async () => {
    const from = new Date(invDateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(invDateTo);
    to.setHours(23, 59, 59, 999);
    const all = await db.checkins.where('timestamp').between(from, to).toArray();
    return all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [invDateFrom, invDateTo, invRefresh]);

  const exportHistory = async () => {
    const fd = new Date(invDateFrom); fd.setHours(0, 0, 0, 0);
    const td = new Date(invDateTo); td.setHours(23, 59, 59, 999);
    const data = await db.checkins.where('timestamp').between(fd, td).toArray();
    const memberMap = new Map<number, { ci: Date | null; co: Date | null }>();
    data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(c => {
      if (!memberMap.has(c.memberId)) memberMap.set(c.memberId, { ci: null, co: null });
      const entry = memberMap.get(c.memberId)!;
      const ts = new Date(c.timestamp);
      if (c.type === 'checkin' && (!entry.ci || ts > entry.ci)) entry.ci = ts;
      if (c.type === 'checkout' && (!entry.co || ts > entry.co)) entry.co = ts;
    });
    const rows: Record<string, string | number>[] = [];
    memberMap.forEach((session, memberId) => {
      const m = members?.find(mm => mm.id === memberId);
      rows.push({
        Membre: m ? `${m.lastName} ${m.firstName}` : `#${memberId}`,
        Téléphone: m?.phone || '',
        Date: session.ci ? session.ci.toLocaleDateString('fr-FR') : (session.co ? session.co.toLocaleDateString('fr-FR') : ''),
        Entrée: session.ci ? session.ci.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        Sortie: session.co ? session.co.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Durée (min)': session.ci && session.co ? Math.round((session.co.getTime() - session.ci.getTime()) / 60000) : 0,
      });
    });
    exportToXlsx(rows, `pointages_${invDateFrom}_${invDateTo}`);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Historique & Investigation</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportHistory} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowInvestigation(!showInvestigation)} className="p-2 text-gray-400 hover:text-white transition-colors">
            {showInvestigation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {showInvestigation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Du</label>
              <input type="date" value={invDateFrom} onChange={e => setInvDateFrom(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Au</label>
              <input type="date" value={invDateTo} onChange={e => setInvDateTo(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mode de recherche</label>
              <div className="flex gap-1">
                {(['name', 'phone', 'birthdate'] as const).map(m => (
                  <button key={m} onClick={() => setInvFilterMode(m)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${invFilterMode === m ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {m === 'name' ? 'Nom' : m === 'phone' ? 'Tél' : 'Date naiss.'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">{invFilterMode === 'name' ? 'Rechercher' : invFilterMode === 'phone' ? 'Téléphone' : 'Date naissance'} :</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                {invFilterMode === 'birthdate' ? (
                  <input type="date" value={invSearch} onChange={e => setInvSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
                ) : (
                  <input type="text" value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder={invFilterMode === 'name' ? 'Nom du membre...' : '05 50 00 00 11...'} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Membre</th>
                  <th className="px-3 py-2 text-left">Téléphone</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Entrée</th>
                  <th className="px-3 py-2 text-left">Sortie</th>
                  <th className="px-3 py-2 text-left">Durée</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const memberSessions: { memberId: number; ci: Date | null; co: Date | null }[] = [];
                  const map = new Map<string, { memberId: number; ci: Date | null; co: Date | null }>();
                  (historyData || []).forEach(c => {
                    const d = new Date(c.timestamp);
                    const key = `${c.memberId}_${d.toDateString()}`;
                    const entry = map.get(key) || { memberId: c.memberId, ci: null, co: null };
                    if (c.type === 'checkin' && (!entry.ci || d > entry.ci)) entry.ci = d;
                    if (c.type === 'checkout' && (!entry.co || d > entry.co)) entry.co = d;
                    map.set(key, entry);
                  });
                  map.forEach(v => memberSessions.push(v));
                  const filtered = memberSessions.filter(item => {
                    const m = members?.find(mm => mm.id === item.memberId);
                    if (!m) return false;
                    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
                    const phone = m.phone?.replace(/\s/g, '') || '';
                    const search = invSearch.toLowerCase().replace(/\s/g, '');
                    if (!search) return true;
                    if (invFilterMode === 'name') return name.includes(search);
                    if (invFilterMode === 'phone') return phone.includes(search);
                    if (invFilterMode === 'birthdate') return (m.birthDate || '').includes(search);
                    return true;
                  }).sort((a, b) => {
                    const dateA = a.ci || a.co || new Date(0);
                    const dateB = b.ci || b.co || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  });
                  if (filtered.length === 0) {
                    return <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun pointage trouvé pour cette période</td></tr>;
                  }
                  const displayedHistory = filtered.slice(0, historyPage * historyPageSize);
                  return (
                    <>
                      {displayedHistory.map(item => {
                        const m = members?.find(mm => mm.id === item.memberId);
                        const isInside = item.ci && (!item.co || item.co < item.ci);
                        const dur = item.ci && item.co ? Math.round((item.co.getTime() - item.ci.getTime()) / 60000) : (item.ci ? Math.round((Date.now() - item.ci.getTime()) / 60000) : 0);
                        const h = Math.floor(dur / 60);
                        const min = dur % 60;
                        return (
                          <tr key={`${item.memberId}_${item.ci?.getTime() || 0}`} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="px-3 py-2.5 text-sm text-white font-medium">{m ? `${m.firstName} ${m.lastName}` : `#${item.memberId}`}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-400">{m?.phone ? formatPhoneDisplay(m.phone) : '-'}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-400">{item.ci?.toLocaleDateString('fr-FR') || item.co?.toLocaleDateString('fr-FR') || '-'}</td>
                            <td className="px-3 py-2.5 text-xs text-green-400">{item.ci ? item.ci.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-3 py-2.5 text-xs text-red-400">{item.co ? item.co.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (isInside ? <span className="text-blue-400">En salle</span> : '-')}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-300">{dur > 0 ? `${h}h${min > 0 ? min + 'min' : ''}` : '-'}</td>
                            <td className="px-3 py-2.5">{isInside ? <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">En salle</span> : <span className="px-2 py-0.5 bg-gray-600/20 text-gray-400 text-[10px] rounded-full">Terminé</span>}</td>
                          </tr>
                        );
                      })}
                      {filtered.length > historyPage * historyPageSize && (
                        <tr>
                          <td colSpan={7} className="text-center py-3">
                            <button onClick={() => setHistoryPage(p => p + 1)} className="px-4 py-2 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-all border border-orange-400/20">
                              Afficher plus ({filtered.length - historyPage * historyPageSize} restants)
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{(historyData || []).length} pointages dans cette période · {new Set(historyData?.map(c => c.memberId)).size} membres distincts</p>
          </div>
        </div>
      )}
    </div>
  );
}
