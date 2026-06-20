'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie-db';
import { User, Phone, Calendar, Clock } from 'lucide-react';
import { Member } from '@/lib/db/dexie-db';

interface MemberCoachProps {
  member: Member;
}

export function MemberCoach({ member }: MemberCoachProps) {
  const coach = useLiveQuery(
    () => member.coachId ? db.coaches.get(member.coachId) : undefined,
    [member.coachId]
  );

  const getDayLabel = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    };
    return days[day.toLowerCase()] || day;
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-orange-400" />
        </span>
        Mon Coach
      </h3>

      {coach ? (
        <div className="space-y-4">
          {/* Coach Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-lg">{coach.name}</p>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {coach.phone}
              </p>
            </div>
          </div>

          {/* Availability */}
          {coach.availability && coach.availability.length > 0 && (
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-orange-400" />
                <p className="text-sm text-gray-400">Disponibilités</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {coach.availability.map((avail, index) => (
                  <div key={index} className="text-center p-2 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">{getDayLabel(avail.day)}</p>
                    <p className="text-xs text-orange-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {avail.start} - {avail.end}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Button */}
          {coach.phone && (
            <a
              href={`tel:${coach.phone}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Contacter le coach
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Aucun coach assigné</p>
          <p className="text-sm">Contactez l&apos;administration pour en assigner un</p>
        </div>
      )}
    </div>
  );
}