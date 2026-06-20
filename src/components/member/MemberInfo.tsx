'use client';

import { Phone, Mail, MapPin, Calendar, Droplet, AlertTriangle, Ruler, Scale } from 'lucide-react';
import { Member } from '@/lib/db/dexie-db';

interface MemberInfoProps {
  member: Member;
}

export function MemberInfo({ member }: MemberInfoProps) {
  return (
    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        Mes Informations
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <Phone className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Téléphone</p>
            <p className="text-white font-medium">{member.phone}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <Mail className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-white font-medium">{member.email || 'Non défini'}</p>
          </div>
        </div>

        {/* Birth Date */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <Calendar className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Date de naissance</p>
            <p className="text-white font-medium">
              {member.birthDate ? new Date(member.birthDate).toLocaleDateString('fr-FR') : 'Non définie'}
            </p>
          </div>
        </div>

        {/* Blood Type */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <Droplet className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-xs text-gray-400">Groupe sanguin</p>
            <p className="text-white font-medium">{member.bloodType || 'Non défini'}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl md:col-span-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Adresse</p>
            <p className="text-white font-medium">{member.address || 'Non définie'}</p>
          </div>
        </div>

        {/* Allergies */}
        {member.allergies && (
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl md:col-span-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs text-red-400 font-medium">Allergies</p>
              <p className="text-white">{member.allergies}</p>
            </div>
          </div>
        )}

        {/* Weight & Height */}
        {(member.weight || member.height) && (
          <div className="flex gap-3 md:col-span-2">
            {member.weight && (
              <div className="flex-1 flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                <Scale className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-400">Poids</p>
                  <p className="text-white font-medium">{member.weight} kg</p>
                </div>
              </div>
            )}
            {member.height && (
              <div className="flex-1 flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                <Ruler className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-400">Taille</p>
                  <p className="text-white font-medium">{member.height} cm</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fitness Goal */}
        {member.fitnessGoal && (
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">🎯</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Objectif fitness</p>
              <p className="text-white font-medium capitalize">{member.fitnessGoal}</p>
            </div>
          </div>
        )}

        {/* Experience Level */}
        {member.experienceLevel && (
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 text-xs font-bold">📊</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Niveau</p>
              <p className="text-white font-medium capitalize">{member.experienceLevel}</p>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {member.emergencyContactName && (
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl md:col-span-2">
            <Phone className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs text-yellow-400 font-medium">Contact d&apos;urgence</p>
              <p className="text-white">{member.emergencyContactName} - {member.emergencyContactPhone}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}