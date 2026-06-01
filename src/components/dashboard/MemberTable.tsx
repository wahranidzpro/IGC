'use client';

interface Member {
  id?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  subscriptionType: string;
  sessionsLeft?: number;
  amountPaid?: number;
  balanceDue?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  [key: string]: any;
}

interface Payment {
  id?: number;
  memberId: number;
  amount: number;
  type: string;
  mode: string;
  date: string | Date;
  description?: string;
  [key: string]: any;
}

interface Program {
  id?: number;
  name: string;
  [key: string]: any;
}

interface Coach {
  id?: number;
  name: string;
  [key: string]: any;
}

interface MemberTableProps {
  members: Member[] | undefined;
  payments: Payment[] | undefined;
  programs: Program[] | undefined;
  coaches: Coach[] | undefined;
}

export default function MemberTable({ members, payments, programs, coaches }: MemberTableProps) {
  const recentMembers = members
    ? [...members].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    : [];

  const getSubscriptionLabel = (member: Member) => {
    if (member.subscriptionType === 'free_session') return 'Séance libre';
    if (member.subscriptionType === 'subscription') {
      const program = programs?.find(p => p.id === member.programId);
      return program?.name || 'Abonnement';
    }
    return '-';
  };

  const getPaymentStatus = (member: Member) => {
    const memberPayments = payments?.filter(p => p.memberId === member.id) || [];
    const totalPaid = memberPayments.reduce((s, p) => s + p.amount, 0);
    if (member.balanceDue && member.balanceDue > 0) {
      return { label: 'En attente', color: 'text-yellow-400' };
    }
    if (totalPaid > 0) {
      return { label: 'Payé', color: 'text-green-400' };
    }
    return { label: 'Non payé', color: 'text-red-400' };
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Derniers adhérents inscrits</h3>
        <span className="ml-auto text-sm text-gray-400">{members?.length || 0} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Adhérent</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Abonnement</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Statut paiement</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date inscription</th>
            </tr>
          </thead>
          <tbody>
            {recentMembers.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-500 py-8">Aucun adhérent</td></tr>
            ) : (
              recentMembers.map((m) => {
                const paymentStatus = getPaymentStatus(m);
                return (
                  <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {m.firstName?.[0] || '?'}{m.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-sm text-white">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-gray-500">{m.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{getSubscriptionLabel(m)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${paymentStatus.color}`}>{paymentStatus.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
