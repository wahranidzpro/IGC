import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import { db } from '../db/dexie-db';
import { ENTITY_REGISTRY } from '../sync/registry';
import { logger } from '../logger';

function subscribeEntity(
  supabase: any,
  entityName: string
) {
  const config = ENTITY_REGISTRY[entityName];
  if (!config) return null;

  const channel = supabase
    .channel(`${config.supabaseTable}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: config.supabaseTable },
      async (payload: any) => {
        const eventType = payload.eventType;
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;

        if (eventType === 'DELETE' && oldRecord?.local_id) {
          await (config.dexieTable as any).delete(oldRecord.local_id);
          logger.info(`Realtime sync: ${entityName} ${oldRecord.local_id} deleted`);
          return;
        }

        if (newRecord?.local_id) {
          const existing = await (config.dexieTable as any).get(newRecord.local_id);
          const localItem = config.fromCloudRecord(newRecord);
          if (existing) {
            await (config.dexieTable as any).update(newRecord.local_id, localItem);
          } else {
            await (config.dexieTable as any).add(localItem);
          }
          logger.info(`Realtime sync: ${entityName} ${newRecord.local_id} ${eventType}`);
        }
      }
    )
    .subscribe((status: string) => {
      logger.info(`${config.supabaseTable} realtime status: ${status}`);
    });

  return channel;
}

export function useRealtimeSync() {
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channels: any[] = [];

    // Members (specialized due to complex field mapping)
    const memberChannel = supabase
      .channel('synced_members_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'synced_members' },
        async (payload) => {
          const eventType = payload.eventType;
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          if (eventType === 'DELETE' && oldRecord?.local_id) {
            await db.members.delete(oldRecord.local_id);
            logger.info(`Realtime sync: member ${oldRecord.local_id} deleted`);
            return;
          }

          if (newRecord?.local_id) {
            const existing = await db.members.get(newRecord.local_id);
            const memberData = {
              id: newRecord.local_id,
              firstName: newRecord.first_name || '',
              lastName: newRecord.last_name || '',
              phone: newRecord.phone || '',
              birthDate: newRecord.birth_date || '',
              address: newRecord.address || '',
              gender: (newRecord.gender || 'other') as 'male' | 'female' | 'other',
              bloodType: newRecord.blood_type || '',
              photo: newRecord.photo || '',
              coachId: newRecord.coach_id,
              programId: newRecord.program_id,
              sessionsLeft: newRecord.sessions_left || 0,
              programAmount: newRecord.program_amount || 0,
              amountPaid: newRecord.amount_paid || 0,
              balanceDue: newRecord.balance_due || 0,
              discount: newRecord.discount || 0,
              advance: newRecord.advance || 0,
              subscriptionType: (newRecord.subscription_type || 'free_session') as any,
              subscriptionDuration: (newRecord.subscription_duration || '') as any,
              status: (newRecord.status || 'active') as 'active' | 'inactive' | 'expired',
              fidelityPoints: newRecord.fidelity_points || 0,
              rfidCode: newRecord.rfid_code || '',
              createdAt: new Date(newRecord.created_at || Date.now()),
              updatedAt: new Date(newRecord.updated_at || Date.now()),
              syncStatus: 'synced' as const,
              email: newRecord.email,
              emergencyContactName: newRecord.emergency_contact_name,
              emergencyContactPhone: newRecord.emergency_contact_phone,
              allergies: newRecord.allergies,
              weight: newRecord.weight,
              height: newRecord.height,
              fitnessGoal: newRecord.fitness_goal,
              experienceLevel: newRecord.experience_level,
              isBlocked: newRecord.is_blocked,
              blockReason: newRecord.block_reason,
              blockDate: newRecord.block_date ? new Date(newRecord.block_date) : undefined,
              blockedUntil: newRecord.blocked_until ? new Date(newRecord.blocked_until) : undefined,
            };
            if (existing) {
              await db.members.update(newRecord.local_id, memberData);
            } else {
              await db.members.add(memberData);
            }
            logger.info(`Realtime sync: member ${newRecord.local_id} ${payload.eventType}`);
          }
        }
      )
      .subscribe((status) => {
        logger.info(`synced_members realtime channel status: ${status}`);
      });

    const userChannel = supabase
      .channel('gym_users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gym_users' },
        async (payload) => {
          const eventType = payload.eventType;
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          if (eventType === 'DELETE' && oldRecord?.username) {
            const existing = await db.pinUsers.where('username').equals(oldRecord.username).first();
            if (existing) {
              await db.pinUsers.delete(existing.id!);
              logger.info(`Realtime sync: user ${oldRecord.username} deleted from cloud, removed locally`);
            }
            return;
          }

          if (newRecord?.username) {
            const existing = await db.pinUsers.where('username').equals(newRecord.username).first();
            const userData = {
              username: newRecord.username,
              password: newRecord.password_hash,
              pin: newRecord.pin,
              role: newRecord.role as any,
              name: newRecord.name,
              phone: newRecord.phone,
              isLocked: newRecord.is_locked || false,
              createdAt: new Date(newRecord.created_at || Date.now()),
            };
            if (existing) {
              await db.pinUsers.update(existing.id!, userData);
              logger.info(`Realtime sync: user ${newRecord.username} updated`);
            } else {
              await db.pinUsers.add(userData);
              logger.info(`Realtime sync: user ${newRecord.username} created`);
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`gym_users realtime channel status: ${status}`);
      });

    channels.push(memberChannel, userChannel);

    // Subscribe to generic entities
    for (const entityName of Object.keys(ENTITY_REGISTRY)) {
      const ch = subscribeEntity(supabase, entityName);
      if (ch) channels.push(ch);
    }

    channelsRef.current = channels;

    return () => {
      channels.forEach(ch => ch.unsubscribe());
    };
  }, []);

  return null;
}
