'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { Shield, Search, AlertTriangle, Clock, User, FileText, Download } from 'lucide-react';
import { ACTION_LABELS, detectSuspicious } from '@/lib/audit';
import PaginationControls from '@/components/ui/PaginationControls';
import * as XLSX from 'xlsx';

export default function AuditPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const allLogs = useLiveQuery(() => db.auditLogs.orderBy('createdAt').reverse().toArray(), []);

  const filteredLogs = useMemo(() => {
    if (!allLogs) return [];
    return allLogs.filter(log => {
      if (suspiciousOnly && !log.isSuspicious) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (userFilter !== 'all' && log.performedBy !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const memberName = log.memberName?.toLowerCase() || '';
        const performedBy = log.performedBy.toLowerCase();
        const action = ACTION_LABELS[log.action]?.toLowerCase() || '';
        const reason = log.reason?.toLowerCase() || '';
        const oldVal = log.oldValue?.toLowerCase() || '';
        const newVal = log.newValue?.toLowerCase() || '';
        if (!memberName.includes(q) && !performedBy.includes(q) && !action.includes(q) && !reason.includes(q) && !oldVal.includes(q) && !newVal.includes(q)) return false;
      }
      return true;
    });
  }, [allLogs, search, actionFilter, userFilter, suspiciousOnly]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE)), [filteredLogs.length]);

  const safeCurrentPage = useMemo(() => Math.min(currentPage, totalPages), [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, safeCurrentPage, PAGE_SIZE]);

  const uniqueUsers = useMemo(() => {
    if (!allLogs) return [];
    return [...new Set(allLogs.map(l => l.performedBy))];
  }, [allLogs]);

  const stats = useMemo(() => {
    if (!allLogs) return { total: 0, suspicious: 0, today: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: allLogs.length,
      suspicious: allLogs.filter(l => l.isSuspicious).length,
      today: allLogs.filter(l => new Date(l.createdAt) >= today).length,
    };
  }, [allLogs]);

  if (role !== 'admin') {
    router.push('/');
    return null;
  }

  const exportLogs = () => {
    const data = filteredLogs.map(l => ({
      Date: new Date(l.createdAt).toLocaleString('fr-FR'),
      Action: ACTION_LABELS[l.action] || l.action,
      Membre: l.memberName || '-',
      Utilisateur: l.performedBy,
      Role: l.performedByRole,
      Ancienne: l.oldValue || '-',
      Nouvelle: l.newValue || '-',
      Raison: l.reason || '-',
      Suspect: l.isSuspicious ? 'OUI' : 'NON',
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Audit');
    XLSX.writeFile(wb, `audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-orange-400" />
            Journal d&apos;Audit
          </h2>
          <p className="text-gray-400 mt-1">Historique complet des actions sur les membres</p>
        </div>
        <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all">
          <Download className="w-5 h-5" /> Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">Total actions</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-400">{stats.suspicious}</p>
              <p className="text-sm text-gray-400">Actions suspectes</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.today}</p>
              <p className="text-sm text-gray-400">Aujourd&apos;hui</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="all">Toutes actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="all">Tous utilisateurs</option>
          {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <button onClick={() => setSuspiciousOnly(!suspiciousOnly)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${suspiciousOnly ? 'bg-red-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}>
          <AlertTriangle className="w-4 h-4" /> Suspects uniquement
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Action</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Membre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 hidden lg:table-cell">Details</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 hidden xl:table-cell">Raison</th>
            </tr>
          </thead>
          <tbody className="case-normal">
            {paginatedLogs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Aucun log d&apos;audit</td></tr>
            ) : (
              paginatedLogs.map(log => {
                const flag = detectSuspicious(log);
                return (
                  <tr key={log.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${log.isSuspicious ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{formatTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${log.isSuspicious ? 'text-red-400' : 'text-white'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        {flag && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">
                            <AlertTriangle className="w-3 h-3" /> {flag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {log.memberName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm text-gray-300">{log.performedBy}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">{log.performedByRole}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden lg:table-cell max-w-[200px] truncate">
                      {log.oldValue && log.newValue ? (
                        <span title={`Avant: ${log.oldValue} | Apres: ${log.newValue}`}>
                          {log.oldValue} → {log.newValue}
                        </span>
                      ) : log.newValue ? (
                        <span title={log.newValue}>{log.newValue}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden xl:table-cell max-w-[150px] truncate" title={log.reason}>
                      {log.reason || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <p className="text-xs text-gray-600 text-center">{filteredLogs.length} entree(s) sur {stats.total}</p>
    </div>
  );
}
