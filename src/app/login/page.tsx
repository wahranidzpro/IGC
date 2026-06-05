'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { initializeDatabase, db, PinUser } from '@/lib/db/dexie-db';
import { PinPad } from '@/components/auth/PinPad';
import { useAuth } from '@/lib/auth/context';
import RecoveryPanel from '@/components/auth/RecoveryPanel';
import RecoveryCard from '@/components/auth/RecoveryCard';

function LoginContent() {
  const router = useRouter();
  const { user, role, dashboardPath } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showRecoveryCard, setShowRecoveryCard] = useState(false);
  const [firstLaunchData, setFirstLaunchData] = useState<{
    username: string;
    password: string;
    pin: string;
    recoveryCode: string;
  } | null>(null);

  useEffect(() => {
    initializeDatabase().then(async () => {
      setMounted(true);

      const recovery = await db.settings.where('key').equals('admin_recovery_code').first();

      const cardShown = await db.settings.where('key').equals('recovery_card_shown').first();
      if (!cardShown) {
        const admin = await db.pinUsers.where('username').equals('admin').first();

        if (admin && recovery) {
          const adminUser = admin as PinUser;
          const isPwHashed = adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$');
          const isPinHashed = adminUser.pin.startsWith('$2a$') || adminUser.pin.startsWith('$2b$');

          if (!isPwHashed || !isPinHashed) {
            setFirstLaunchData({
              username: adminUser.username,
              password: isPwHashed ? '(deja change)' : adminUser.password,
              pin: isPinHashed ? '(deja change)' : adminUser.pin,
              recoveryCode: recovery.value || 'HUDY-HDRZ-2SNE-PZUA',
            });
          } else {
            await db.settings.add({ key: 'recovery_card_shown', value: 'true' });
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!mounted || !role || !user) return;
    const path = role === 'adherent' ? '/dashboard' : (dashboardPath || '/members');
    router.push(path);
  }, [user, role, router, mounted]);

  const handleCardConfirm = async () => {
    await db.settings.add({ key: 'recovery_card_shown', value: 'true' });
    setShowRecoveryCard(false);
  };

  if (!mounted || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <PinPad onForgotPassword={() => setShowRecovery(true)} />

      {showRecoveryCard && firstLaunchData && (
        <RecoveryCard
          username={firstLaunchData.username}
          password={firstLaunchData.password}
          pin={firstLaunchData.pin}
          recoveryCode={firstLaunchData.recoveryCode}
          onConfirm={handleCardConfirm}
        />
      )}

      {showRecovery && (
        <RecoveryPanel
          onClose={() => setShowRecovery(false)}
          onSuccess={() => setShowRecovery(false)}
        />
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
