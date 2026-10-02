"use client";

import { useEffect, useState } from "react";
import { getReserveLabel } from "@/lib/dynamicReserveHeader";

const BOT = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;

function buildTelegramLink(slug) {
  return `${BOT}?startapp=${encodeURIComponent(slug)}`;
}

export default function TelegramBookingSwitch({
  slug,
  name,
  category,
  isTelegram, // from the server: platform === "tg"
  children,
}) {
  // Start from the server's guess so something renders immediately
  const [inTg, setInTg] = useState(isTelegram);

  useEffect(() => {
    const check = () => Boolean(window.Telegram?.WebApp?.initData);

    if (check()) {
      setInTg(true);
      return;
    }

    // Telegram script loaded but no initData -> definitely a normal browser
    if (window.Telegram?.WebApp) {
      setInTg(false);
      return;
    }

    // Script not loaded yet: poll briefly before giving up
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (check()) {
        clearInterval(id);
        setInTg(true);
      } else if (tries >= 15) {
        clearInterval(id);
        setInTg(false);
      }
    }, 100);

    return () => clearInterval(id);
  }, []);

  if (inTg) return children;

  return (
    <section className="w-full bg-white px-2 py-6 text-center sm:py-8">
      <div className="flex flex-col items-center">
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#141414] sm:text-3xl">
          {getReserveLabel(category)}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-black/60">
          Reservations at {name} are made in our Telegram app.
        </p>

        {BOT ? (
          <a
            href={buildTelegramLink(slug)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black/80 active:scale-[0.98] sm:w-auto sm:min-w-64"
          >
            Reserve {name}
          </a>
        ) : (
          <p className="mt-6 text-sm text-black/40">
            Telegram booking is unavailable.
          </p>
        )}
      </div>
    </section>
  );
}