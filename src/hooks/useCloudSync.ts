'use client';

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { db } from '@/lib/db/dexie-db';
import { syncMembersToCloud, pullAllEntities } from '@/lib/supabase/sync';
import { startTieredProcessor, stopTieredProcessor } from '@/lib/offline/queue';
import { logger } from '@/lib/logger';

const SYNC_INTERVAL_MS = 120_000;

export function useCloudSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processorStarted = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    if (!processorStarted.current) {
      processorStarted.current = true;
      startTieredProcessor();
    }

    const pullFromCloud = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('synced_members')
          .select('*');

        if (error) {
          logger.error('[CloudSync] Pull error:', error);
          return;
        }
        if (data && data.length > 0) {
          let pulled = 0;
          let updated = 0;

          const allLocal = await db.members.toArray();
          const localByPhone = new Map<string, typeof allLocal[0]>();
          for (const m of allLocal) {
            const clean = m.phone?.replace(/[\s\-\+\(\)]/g, '') || '';
            if (clean) localByPhone.set(clean, m);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const cloud of data as any[]) {
            const localId = cloud.local_id;
            const cloudPhone = (cloud.phone || '').replace(/[\s\-\+\(\)]/g, '');
            if (!localId && !cloudPhone) continue;

            let targetMember = localId ? await db.members.get(localId) : undefined;

            if (!targetMember && cloudPhone) {
              targetMember = localByPhone.get(cloudPhone);
            }

            const memberData = {
              firstName: cloud.first_name || '',
              lastName: cloud.last_name || '',
              phone: cloud.phone || '',
              birthDate: cloud.birth_date || '',
              address: cloud.address || '',
              gender: (cloud.gender || 'other') as 'male' | 'female' | 'other',
              bloodType: cloud.blood_type || '',
              photo: cloud.photo || '',
              coachId: cloud.coach_id,
              programId: cloud.program_id,
              sessionsLeft: cloud.sessions_left || 0,
              programAmount: cloud.program_amount || 0,
              amountPaid: cloud.amount_paid || 0,
              balanceDue: cloud.balance_due || 0,
              discount: cloud.discount || 0,
              advance: cloud.advance || 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              subscriptionType: (cloud.subscription_type || 'free_session') as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              subscriptionDuration: (cloud.subscription_duration || '') as any,
              status: (cloud.status || 'active') as 'active' | 'inactive' | 'expired',
              fidelityPoints: cloud.fidelity_points || 0,
              rfidCode: cloud.rfid_code || '',
              email: cloud.email,
              emergencyContactName: cloud.emergency_contact_name,
              emergencyContactPhone: cloud.emergency_contact_phone,
              allergies: cloud.allergies,
              weight: cloud.weight,
              weightCurrent: cloud.weight_current,
              height: cloud.height,
              fitnessGoal: cloud.fitness_goal,
              experienceLevel: cloud.experience_level,
              isBlocked: cloud.is_blocked,
              blockReason: cloud.block_reason,
              blockDate: cloud.block_date ? new Date(cloud.block_date) : undefined,
              blockedUntil: cloud.blocked_until ? new Date(cloud.blocked_until) : undefined,
            };

            if (targetMember) {
              const cloudUpdated = cloud.updated_at ? new Date(cloud.updated_at).getTime() : 0;
              const localUpdated = targetMember.updatedAt?.getTime() || 0;

              if (cloudUpdated > localUpdated) {
                await db.members.update(targetMember.id!, {
                  ...memberData,
                  syncStatus: 'synced',
                  createdAt: targetMember.createdAt,
                  updatedAt: new Date(cloudUpdated),
                });
                updated++;
              }
            } else {
              await db.members.add({
                id: localId,
                ...memberData,
                createdAt: cloud.created_at ? new Date(cloud.created_at) : new Date(),
                updatedAt: cloud.updated_at ? new Date(cloud.updated_at) : new Date(),
                syncStatus: 'synced' as const,
              });
              pulled++;
            }
          }

          if (pulled > 0 || updated > 0) {
            logger.info(`[CloudSync] Pulled ${pulled} new, updated ${updated} members`);
          }
        }

        const entityResults = await pullAllEntities();
        for (const [name, res] of Object.entries(entityResults)) {
          if (res.synced > 0) {
            logger.info(`[CloudSync] Pulled ${res.synced} ${name}`);
          }
        }
      } catch (err) {
        logger.error('[CloudSync] Pull failed:', err);
      }
    };

    pullFromCloud();
    intervalRef.current = setInterval(pullFromCloud, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopTieredProcessor();
    };
  }, []);
}

export function useSyncAfterSave() {
  const lastSync = useRef(0);

  const triggerSync = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const now = Date.now();
    if (now - lastSync.current < 2000) return;
    lastSync.current = now;
    try {
      const result = await syncMembersToCloud();
      if (result.synced > 0) {
        logger.info(`[SyncAfterSave] Synced ${result.synced} members`);
      }
    } catch (err) {
      logger.error('[SyncAfterSave] Failed:', err);
    }
  };
  return { triggerSync };
}
