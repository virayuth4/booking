"use client";

import { useEffect, useState } from "react";

export default function TelegramGuard({ children, fallback = null }) {
  // Optimistic: the server already saw ?platform=tg, so render immediately
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!window.Telegram?.WebApp?.initData) setOk(false);
  }, []);

  return ok ? children : fallback;
}