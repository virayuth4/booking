"use client";

import { useEffect, useState } from "react";

export default function TelegramGuard({ children, fallback = null }) {
  const [ok, setOk] = useState(null); // null = checking

  useEffect(() => {
    setOk(Boolean(window.Telegram?.WebApp?.initData));
  }, []);

  if (ok === null) return null;       // or a skeleton
  return ok ? children : fallback;
}