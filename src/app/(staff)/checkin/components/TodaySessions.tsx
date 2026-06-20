'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, User } from 'lucide-react';
import type { Member, CheckIn } from '@/lib/db/dexie-db';
import { formatDuration } from '../checkin-utils';

export default function TodaySessions({ todayCheckins, members, performCheckout }: {
  todayCheckins: CheckIn[] | undefined;
  members: Member[] | undefined;
  performCheckout: (memberId: number) => Promise<void>;
}) {
  const [checkinSearch, setCheckinSearch] = useState('');
  const [renderTime] = useState(() => Date.now());

  const memberSessions: { memberId: number; sessions: typeof todayCheckins }[] = [];
  const memberMap = new Map<number, typeof todayCheckins>();

  todayCheckins?.forEach(c => {
    if (!memberMap.has(c.memberId)) memberMap.set(c.memberId, []);
    memberMap.get(c.memberId)!.push(c);
  });

  memberMap.forEach((sessions, memberId) => {
    memberSessions.push({ memberId, sessions });
  });

  const filteredMembers = memberSessions.filter(({ memberId }) => {
    const m = members?.find(mm => mm.id === memberId);
    const name = `${m?.firstName || ''} ${m?.lastName || ''}`.toLowerCase();
    return name.includes(checkinSearch.toLowerCase()) || m?.phone?.includes(checkinSearch);
  }).sort((a, b) => {
    const aTime = a.sessions?.[0]?.timestamp ? new Date(a.sessions[0].timestamp).getTime() : 0;
    const bTime = b.sessions?.[0]?.timestamp ? new Date(b.sessions[0].timestamp).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Rechercher..." value={checkinSearch} onChange={(e) => setCheckinSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500" />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{checkinSearch ? 'Aucun résultat' : 'Aucun pointage aujourd\'hui'}</p>
        ) : (
          filteredMembers.map(({ memberId, sessions }) => {
            const m = members?.find(mm => mm.id === memberId);
            const memberName = m ? `${m.firstName} ${m.lastName}` : `Inconnu`;
            const memberPhoto = m?.photo;

            const sortedSessions = (sessions || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const lastCheckin = sortedSessions.find(s => s.type === 'checkin');
            const lastCheckout = sortedSessions.find(s => s.type === 'checkout');

            const checkinTime = lastCheckin ? new Date(lastCheckin.timestamp).getTime() : 0;
            const checkoutTime = lastCheckout ? new Date(lastCheckout.timestamp).getTime() : 0;
            const now = renderTime;
            const isInside = lastCheckin && (!lastCheckout || checkoutTime < checkinTime);
            const duration = isInside ? now - checkinTime : (lastCheckout ? checkoutTime - checkinTime : 0);

            return (
              <div key={memberId} className={`flex items-center justify-between p-3 rounded-xl ${isInside ? 'bg-gradient-to-r from-green-500/10 to-transparent border-l-4 border-green-500' : 'bg-gray-800/30 border-l-4 border-gray-600'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isInside ? 'border-green-500' : 'border-gray-600'} flex-shrink-0`}>
                    {memberPhoto ? (
                      <Image src={memberPhoto} alt="" width={48} height={48} className="w-full h-full object-cover" style={{ imageRendering: 'crisp-edges' }} unoptimized />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isInside ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        <User className={`w-6 h-6 ${isInside ? 'text-green-400' : 'text-gray-400'}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{memberName}</span>
                      {isInside && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">En salle</span>}
                      {!isInside && lastCheckout && <span className="px-1.5 py-0.5 bg-gray-600/20 text-gray-400 text-[10px] rounded-full">Parti</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-green-400">{'\u2197'}</span>
                        {lastCheckin ? new Date(lastCheckin.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                      {lastCheckout && (
                        <span className="flex items-center gap-1">
                          <span className="text-red-400">{'\u2198'}</span>
                          {new Date(lastCheckout.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded ${isInside ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {formatDuration(Math.round(duration / 60000))}
                      </span>
                    </div>
                  </div>
                </div>
                {isInside && (
                  <button onClick={() => performCheckout(memberId)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 font-medium">
                    {'\u279C'} Sortie
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
