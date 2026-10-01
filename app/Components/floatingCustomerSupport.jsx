"use client";

import { TELEGRAM_SUPPORT_URL } from "@/lib/constants";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function TelegramFloat() {
  const [show, setShow] = useState(false); // mounted (after 3s)
  const [entered, setEntered] = useState(false); // fade/slide in
  const [expanded, setExpanded] = useState(false); // long vs short label
  const [widths, setWidths] = useState(null);
  const fullRef = useRef(null);
  const shortRef = useRef(null);

  // Mount after 3s
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Measure both labels, then start the entrance on the next frames
  useLayoutEffect(() => {
    if (!show || !fullRef.current || !shortRef.current) return;
    setWidths({
      full: fullRef.current.offsetWidth,
      short: shortRef.current.offsetWidth,
    });
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setEntered(true);
        setExpanded(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [show]);

  // Collapse 5s after it has expanded
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 5000);
    return () => clearTimeout(timer);
  }, [expanded]);

  if (!show) return null;

  return (
    <a
      href={TELEGRAM_SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Speak with our support on Telegram"
      className={`fixed bottom-10 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#141414] px-5 py-3 text-sm font-medium text-white shadow-xl shadow-black/20 transition duration-500 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414] motion-reduce:transition-none ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.6 13.2 2 11.8c-1-.3-1-1 .2-1.5L20.2 3.4c.8-.3 1.6.2 1.7.9Z" />
      </svg>

      {/* Width animates between the two label widths; labels crossfade */}
      <span
        className="relative block h-5 overflow-hidden transition-[width] duration-500 ease-in-out motion-reduce:transition-none"
        style={
          widths ? { width: expanded ? widths.full : widths.short } : undefined
        }
      >
        <span
          ref={fullRef}
          className={`absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300 motion-reduce:transition-none ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          Speak with our support
        </span>
        <span
          ref={shortRef}
          aria-hidden={expanded}
          className={`absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300 motion-reduce:transition-none ${
            expanded ? "opacity-0" : "opacity-100"
          }`}
        >
          Telegram
        </span>
      </span>
    </a>
  );
}