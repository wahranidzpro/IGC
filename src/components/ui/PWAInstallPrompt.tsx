'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Apple } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSamsung, setIsSamsung] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const dismissedSession = sessionStorage.getItem('pwa-dismissed');
    if (dismissedSession) {
      setDismissed(true);
      return;
    }

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const samsung = /SamsungBrowser/i.test(ua);
    setIsIOS(ios);
    setIsSamsung(samsung);

    if (!ios) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [isAuthenticated]);

  const triggerShow = useCallback((delay: number) => {
    if (dismissed || !isAuthenticated) return;

    let hasInteracted = false;
    const onInteract = () => { hasInteracted = true; };
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });

    const timer = setTimeout(() => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('touchstart', onInteract);
      if (hasInteracted) {
        setShow(true);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, [dismissed, isAuthenticated]);

  useEffect(() => {
    const cleanup = triggerShow(8000);
    return cleanup;
  }, [triggerShow]);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        dismiss();
      } else {
        dismiss();
      }
      setDeferredPrompt(null);
    }
  };

  return show ? (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={dismiss} />
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-[9999] animate-slide-up">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative p-4 pb-3">
            <button onClick={dismiss} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors touch-manipulation" aria-label="Fermer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                {isIOS ? <Apple className="w-5 h-5 text-orange-400" /> : <Smartphone className="w-5 h-5 text-orange-400" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white leading-tight">INSTALLER L'APPLICATION</h3>
                <p className="text-xs text-gray-400 mt-0.5">Acces rapide depuis votre ecran d'accueil</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-xl mb-3">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-400 text-[10px] font-bold">i</span>
              </div>
              <p className="text-xs text-gray-300 leading-snug">
                {isIOS
                  ? 'Appuyez sur le bouton Partager puis "Sur l\'ecran d\'accueil"'
                  : isSamsung
                    ? 'Appuyez sur le menu puis "Ajouter a l\'ecran d\'accueil"'
                    : 'Installez l\'application pour un acces rapide'}
              </p>
            </div>

            {!isIOS ? (
              <button
                onClick={install}
                disabled={!deferredPrompt}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Download className="w-4 h-4" />
                Installer maintenant
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <div className="flex items-center gap-1 text-orange-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-xs text-orange-300">Partager → Sur l'ecran d'accueil</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  ) : null;
}
