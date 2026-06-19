"use client";

import { useCallback, useRef, useState } from "react";

/** Pending state that stays true for the full async work (unlike async useTransition). */
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}

/** One action at a time, keyed by id (payment row, notification row, etc.). */
export function useAsyncActionByKey() {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);

  const run = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
      if (pendingRef.current) return;
      pendingRef.current = key;
      setPendingKey(key);
      try {
        return await fn();
      } finally {
        pendingRef.current = null;
        setPendingKey(null);
      }
    },
    [],
  );

  const isPending = (key: string) => pendingKey === key;

  return { pending: pendingKey !== null, isPending, run };
}
