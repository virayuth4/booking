"use client";

import { useCallback, useState } from "react";

export function useWriteAccessGate() {
  const [blocked, setBlocked] = useState(false);
  const [asking, setAsking] = useState(false);

  // Resolves true if we can message the user, false if they denied
  const ensureAccess = useCallback(() => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;

      // Not in Telegram, or client too old to support it: don't block
      if (!tg || !tg.isVersionAtLeast?.("6.9")) return resolve(true);

      // Already granted (returning user)
      if (tg.initDataUnsafe?.user?.allows_write_to_pm) {
        setBlocked(false);
        return resolve(true);
      }

      setAsking(true);
      tg.requestWriteAccess((allowed) => {
        setAsking(false);
        setBlocked(!allowed);
        resolve(!!allowed);
      });
    });
  }, []);

  const gate = blocked ? (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-8 text-center">
      <h2 className="text-xl font-semibold text-[#141414]">
        Allow messages to confirm your booking
      </h2>
      <p className="mt-2 max-w-xs text-sm text-black/50">
        We need permission to message you here so we can send your booking
        confirmation and reminders.
      </p>
      <button
        onClick={() => ensureAccess()}
        disabled={asking}
        className="mt-6 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        Allow
      </button>
    </div>
  ) : null;

  return { ensureAccess, gate };
}