"use client";

import { useEffect, useState } from "react";

export default function TelegramDebugPage() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    setInfo({
      href: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      telegramExists: !!window.Telegram,
      webAppExists: !!tg,
      initDataExists: !!tg?.initData,
      startParam: tg?.initDataUnsafe?.start_param || null,
      userAgent: navigator.userAgent,
    });
  }, []);

  return (
    <main className="min-h-screen bg-white p-6 text-black">
      <h1 className="mb-6 text-xl font-bold">
        Telegram Mini App Debug
      </h1>

      <pre className="whitespace-pre-wrap break-all text-sm">
        {JSON.stringify(info, null, 2)}
      </pre>
    </main>
  );
}