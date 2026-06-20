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
  [key: string]: unknown;
}

interface Payment {
  id?: number;
  memberId: number;
  amount: number;
  type: string;
  mode: string;
  date: string | Date;
  description?: string;
  [key: string]: unknown;
}

interface Program {
  id?: number;
  name: string;
  [key: string]: unknown;
}

interface Coach {
  id?: number;
  name: string;
  [key: string]: unknown;
}

interface MemberTableProps {
  members: Member[] | undefined;
  payments: Payment[] | undefined;
  programs: Program[] | undefined;
  coaches: Coach[] | undefined;
}

const badgeStyles: Record<string, string> = {
  'Payé': 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]',
  'En attente': 'bg-[rgba(200,155,60,0.1)] text-[#C89B3C] border border-[rgba(200,155,60,0.2)]',
  'Non payé': 'bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)]',
};

export default function MemberTable({ members, payments, programs }: MemberTableProps) {
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
      return { label: 'En attente', badge: badgeStyles['En attente'] };
    }
    if (totalPaid > 0) {
      return { label: 'Payé', badge: badgeStyles['Payé'] };
    }
    return { label: 'Non payé', badge: badgeStyles['Non payé'] };
  };

  return (
    <div className="glass rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#0A84FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-white font-bold">Derniers adhérents inscrits</h3>
        <span className="ml-auto text-sm text-[#A8B2C7]">{members?.length || 0} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-4 py-3 text-sm font-medium text-[#A8B2C7]">Adhérent</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#A8B2C7]">Abonnement</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#A8B2C7]">Statut paiement</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#A8B2C7]">Date inscription</th>
            </tr>
          </thead>
          <tbody>
            {recentMembers.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-[#A8B2C7] py-8">Aucun adhérent</td></tr>
            ) : (
              recentMembers.map((m) => {
                const paymentStatus = getPaymentStatus(m);
                return (
                  <tr key={m.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] transition-all duration-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] text-xs font-bold border border-[rgba(10,132,255,0.15)]">
                          {m.firstName?.[0] || '?'}{m.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-sm text-white">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-[#A8B2C7]">{m.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{getSubscriptionLabel(m)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider ${paymentStatus.badge}`}>
                        {paymentStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A8B2C7]">
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
