"use client";

import { useState, useEffect } from "react";

const ANON_ID_KEY = "anonId";
const BOOKING_ID = "bookings"

// Reads the persistent anonymous id from localStorage, creating one if it
// doesn't exist yet. This id is what lets the bot's webhook tie a Telegram
// chat back to this browser/customer without any login.
function getOrCreateAnonId() {
  if (typeof window === "undefined") return null;

  let anonId = window.localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    anonId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    window.localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

function getLatestBookingId() {
  if (typeof window === "undefined") return null;

  try {
    const rawData = window.localStorage.getItem(BOOKING_ID);
    if (!rawData) return null;

    const bookings = JSON.parse(rawData);
    if (!Array.isArray(bookings) || bookings.length === 0) return null;

    // Option A: If new bookings are always pushed to the end:
    // return bookings[bookings.length - 1]?.id ?? null;

    // Option B (Safest): Sort by createdAt timestamp descending
    const sorted = [...bookings].sort(
      (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
    );

    return sorted[0]?.id ?? null;
  } catch (error) {
    console.error("Failed to parse bookings from localStorage:", error);
    return null;
  }
}

/**
 * BookingTelegramNotify
 *
 * Single job: open the Telegram bot with a /start payload that carries the
 * booking id + this browser's anonId (from localStorage). That's it — no
 * backend fetch, no status polling. The bot's webhook reads the payload and
 * does the linking on its own side.
 *
 * Props:
 * - bookingId (string, required)
 * - telegramBotUsername (string, required): no "@" or "https://t.me/"
 * - className? (string): extra classes on the outer wrapper
 */
export default function BookingTelegramNotify({
  telegramBotUsername,
  className = "",
}) {
  const [anonId, setAnonId] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [opened, setOpened] = useState(false);

useEffect(() => {
    setAnonId(getOrCreateAnonId());
    setBookingId(getLatestBookingId());
  }, []);

const handleNotifyMe = () => {
    console.log("BookingId:", bookingId);
    if (!telegramBotUsername || !bookingId) return;

    const startPayload = `bk_${bookingId}`;
    const deepLink = `https://t.me/${telegramBotUsername}?start=${startPayload}`;

    window.open(deepLink, "_blank", "noopener,noreferrer");
    setOpened(true);
  };
  return (
    <div className={`rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-sm font-medium text-[#374151]">Telegram updates</span>
          <p className="mt-1 text-xs text-[#6B7280]">
            {opened
              ? 'Check Telegram and tap "Notify me here" to confirm.'
              : "Get a Telegram message as soon as this booking is accepted."}
          </p>
        </div>

      <button
          type="button"
          onClick={handleNotifyMe}
          disabled={!anonId || !bookingId}
          className="inline-flex items-center gap-2 rounded-md bg-[#229ED9] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#1c8ac0] transition disabled:opacity-50 shrink-0"
        >
          {opened ? "Reopen Telegram" : "Notify me on Telegram"}
        </button>
      </div>
    </div>
  );
}