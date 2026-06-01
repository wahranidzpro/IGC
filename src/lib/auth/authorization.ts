import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export interface AccessResult {
  granted: boolean;
  reason: string;
  message: string;
  subscription_status?: string;
  subscription_end_date?: string;
  approved_by_admin?: boolean;
  approved_by_reception?: boolean;
  plan_name?: string;
}

const defaultDenied: AccessResult = {
  granted: false,
  reason: 'SUPABASE_NOT_CONFIGURED',
  message: 'Supabase n\'est pas configuré. Contactez l\'administration.',
};

export async function canAccessApp(userId?: string | null): Promise<AccessResult> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    logger.warn('[AUTHZ] Supabase not configured or no userId for canAccessApp');
    return defaultDenied;
  }

  try {
    const { data: gymUser, error: userError } = await (supabase as any)
      .from('gym_users')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!userError && gymUser?.role && ['admin', 'reception', 'coach'].includes(gymUser.role)) {
      logger.info('[AUTHZ] Staff access granted', { userId: userId.substring(0, 8), role: gymUser.role });
      return {
        granted: true,
        reason: 'STAFF_ACCESS',
        message: 'Accès autorisé (personnel).',
      };
    }

    const { data, error } = await (supabase.rpc as any)('can_access_app', { p_user_id: userId });

    if (error) {
      logger.error('[AUTHZ] RPC error', error);
      return {
        granted: false,
        reason: 'RPC_ERROR',
        message: 'Erreur de vérification d\'accès. Contactez l\'administration.',
      };
    }

    const result = data as AccessResult;
    logger.info('[AUTHZ] Access check', { userId: userId.substring(0, 8), result: result.granted, reason: result.reason });
    return result;
  } catch (err) {
    logger.error('[AUTHZ] Exception in canAccessApp', err);
    return {
      granted: false,
      reason: 'EXCEPTION',
      message: 'Erreur lors de la vérification d\'accès.',
    };
  }
}

export async function fetchAccessStatus(userId?: string | null) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_access_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('[AUTHZ] Fetch access status error', error);
      return null;
    }

    return data;
  } catch (err) {
    logger.error('[AUTHZ] Exception in fetchAccessStatus', err);
    return null;
  }
}

export async function refreshUserSubscription(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const result = await canAccessApp(userId);
    return result.granted;
  } catch {
    return false;
  }
}
