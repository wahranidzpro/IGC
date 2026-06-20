import { NextRequest } from 'next/server';
import { verifyAuthenticated } from '@/lib/api-auth';
import { getServiceClient } from '@/lib/supabase/service-client';
import { ROLES } from '@/lib/constants/roles';
import { success, error } from '@/lib/api-response';
import { withCsrf } from '@/lib/api-middleware';

type PaymentType = 'subscription' | 'product' | 'free_session';
type PaymentMode = 'cash' | 'card' | 'wallet' | 'points';
type SubscriptionDuration = '1_mois' | '2_mois' | '3_mois' | '6_mois' | '12_mois';

const VALID_TYPES: PaymentType[] = ['subscription', 'product', 'free_session'];
const VALID_MODES: PaymentMode[] = ['cash', 'card', 'wallet', 'points'];
const VALID_DURATIONS: SubscriptionDuration[] = ['1_mois', '2_mois', '3_mois', '6_mois', '12_mois'];

const EARN_RATE_DZD = 100;
const EARN_RATE_POINTS = 1;

function calculatePoints(amount: number): number {
  if (amount <= 0) return 0;
  return Math.floor((amount / EARN_RATE_DZD) * EARN_RATE_POINTS);
}

const DURATION_MONTH_MAP: Record<string, number> = {
  '1_mois': 1, '2_mois': 2, '3_mois': 3, '6_mois': 6, '12_mois': 12,
};

class PaymentError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

export const POST = withCsrf(async (request: NextRequest) => {
  try {
    const auth = await verifyAuthenticated(request);
    if (!auth.authorized) {
      return error('Non authentifié', 401, 'UNAUTHORIZED');
    }
    if (auth.role !== ROLES.ADMIN && auth.role !== ROLES.RECEPTION) {
      return error('Accès réservé au personnel', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const {
      memberId, amount, type, mode, description,
      subscriptionDuration, sessionsLeft,
    } = body;

    if (!memberId || typeof memberId !== 'number') {
      return error('memberId requis (nombre)', 400, 'VALIDATION_ERROR');
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return error('Montant invalide', 400, 'VALIDATION_ERROR');
    }
    if (!VALID_TYPES.includes(type)) {
      return error('Type invalide (subscription, product, free_session)', 400, 'VALIDATION_ERROR');
    }
    if (!VALID_MODES.includes(mode)) {
      return error('Mode invalide (cash, card, wallet, points)', 400, 'VALIDATION_ERROR');
    }
    if (type === 'subscription' && !VALID_DURATIONS.includes(subscriptionDuration)) {
      return error('Durée abonnement invalide', 400, 'VALIDATION_ERROR');
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return error('Supabase non configuré', 503, 'SERVICE_UNAVAILABLE');
    }

    const now = new Date().toISOString();
    const localId = -(Date.now() + Math.floor(Math.random() * 10000));

    const paymentType = type === 'free_session' ? 'subscription' : type;

    const paymentDescription = description || (
      type === 'subscription'
        ? `Paiement abonnement ${subscriptionDuration || ''}`
        : type === 'free_session'
          ? `Paiement séance libre (${sessionsLeft || 0} séances)`
          : 'Paiement produit POS'
    );

    const { data: member, error: memberError } = await supabase
      .from('synced_members')
      .select('local_id, first_name, last_name, fidelity_points, status, subscription_type, subscription_duration, sessions_left, referred_by, created_at')
      .eq('local_id', memberId)
      .maybeSingle();

    if (memberError || !member) {
      return error('Membre introuvable', 404, 'NOT_FOUND');
    }

    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim();

    const { data: payment, error: paymentError } = await supabase
      .from('synced_payments')
      .insert({
        local_id: localId,
        member_id: memberId,
        amount,
        type: paymentType,
        mode,
        date: now,
        notes: paymentDescription,
        created_at: now,
      })
      .select('local_id')
      .single();

    if (paymentError) {
      return error('Erreur création paiement: ' + paymentError.message, 500, 'PAYMENT_INSERT_FAILED');
    }

    const paymentId = payment.local_id;
    const pointsIds: number[] = [];
    let referralId: number | null = null;

    async function awardPoints(params: {
      memberId: number
      memberName: string
      points: number
      reason: string
      referenceId: number | string
      referenceType: string
      localId: number
    }): Promise<number> {
      if (!supabase) throw new PaymentError('Supabase non configuré', 'SERVICE_UNAVAILABLE')

      const { data: member } = await supabase
        .from('synced_members')
        .select('fidelity_points')
        .eq('local_id', params.memberId)
        .single()
      const currentPoints = member?.fidelity_points ?? 0
      const balanceAfter = currentPoints + params.points

      const { error: ledgerError } = await supabase
        .from('synced_points_ledger')
        .insert({
          local_id: params.localId,
          member_id: params.memberId,
          member_name: params.memberName,
          points: params.points,
          type: 'earn',
          reason: params.reason,
          reference_id: params.referenceId,
          reference_type: params.referenceType,
          balance_after: balanceAfter,
          created_at: now,
        })

      if (ledgerError) throw new PaymentError('Erreur attribution points: ' + ledgerError.message, 'POINTS_INSERT_FAILED')

      const { error: pointsError } = await supabase
        .from('synced_members')
        .update({ fidelity_points: balanceAfter })
        .eq('local_id', params.memberId)

      if (pointsError) throw new PaymentError('Erreur mise à jour points: ' + pointsError.message, 'POINTS_UPDATE_FAILED')

      return params.localId
    }

    try {
      if (type === 'subscription') {
        const { error: updateError } = await supabase
          .from('synced_members')
          .update({
            status: 'active',
            subscription_type: 'subscription',
            subscription_duration: subscriptionDuration,
            updated_at: now,
          })
          .eq('local_id', memberId);

        if (updateError) throw new PaymentError('Erreur mise à jour abonnement: ' + updateError.message, 'MEMBER_UPDATE_FAILED');

        const points = calculatePoints(amount);
        if (points > 0) {
          const ptsId = await awardPoints({
            memberId,
            memberName,
            points,
            reason: `Abonnement: ${amount} DA`,
            referenceId: paymentId,
            referenceType: 'subscription',
            localId: localId + 1,
          });
          pointsIds.push(ptsId);
        }

        if (member.referred_by && member.referred_by > 0) {
          const { data: sponsor } = await supabase
            .from('synced_members')
            .select('local_id, first_name, last_name')
            .eq('local_id', member.referred_by)
            .maybeSingle();

          if (sponsor) {
            const sponsorName = `${sponsor.first_name || ''} ${sponsor.last_name || ''}`.trim();
            const months = DURATION_MONTH_MAP[subscriptionDuration] || 0;
            const referralPoints = months >= 12 ? 6000 : months >= 6 ? 3000 : months >= 3 ? 1500 : months >= 1 ? 500 : 0;

            if (referralPoints > 0) {
              const { data: sponsorFull } = await supabase
                .from('synced_members')
                .select('fidelity_points')
                .eq('local_id', member.referred_by)
                .maybeSingle();

              if (sponsorFull) {
                const sponsorNewBalance = (sponsorFull.fidelity_points || 0) + referralPoints;

                const { data: refLedger, error: refLedgerError } = await supabase
                  .from('synced_points_ledger')
                  .insert({
                    local_id: localId + 2,
                    member_id: member.referred_by,
                    member_name: sponsorName,
                    points: referralPoints,
                    type: 'earn',
                    reason: `Parrainage: ${referralPoints} pts`,
                    reference_type: 'referral',
                    balance_after: sponsorNewBalance,
                    created_at: now,
                  })
                  .select('local_id')
                  .single();

                if (!refLedgerError) {
                  pointsIds.push(refLedger.local_id);
                  await supabase
                    .from('synced_members')
                    .update({ fidelity_points: sponsorNewBalance })
                    .eq('local_id', member.referred_by);
                }

                const { data: insertedReferral, error: refError } = await supabase
                  .from('synced_referrals')
                  .insert({
                    sponsor_id: member.referred_by,
                    sponsor_name: sponsorName,
                    referred_id: memberId,
                    referred_name: memberName,
                    subscription_duration: subscriptionDuration,
                    points_awarded: referralPoints,
                    status: 'awarded',
                    created_at: now,
                  })
                  .select('local_id')
                  .single();

                if (!refError) {
                  referralId = insertedReferral.local_id;
                }
              }
            }
          }
        }
      } else if (type === 'free_session') {
        const { error: updateError } = await supabase
          .from('synced_members')
          .update({
            status: 'active',
            subscription_type: 'free_session',
            sessions_left: sessionsLeft ?? (member.sessions_left || 0),
            updated_at: now,
          })
          .eq('local_id', memberId);

        if (updateError) throw new PaymentError('Erreur mise à jour séance: ' + updateError.message, 'MEMBER_UPDATE_FAILED');

        const points = calculatePoints(amount);
        if (points > 0) {
          const ptsId = await awardPoints({
            memberId,
            memberName,
            points,
            reason: `Séance libre: ${amount} DA`,
            referenceId: paymentId,
            referenceType: 'payment',
            localId: localId + 1,
          });
          pointsIds.push(ptsId);
        }
      } else if (type === 'product') {
        const points = calculatePoints(amount);
        if (points > 0) {
          const ptsId = await awardPoints({
            memberId,
            memberName,
            points,
            reason: `Achat POS: ${amount} DA`,
            referenceId: paymentId,
            referenceType: 'pos',
            localId: localId + 1,
          });
          pointsIds.push(ptsId);
        }
      }
    } catch (err) {
      if (paymentId) await supabase.from('synced_payments').delete().eq('local_id', paymentId);
      if (pointsIds.length) await supabase.from('synced_points_ledger').delete().in('local_id', pointsIds);
      if (referralId) await supabase.from('synced_referrals').delete().eq('local_id', referralId);

      const message = err instanceof Error ? err.message : 'inconnue';
      const code = err instanceof PaymentError ? err.code : 'PROCESSING_ERROR';
      return error('Erreur lors du traitement: ' + message, 500, code);
    }

    return success({
      paymentId,
      memberId,
      memberName,
      amount,
      type,
      mode,
      description: paymentDescription,
    });
  } catch (err) {
    console.error('[PAYMENTS] Error:', err);
    return error('Erreur interne du serveur', 500);
  }
})
