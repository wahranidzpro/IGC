import { useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import type { Database } from './database.types';
import { db } from '../db/dexie-db';
import { ENTITY_REGISTRY } from '../sync/registry';
import { logger } from '../logger';

function subscribeEntity(
  sb: SupabaseClient<Database>,
  entityName: string
) {
  const config = ENTITY_REGISTRY[entityName];
  if (!config) return null;

  const channel = sb
    .channel(`${config.supabaseTable}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: config.supabaseTable },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (payload: any) => {
        const eventType = payload.eventType;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newRecord = payload.new as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldRecord = payload.old as any;

        if (eventType === 'DELETE' && oldRecord?.local_id) {
          await config.dexieTable.delete(oldRecord.local_id);
          logger.info(`Realtime sync: ${entityName} ${oldRecord.local_id} deleted`);
          return;
        }

        if (newRecord?.local_id) {
          const existing = await config.dexieTable.get(newRecord.local_id);
          const localItem = config.fromCloudRecord(newRecord);
          if (existing) {
            await config.dexieTable.update(newRecord.local_id, localItem);
          } else {
            await config.dexieTable.add(localItem);
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
  const channelsRef = useRef<ReturnType<SupabaseClient<Database>['channel']>[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channels: ReturnType<SupabaseClient<Database>['channel']>[] = [];

    // Members (specialized due to complex field mapping)
    const memberChannel = supabase
      .channel('synced_members_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'synced_members' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const eventType = payload.eventType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              subscriptionType: newRecord.subscription_type || 'free_session',
              subscriptionDuration: newRecord.subscription_duration || '',
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
              referredBy: newRecord.referred_by || 0,
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

    // Payments
    const paymentChannel = supabase
      .channel('synced_payments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'synced_payments' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const eventType = payload.eventType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRecord = payload.old as any;

          if (eventType === 'DELETE' && oldRecord?.local_id) {
            await db.payments.delete(oldRecord.local_id);
            return;
          }

          if (newRecord?.local_id) {
            const existing = await db.payments.get(newRecord.local_id);
            const paymentData = {
              id: newRecord.local_id,
              memberId: newRecord.member_id ?? 0,
              amount: Number(newRecord.amount) || 0,
              type: newRecord.type || 'subscription',
              mode: newRecord.mode || 'cash',
              date: new Date(newRecord.date || newRecord.created_at || Date.now()),
              description: newRecord.notes || '',
              createdAt: new Date(newRecord.created_at || Date.now()),
            };
            if (existing) {
              await db.payments.update(newRecord.local_id, paymentData);
            } else {
              await db.payments.add(paymentData);
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`synced_payments realtime channel status: ${status}`);
      });

    // Check-ins
    const checkinChannel = supabase
      .channel('synced_checkins_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'synced_checkins' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const eventType = payload.eventType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRecord = payload.old as any;

          if (eventType === 'DELETE' && oldRecord?.local_id) {
            await db.checkins.delete(oldRecord.local_id);
            return;
          }

          if (newRecord?.local_id) {
            const existing = await db.checkins.get(newRecord.local_id);
            const checkinData = {
              id: newRecord.local_id,
              memberId: newRecord.member_id ?? 0,
              timestamp: new Date(newRecord.timestamp || Date.now()),
              type: newRecord.type || 'checkin',
            };
            if (existing) {
              await db.checkins.update(newRecord.local_id, checkinData);
            } else {
              await db.checkins.add(checkinData);
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`synced_checkins realtime channel status: ${status}`);
      });

    // Points Ledger
    const pointsChannel = supabase
      .channel('synced_points_ledger_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'synced_points_ledger' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const eventType = payload.eventType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRecord = payload.old as any;

          if (eventType === 'DELETE' && oldRecord?.local_id) {
            await db.pointsLedger.delete(oldRecord.local_id);
            return;
          }

          if (newRecord?.local_id) {
            const existing = await db.pointsLedger.get(newRecord.local_id);
            const ledgerData = {
              id: newRecord.local_id,
              memberId: newRecord.member_id ?? 0,
              memberName: newRecord.member_name || '',
              points: newRecord.points || 0,
              type: newRecord.type || 'earn',
              reason: newRecord.reason || '',
              referenceId: newRecord.reference_id,
              balanceAfter: newRecord.balance_after || 0,
              createdAt: new Date(newRecord.created_at || Date.now()),
            };
            if (existing) {
              await db.pointsLedger.update(newRecord.local_id, ledgerData);
            } else {
              await db.pointsLedger.add(ledgerData);
            }
          }
        }
      )
      .subscribe((status) => {
        logger.info(`synced_points_ledger realtime channel status: ${status}`);
      });

    const userChannel = supabase
      .channel('gym_users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gym_users' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const eventType = payload.eventType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              role: newRecord.role,
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

    channels.push(memberChannel, userChannel, paymentChannel, checkinChannel, pointsChannel);

    // Subscribe to generic entities (skip those with dedicated channels)
    const excluded = new Set(['members', 'payments', 'checkins', 'pointsLedger']);
    for (const entityName of Object.keys(ENTITY_REGISTRY)) {
      if (excluded.has(entityName)) continue;
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
