"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TelegramEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const slug = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (slug) router.replace(`/${slug}?booking=true`);
    else setFailed(true);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-sm text-black/50">
      {failed ? "Open this from a restaurant's booking page." : "Loading…"}
    </main>
  );
}