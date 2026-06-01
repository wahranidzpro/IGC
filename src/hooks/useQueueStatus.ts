'use client';

import { useState, useEffect, useRef } from 'react';
import { getQueueStatus, retryFailed, clearCompleted } from '@/lib/offline/queue';

export interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  byPriority: {
    critical: number;
    important: number;
    heavy: number;
  };
}

const defaultStatus: QueueStatus = {
  pending: 0,
  processing: 0,
  failed: 0,
  completed: 0,
  byPriority: { critical: 0, important: 0, heavy: 0 },
};

export function useQueueStatus(refreshIntervalMs = 5000) {
  const [status, setStatus] = useState<QueueStatus>(defaultStatus);
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const s = await getQueueStatus();
        setStatus(s);
        setIsOnline(navigator.onLine);
      } catch {
        setStatus(defaultStatus);
      }
    };

    refresh();
    intervalRef.current = setInterval(refresh, refreshIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshIntervalMs]);

  return { status, isOnline };
}

export function useQueueActions() {
  const retryAll = async () => {
    const count = await retryFailed();
    return count;
  };

  const clearOld = async (olderThanMs?: number) => {
    const count = await clearCompleted(olderThanMs);
    return count;
  };

  return { retryAll, clearOld };
}
