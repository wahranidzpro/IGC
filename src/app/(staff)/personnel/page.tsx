'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Employee, Absence, PayrollRecord, ContractType, AbsenceType } from '@/lib/db/dexie-db';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, DollarSign, Search, Plus, X, Edit, Trash2,
  CheckCircle, XCircle, Ban, Clock, User, Phone, Mail, Briefcase,
  Building2, MapPin, CreditCard, Shield, ChevronDown, ChevronRight,
  ChevronLeft, AlertTriangle, RefreshCw, Download, FileText, Award,
  Banknote, CalendarDays, UserCheck, Filter, ArrowUpDown, Hash, Stethoscope
} from 'lucide-react';

type Tab = 'employees' | 'absences' | 'payroll';

const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: 'CDI', cdd: 'CDD', freelance: 'Freelance', stage: 'Stage', other: 'Autre',
};

const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Congé', sick: 'Maladie', unpaid: 'Non payé', other: 'Autre',
};

const ABSENCE_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé', cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  approved: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
  cancelled: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  paid: 'text-green-400 bg-green-500/10 border-green-500/30',
};

export default function PersonnelPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('employees');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const employees = useLiveQuery(() => db.employees.toArray(), []);
  const absences = useLiveQuery(() => db.absences.toArray(), []);
  const payrollRecords = useLiveQuery(() => db.payrollRecords.toArray(), []);
  const coaches = useLiveQuery(() => db.coaches.toArray(), []);
  const gymUsers = useLiveQuery(() => db.pinUsers.toArray(), []);
  const payments = useLiveQuery(() => db.payments.toArray(), []);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedEmpId, setExpandedEmpId] = useState<number | null>(null);
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<string>('all');

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const activeEmployees = useMemo(() => employees?.filter(e => e.isActive).length || 0, [employees]);
  const totalPayroll = useMemo(() => employees?.reduce((s, e) => s + (e.baseSalary || 0), 0) || 0, [employees]);

  const pendingAbsences = useMemo(() => absences?.filter(a => a.status === 'pending').length || 0, [absences]);

  const genderLabel = (g: string) => g === 'male' ? 'Homme' : g === 'female' ? 'Femme' : 'Autre';

  const filteredEmployees = useMemo(() => {
    let list = employees || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    if (filterRole !== 'all') list = list.filter(e => e.position?.toLowerCase().includes(filterRole));
    if (filterStatus !== 'all') list = list.filter(e => filterStatus === 'active' ? e.isActive : !e.isActive);
    return list;
  }, [employees, search, filterRole, filterStatus]);

  const filteredAbsences = useMemo(() => {
    let list = absences || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const emp = employees?.find(e => e.id === a.employeeId);
        return emp?.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q);
      });
    }
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus);
    return list;
  }, [absences, search, filterStatus, employees]);

  const filteredPayroll = useMemo(() => {
    let list = payrollRecords?.filter(p => p.period === selectedMonth) || [];
    if (payrollStatusFilter !== 'all') list = list.filter(p => p.status === payrollStatusFilter);
    return list;
  }, [payrollRecords, selectedMonth, payrollStatusFilter]);

  const getCoachName = (coachId?: number) => coaches?.find(c => c.id === coachId)?.name;
  const getEmployeeName = (empId: number) => employees?.find(e => e.id === empId)?.name || 'N/A';
  const getEmployeeAbsences = (empId: number) => absences?.filter(a => a.employeeId === empId) || [];
  const getEmployeePayroll = (empId: number) => payrollRecords?.filter(p => p.employeeId === empId) || [];

  const positions = useMemo(() => [...new Set(employees?.map(e => e.position).filter(Boolean))], [employees]);

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    try {
      const now = new Date();
      if (editingEmployee && data.id) {
        await db.employees.update(data.id, { ...data, updatedAt: now });
        notify('success', 'Employé modifié');
      } else {
        await db.employees.add({
          ...data as any,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending',
        });
        notify('success', 'Employé ajouté');
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
    } catch {
      notify('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Supprimer cet employé ?')) return;
    await db.employees.delete(id);
    notify('success', 'Employé supprimé');
  };

  const handleSaveAbsence = async (data: Partial<Absence>) => {
    try {
      const now = new Date();
      await db.absences.add({
        ...data as any,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });
      notify('success', 'Absence ajoutée');
      setShowAbsenceModal(false);
    } catch {
      notify('error', 'Erreur lors de l\'enregistrement');
    }
  };

  const handleAbsenceAction = async (id: number, status: 'approved' | 'rejected') => {
    await db.absences.update(id, { status, updatedAt: new Date() });
    notify('success', status === 'approved' ? 'Absence approuvée' : 'Absence refusée');
  };

  const handleGeneratePayroll = async () => {
    if (!employees || employees.length === 0) return;
    const existing = payrollRecords?.filter(p => p.period === selectedMonth) || [];
    const existingIds = new Set(existing.map(p => p.employeeId));
    let count = 0;

    for (const emp of employees) {
      if (!emp.isActive || !emp.id) continue;
      if (existingIds.has(emp.id)) continue;

      const monthAbsences = absences?.filter(a =>
        a.employeeId === emp.id &&
        a.status === 'approved' &&
        a.startDate.startsWith(selectedMonth)
      ) || [];

      const absenceDays = monthAbsences.reduce((sum, a) => {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        return sum + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
      }, 0);

      const dailyRate = (emp.baseSalary || 0) / 26;
      const absenceDeductions = Math.round(absenceDays * dailyRate);

      const now = new Date();
      await db.payrollRecords.add({
        employeeId: emp.id,
        period: selectedMonth,
        baseSalary: emp.baseSalary || 0,
        bonuses: 0,
        deductions: 0,
        absenceDeductions,
        netSalary: (emp.baseSalary || 0) - absenceDeductions,
        status: 'pending',
        notes: absenceDays > 0 ? `${absenceDays} jour(s) d'absence déduit(s)` : '',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      });
      count++;
    }
    notify('success', `${count} fiche(s) de paie générée(s)`);
  };

  const handleMarkPaid = async (record: PayrollRecord) => {
    const emp = employees?.find(e => e.id === record.employeeId);
    await db.payrollRecords.update(record.id!, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date(),
    });
    await db.payments.add({
      memberId: record.employeeId,
      amount: record.netSalary,
      type: 'subscription' as any,
      mode: 'cash' as any,
      date: new Date(),
      description: `Salaire ${record.period} - ${emp?.name || 'N/A'}`,
      createdAt: new Date(),
    } as any);
    notify('success', `Paie marquée payée : ${record.netSalary.toLocaleString()} DA`);
  };

  const totalPayrollForMonth = useMemo(() => {
    const records = payrollRecords?.filter(p => p.period === selectedMonth && p.status === 'paid') || [];
    return records.reduce((s, p) => s + p.netSalary, 0);
  }, [payrollRecords, selectedMonth]);

  const totalPendingPayroll = useMemo(() => {
    const records = payrollRecords?.filter(p => p.period === selectedMonth && p.status === 'pending') || [];
    return records.reduce((s, p) => s + p.netSalary, 0);
  }, [payrollRecords, selectedMonth]);

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès réservé</h2>
          <p>Seuls les administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg cursor-pointer">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-orange-400" />
            Gestion du Personnel
          </h2>
          <p className="text-gray-400 mt-1">
            {employees?.length || 0} employés · {activeEmployees} actifs ·
            Masse salariale {totalPayroll.toLocaleString()} DA/mois
          </p>
        </div>
      </div>

      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1.5 border border-gray-800 w-fit">
        <TabButton icon={<Users className="w-4 h-4" />} label="Employés" active={tab === 'employees'} onClick={() => setTab('employees')} />
        <TabButton icon={<Calendar className="w-4 h-4" />} label={`Absences${pendingAbsences > 0 ? ` (${pendingAbsences})` : ''}`} active={tab === 'absences'} onClick={() => setTab('absences')} />
        <TabButton icon={<DollarSign className="w-4 h-4" />} label="Paie" active={tab === 'payroll'} onClick={() => setTab('payroll')} />
      </div>

      {/* Stats */}
      {tab === 'employees' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users />} label="Total employés" value={employees?.length || 0} color="text-blue-400" bg="bg-blue-500/10 border-blue-500/30" />
          <StatCard icon={<UserCheck />} label="Actifs" value={activeEmployees} color="text-green-400" bg="bg-green-500/10 border-green-500/30" />
          <StatCard icon={<Banknote />} label="Masse salariale" value={`${totalPayroll.toLocaleString()} DA`} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/30" />
          <StatCard icon={<Award />} label="Coachs" value={employees?.filter(e => e.coachId).length || 0} color="text-purple-400" bg="bg-purple-500/10 border-purple-500/30" />
        </div>
      )}

      {/* ===== EMPLOYEES TAB ===== */}
      {tab === 'employees' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Rechercher..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-orange-500" />
              </div>
              <button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Ajouter un employé
              </button>
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Aucun employé trouvé</div>
          ) : (
            <>
              {filteredEmployees.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  coachName={getCoachName(emp.coachId)}
                  gymUser={gymUsers?.find(u => u.id?.toString() === emp.gymUserId)}
                  isExpanded={expandedEmpId === emp.id}
                  onToggle={() => setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id!)}
                  onEdit={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }}
                  onDelete={() => handleDeleteEmployee(emp.id!)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ===== ABSENCES TAB ===== */}
      {tab === 'absences' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Rechercher..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white w-64 focus:outline-none focus:border-orange-500" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Refusé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <button onClick={() => setShowAbsenceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Ajouter une absence
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-6 py-3">Employé</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Du</th>
                <th className="px-6 py-3">Au</th>
                <th className="px-6 py-3">Motif</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAbsences.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Aucune absence</td></tr>
              ) : filteredAbsences.map(a => (
                <tr key={a.id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-white text-sm">{getEmployeeName(a.employeeId)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      a.type === 'sick' ? 'bg-red-500/20 text-red-400' :
                      a.type === 'vacation' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{ABSENCE_TYPE_LABELS[a.type]}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{a.startDate || '-'}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{a.endDate || '-'}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm max-w-[200px] truncate">{a.reason || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[a.status] || ''}`}>
                      {ABSENCE_STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAbsenceAction(a.id!, 'approved')}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-all cursor-pointer" title="Approuver">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAbsenceAction(a.id!, 'rejected')}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all cursor-pointer" title="Refuser">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== PAYROLL TAB ===== */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Mois :</label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white" />
              <select value={payrollStatusFilter} onChange={e => setPayrollStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white">
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Payé : <strong className="text-green-400">{totalPayrollForMonth.toLocaleString()} DA</strong></span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">En attente : <strong className="text-yellow-400">{totalPendingPayroll.toLocaleString()} DA</strong></span>
              <button onClick={handleGeneratePayroll}
                className="ml-3 flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 transition-all cursor-pointer">
                <FileText className="w-4 h-4" /> Générer la paie
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                  <th className="px-6 py-3">Employé</th>
                  <th className="px-6 py-3">Salaire base</th>
                  <th className="px-6 py-3">Primes</th>
                  <th className="px-6 py-3">Déductions</th>
                  <th className="px-6 py-3">Absences</th>
                  <th className="px-6 py-3">Net</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPayroll.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucune fiche de paie pour ce mois.
                    {employees?.length ? ' Cliquez sur "Générer la paie"' : ''}
                  </td></tr>
                ) : filteredPayroll.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white text-sm">{getEmployeeName(p.employeeId)}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm font-mono">{p.baseSalary.toLocaleString()} DA</td>
                    <td className="px-6 py-4 text-green-400 text-sm font-mono">{p.bonuses > 0 ? `+${p.bonuses.toLocaleString()} DA` : '-'}</td>
                    <td className="px-6 py-4 text-red-400 text-sm font-mono">{p.deductions > 0 ? `-${p.deductions.toLocaleString()} DA` : '-'}</td>
                    <td className="px-6 py-4 text-red-400 text-sm font-mono">{p.absenceDeductions > 0 ? `-${p.absenceDeductions.toLocaleString()} DA` : '-'}</td>
                    <td className="px-6 py-4 text-white font-bold text-sm font-mono">{p.netSalary.toLocaleString()} DA</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'pending' && (
                        <button onClick={() => handleMarkPaid(p)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-xs hover:bg-green-600/30 transition-all cursor-pointer">
                          <CheckCircle className="w-3.5 h-3.5" /> Marquer payé
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          coaches={coaches || []}
          onClose={() => { setShowEmployeeModal(false); setEditingEmployee(null); }}
          onSave={handleSaveEmployee}
        />
      )}

      {/* Absence Modal */}
      {showAbsenceModal && (
        <AbsenceFormModal
          employees={employees || []}
          onClose={() => setShowAbsenceModal(false)}
          onSave={handleSaveAbsence}
        />
      )}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
      active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}>
      {icon}{label}
    </button>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl p-4 border ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function EmployeeRow({ employee, coachName, gymUser, isExpanded, onToggle, onEdit, onDelete }: {
  employee: Employee; coachName?: string; gymUser?: any; isExpanded: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <>
      <div className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
        <div className="flex items-center px-5 py-3 cursor-pointer" onClick={onToggle}>
          <div className="flex-1 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {employee.photo ? <img src={employee.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-500" />}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{employee.name}</p>
              <p className="text-gray-400 text-xs">{employee.position}{employee.department ? ` · ${employee.department}` : ''}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <span className="text-gray-400">{employee.phone}</span>
            <span className="font-mono text-gray-300">{employee.baseSalary.toLocaleString()} DA</span>
            {coachName && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">Coach</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs ${employee.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {employee.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer"><Edit className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onToggle} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-800/20 pt-3">
            <div><span className="text-gray-500 text-xs">Email</span><p className="text-gray-300">{employee.email || '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Téléphone</span><p className="text-gray-300">{employee.phone}</p></div>
            <div><span className="text-gray-500 text-xs">Adresse</span><p className="text-gray-300">{employee.address || '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Date naissance</span><p className="text-gray-300">{employee.birthDate || '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Date embauche</span><p className="text-gray-300">{employee.hireDate || '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Type contrat</span><p className="text-gray-300">{CONTRACT_LABELS[employee.contractType] || employee.contractType}</p></div>
            <div><span className="text-gray-500 text-xs">Sécurité sociale</span><p className="text-gray-300">{employee.socialSecurityNumber || '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Banque / RIB</span><p className="text-gray-300">{employee.bankName ? `${employee.bankName} · ${employee.bankRib}` : '-'}</p></div>
            <div><span className="text-gray-500 text-xs">Urgence contact</span><p className="text-gray-300">{employee.emergencyContact ? `${employee.emergencyContact} (${employee.emergencyPhone})` : '-'}</p></div>
            {coachName && <div><span className="text-gray-500 text-xs">Lien Coach</span><p className="text-purple-400">{coachName}</p></div>}
            {gymUser && <div><span className="text-gray-500 text-xs">Compte utilisateur</span><p className="text-blue-400">{gymUser.username} ({gymUser.role})</p></div>}
          </div>
        )}
      </div>
    </>
  );
}

function EmployeeFormModal({ employee, coaches, onClose, onSave }: {
  employee: Employee | null; coaches: any[]; onClose: () => void;
  onSave: (data: Partial<Employee>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Employee>>(employee || {
    name: '', phone: '', email: '', address: '', position: '', department: '',
    hireDate: '', contractType: 'cdi' as ContractType, baseSalary: 0,
    bankName: '', bankRib: '', emergencyContact: '', emergencyPhone: '',
    socialSecurityNumber: '', birthDate: '', gender: 'male' as const,
    photo: '', coachId: undefined, gymUserId: undefined, isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSubmitting(true);
    await onSave({ ...form, id: employee?.id });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{employee ? 'Modifier' : 'Ajouter'} un employé</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Nom complet *</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" placeholder="Nom de l'employé" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Adresse</label>
              <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Poste</label>
              <input type="text" value={form.position} onChange={e => setForm({...form, position: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" placeholder="Ex: Coach sportif" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Département</label>
              <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date embauche</label>
              <input type="date" value={form.hireDate} onChange={e => setForm({...form, hireDate: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type contrat</label>
              <select value={form.contractType} onChange={e => setForm({...form, contractType: e.target.value as ContractType})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="freelance">Freelance</option>
                <option value="stage">Stage</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Salaire de base (DA)</label>
              <input type="number" value={form.baseSalary || ''} onChange={e => setForm({...form, baseSalary: Number(e.target.value)})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Genre</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
                <option value="male">Homme</option>
                <option value="female">Femme</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date naissance</label>
              <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">N° Sécurité sociale</label>
              <input type="text" value={form.socialSecurityNumber} onChange={e => setForm({...form, socialSecurityNumber: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Banque</label>
              <input type="text" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">RIB</label>
              <input type="text" value={form.bankRib} onChange={e => setForm({...form, bankRib: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact urgence</label>
              <input type="text" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tél. urgence</label>
              <input type="text" value={form.emergencyPhone} onChange={e => setForm({...form, emergencyPhone: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
          </div>

          {/* Liaison coach */}
          <div className="border-t border-gray-800 pt-4">
            <label className="block text-sm text-gray-400 mb-2">Liaison Coach (si coach sportif)</label>
            <select value={form.coachId || ''} onChange={e => setForm({...form, coachId: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
              <option value="">Non coach</option>
              {coaches.map(c => <option key={c.id} value={c.id!}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all cursor-pointer">Annuler</button>
            <button type="submit" disabled={submitting || !form.name}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer">
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AbsenceFormModal({ employees, onClose, onSave }: {
  employees: Employee[]; onClose: () => void;
  onSave: (data: Partial<Absence>) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [type, setType] = useState<AbsenceType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate) return;
    setSubmitting(true);
    await onSave({ employeeId, type, startDate, endDate, reason });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Ajouter une absence</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Employé *</label>
            <select value={employeeId} onChange={e => setEmployeeId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
              <option value={0}>Sélectionner</option>
              {employees.filter(e => e.isActive).map(e => <option key={e.id} value={e.id!}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type *</label>
            <select value={type} onChange={e => setType(e.target.value as AbsenceType)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
              <option value="vacation">Congé</option>
              <option value="sick">Maladie</option>
              <option value="unpaid">Non payé</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date début *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date fin *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Motif</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all cursor-pointer">Annuler</button>
            <button type="submit" disabled={submitting || !employeeId || !startDate || !endDate}
              className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition-all cursor-pointer">
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
