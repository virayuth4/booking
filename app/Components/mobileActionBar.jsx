"use client";

import { useEffect, useState } from "react";
import MyBookingButton from "./myBookingButton";

function CalendarIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function TelegramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.94 4.6 18.6 20.36c-.25 1.1-.9 1.37-1.83.85l-5.06-3.73-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16L18.03 6.5c.42-.37-.1-.58-.65-.21L6.72 13.36l-4.97-1.55c-1.08-.34-1.1-1.08.23-1.6L20.6 3.36c.9-.33 1.68.21 1.34 1.24z" />
    </svg>
  );
}

/**
 * Detects whether the on-screen (virtual) keyboard is likely open,
 * by comparing the visualViewport height to the layout viewport height.
 * Only meaningful on touch devices; returns false on desktop / unsupported browsers.
 */
function useMobileKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;

    const handleResize = () => {
      const heightDiff = window.innerHeight - vv.height;
      setIsKeyboardOpen(heightDiff > 150);
    };

    vv.addEventListener("resize", handleResize);
    handleResize();

    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  return isKeyboardOpen;
}

export default function MobileActionBar({ telegramHref }) {
  const isKeyboardOpen = useMobileKeyboardOpen();

  if (isKeyboardOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#141414]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a
          href="#booking"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#faf9f6] px-4 py-2.5 text-sm font-medium text-[#141414] transition hover:bg-white"
        >
          <CalendarIcon className="h-4 w-4" />
          Reserve
        </a>
        {/* <MyBookingButton /> */}
        {telegramHref && (
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message on Telegram"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <TelegramIcon className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}