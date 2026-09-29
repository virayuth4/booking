"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TelegramEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [logs, setLogs] = useState([]);
  const startedAt = useRef(Date.now());

  const log = (msg, data) => {
    const line = `[+${Date.now() - startedAt.current}ms] ${msg}${
      data !== undefined ? " " + JSON.stringify(data) : ""
    }`;
    console.log("[tg-entry]", line);
    setLogs((l) => [...l, line]);
  };

  useEffect(() => {
    log("mounted", {
      href: window.location.href,
      ua: navigator.userAgent.slice(0, 80),
    });

    // Fallback: Telegram also puts the param in the URL hash/query
    const fromUrl = () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      return (
        hash.get("tgWebAppStartParam") ||
        query.get("tgWebAppStartParam") ||
        query.get("startapp")
      );
    };

    let tries = 0;
    const MAX_TRIES = 50; // 5s instead of 1.5s

    const id = setInterval(() => {
      tries += 1;
      const tg = window.Telegram?.WebApp;
      const slug = tg?.initDataUnsafe?.start_param || fromUrl();

      if (tries === 1 || tries % 10 === 0) {
        log(`try ${tries}`, {
          hasTelegramObj: !!window.Telegram,
          hasWebApp: !!tg,
          platform: tg?.platform,
          version: tg?.version,
          initDataLen: tg?.initData?.length ?? 0,
          startParam: tg?.initDataUnsafe?.start_param ?? null,
          slugFromUrl: fromUrl() ?? null,
        });
      }

      if (tg?.initData && slug) {
        clearInterval(id);
        tg.ready?.();
        log("success, redirecting", { slug });
        router.replace(`/${encodeURIComponent(slug)}/book`);
      } else if (tries >= MAX_TRIES) {
        clearInterval(id);
        log("gave up", {
          reason: !window.Telegram
            ? "telegram-web-app.js not loaded"
            : !tg?.initData
            ? "no initData (not opened inside Telegram?)"
            : "no start_param (opened without ?startapp=)",
        });
        setFailed(true);
      }
    }, 100);

    return () => clearInterval(id);
  }, [router]);

  const showDebug =
    failed ||
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" &&
      window.location.search.includes("debug=1"));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-sm text-black/50">
      <p>
        {failed ? "Open this from a restaurant's booking page." : "Loading…"}
      </p>
      {showDebug && (
        <pre className="max-w-full overflow-auto rounded bg-black/5 p-3 text-xs text-black/70 whitespace-pre-wrap">
          {logs.join("\n")}
        </pre>
      )}
    </main>
  );
}