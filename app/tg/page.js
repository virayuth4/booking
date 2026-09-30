"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TelegramEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      const tg = window.Telegram?.WebApp;
      const slug = tg?.initDataUnsafe?.start_param;

      if (tg?.initData && slug) {
        clearInterval(id);
        router.replace(`/${encodeURIComponent(slug)}/book?platform=tg`);
      } else if (tries >= 15) {
        clearInterval(id);
        setFailed(true);
      }
    }, 100);
    return () => clearInterval(id);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-sm text-black/50">
      {failed ? "Open this from a restaurant's booking page." : "Loading…"}
    </main>
  );
}