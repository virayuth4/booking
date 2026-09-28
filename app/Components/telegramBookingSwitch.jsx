"use client";

import { TelegramIcon } from "@/lib/icons";
import { useEffect, useState } from "react";

const BOT = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;
const APP = process.env.NEXT_PUBLIC_TELEGRAM_APP_SHORT_NAME; // optional

function buildTelegramLink(slug) {
  return `${process.env.NEXT_PUBLIC_TG_MINIAPP_LINK}?startapp=${encodeURIComponent(slug)}`;
}

function inTelegram() {
  // initData is only non-empty when launched from inside Telegram
  return Boolean(window.Telegram?.WebApp?.initData);
}

export default function TelegramBookingSwitch({ slug, name, children }) {
  const [status, setStatus] = useState("checking"); // checking | telegram | web

  useEffect(() => {
    if (inTelegram()) {
      setStatus("telegram");
      return;
    }
    // Give the Telegram script a moment to load before deciding it's the web
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (inTelegram()) {
        clearInterval(id);
        setStatus("telegram");
      } else if (tries >= 15) {
        clearInterval(id);
        setStatus("web");
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  if (status === "checking") {
    return <div className="min-h-40 w-full" aria-hidden />;
  }

if (status === "checking") return <div className="min-h-40 w-full" aria-hidden />;
  if (status === "telegram") return children;

return (
  <section className="w-full bg-white px-2 py-6 text-center sm:py-8">
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#229ED9]/10 text-[#229ED9]">
        <TelegramIcon className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#141414] sm:text-3xl">
        Reserve a table
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-black/60">
        Reservations at {name} are made in our Telegram app. It takes less
        than a minute.
      </p>

      {BOT ? (
        <a
          href={buildTelegramLink(slug)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1c8ec6] active:scale-[0.98] sm:w-auto sm:min-w-64"
        >
          <TelegramIcon className="h-4 w-4" />
          Reserve on Telegram
        </a>
      ) : (
        <p className="mt-6 text-sm text-black/40">
          Telegram booking is unavailable.
        </p>
      )}

      <p className="mt-4 text-xs text-black/40">Opens in Telegram</p>
    </div>
  </section>
);
}