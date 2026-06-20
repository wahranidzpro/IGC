'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInactivity } from '@/hooks/useInactivity';

interface ScreenSaverProps {
  delayMs?: number;
}

export default function ScreenSaver({ delayMs = 20000 }: ScreenSaverProps) {
  const [mounted, setMounted] = useState(false);
  const isInactive = useInactivity(delayMs);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInactive) return;
    const interval = setInterval(() => setTime(new Date()), 1000);
    document.body.classList.add('screensaver-active');
    return () => {
      clearInterval(interval);
      document.body.classList.remove('screensaver-active');
    };
  }, [isInactive]);

  if (!mounted || !isInactive) return null;

  const dateStr = time.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = time.toLocaleTimeString('fr-FR');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        cursor: 'none',
      }}
    >
      {/* Background rotating logo */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <Image
          src="/logo-transparent.png"
          alt=""
          width={500}
          height={500}
          className="w-[40vw] max-w-[500px] opacity-[0.25] animate-earth-rotate"
          style={{ filter: 'drop-shadow(0 0 80px rgba(249,115,22,0.15))' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 animate-float select-none px-4">
        <p className="text-xs md:text-sm uppercase tracking-[0.25em] font-light text-white/60">
          {dateStr}
        </p>

        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-thin tabular-nums text-white leading-none animate-glow-pulse">
          {timeStr}
        </h1>
      </div>
    </div>
  );
}
