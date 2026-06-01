'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { DoorOpen, DoorClosed, Clock } from 'lucide-react';

interface MemberCheckinsProps {
  memberId: number;
}

export function MemberCheckins({ memberId }: MemberCheckinsProps) {
  const checkins = useLiveQuery(
    () => db.checkins.where('memberId').equals(memberId).reverse().limit(20).toArray(),
    [memberId]
  );

  // Group by date
  const groupedCheckins = checkins?.reduce((groups, checkin) => {
    const date = new Date(checkin.timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(checkin);
    return groups;
  }, {} as Record<string, typeof checkins>);

  const getTypeIcon = (type: string) => {
    const t = type as string;
    if (t === 'checkin' || t === 'in') {
      return <DoorOpen className="w-4 h-4 text-green-400" />;
    }
    return <DoorClosed className="w-4 h-4 text-red-400" />;
  };

  const getTypeLabel = (type: string) => {
    const t = type as string;
    if (t === 'checkin' || t === 'in') {
      return 'Entrée';
    }
    return 'Sortie';
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <DoorOpen className="w-4 h-4 text-orange-400" />
          </span>
          Mes Entrées/Sorties
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total entrées</p>
          <p className="text-xl font-bold text-white">{checkins?.filter(c => (c.type as string) === 'checkin').length || 0}</p>
        </div>
      </div>

      {checkins && checkins.length > 0 ? (
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {Object.entries(groupedCheckins || {}).map(([date, dayCheckins]) => (
            <div key={date}>
              <p className="text-xs text-gray-400 mb-2">{date}</p>
              <div className="space-y-2">
                {dayCheckins?.map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(checkin.type)}
                      <span className={`text-sm ${(checkin.type as string) === 'checkin' || (checkin.type as string) === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                        {getTypeLabel(checkin.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(checkin.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <DoorOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Aucun pointage enregistré</p>
        </div>
      )}
    </div>
  );
}