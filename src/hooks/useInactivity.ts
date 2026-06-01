'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useInactivity(timeout = 20000): boolean {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsInactive(true);
      }
    }, timeout);
  }, [timeout, clearTimer]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const;

    const handleActivity = () => {
      setIsInactive(false);
      startTimer();
    };

    for (const ev of events) {
      window.addEventListener(ev, handleActivity, { passive: true });
    }
    startTimer();

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, handleActivity);
      }
      clearTimer();
    };
  }, [startTimer, clearTimer]);

  return isInactive;
}
