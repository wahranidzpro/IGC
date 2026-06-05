'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

export default function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [blink, setBlink] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const show = useCallback((msg: string) => {
    clearTimers();
    setMessage(msg);
    setVisible(true);
    setBlink(true);
    timersRef.current.push(setTimeout(() => setBlink(false), 3000));
    timersRef.current.push(setTimeout(() => setVisible(false), 5000));
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      show('Connecté — synchronisation...');
      import('@/lib/offline/queue').then(m => m.processQueue());
    };
    const goOffline = () => { setOnline(false); show('Déconnecté — mode hors ligne'); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); clearTimers(); };
  }, [show]);

  if (!visible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${blink ? 'animate-pulse' : ''}`}>
      <div className={`flex items-center justify-between px-6 py-3 text-white text-sm font-medium ${online ? 'bg-green-600' : 'bg-red-600'}`}>
        <div className="flex items-center gap-2">
          {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {message}
        </div>
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-white/20 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
