"use client";

import { useEffect } from "react";

export default function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    const safe = (fn) => {
      try { fn(); } catch {}
    };
    safe(() => tg.setBackgroundColor("#ffffff"));
    safe(() => tg.setHeaderColor("#141414"));
    safe(() => tg.setBottomBarColor("#ffffff"));

    document.documentElement.style.backgroundColor = "#ffffff";
    document.body.style.backgroundColor = "#ffffff";
  }, []);

  return null;
}