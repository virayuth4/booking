"use client";

import { useState, useRef, useEffect } from "react";

/**
 * BookingTelegramNotify
 *
 * Lets a customer link their Telegram account to a single booking so they
 * get notified (via the `bk_<bookingId>` /start deep link + webhook) when
 * the merchant accepts/declines. Polls a public status endpoint until the
 * booker taps "Notify me here" inside Telegram.
 *
 * Props:
 * - bookingId (string, required): the booking to link
 * - telegramBotUsername (string, required): bot username, no "@" or "https://t.me/"
 * - onConnected? (chatId: string) => void: fires once when linking succeeds
 * - className? (string): extra classes on the outer wrapper
 */
export default function BookingTelegramNotify({
  bookingId,
  telegramBotUsername,
  onConnected,
  className = "",
}) {
  const [telegramChatId, setTelegramChatId] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState("idle"); // "idle" | "linking" | "connected" | "timed_out"
  const [telegramDeepLink, setTelegramDeepLink] = useState("");
  const pollTimerRef = useRef(null);

  const stopPollingOnly = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPollingOnly();
  }, []);

  // ---------------------------------------------------------------------------
  // Poll booking status for telegram_chat_id
  // ---------------------------------------------------------------------------
  const checkBookingStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking/${bookingId}/telegram-status`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) return false;
      const data = await res.json();

      if (data.connected && data.chatId) {
        setTelegramChatId(String(data.chatId));
        setTelegramStatus("connected");
        stopPollingOnly();
        onConnected?.(String(data.chatId));
        return true;
      }
    } catch (err) {
      console.error("Booking status polling failed:", err);
    }
    return false;
  };

  // Check immediately if window refocuses from Telegram
  useEffect(() => {
    const onFocus = () => {
      if (telegramStatus === "linking") checkBookingStatus();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramStatus]);

  const handleNotifyMe = () => {
    if (!bookingId || !telegramBotUsername) return;

    stopPollingOnly();
    setTelegramStatus("linking");

    const deepLink = `https://t.me/${telegramBotUsername}?start=bk_${bookingId}`;
    setTelegramDeepLink(deepLink);
    window.open(deepLink, "_blank", "noopener,noreferrer");

    // Poll every 2.5s for up to ~65s
    let attempts = 0;
    pollTimerRef.current = setInterval(async () => {
      attempts += 1;
      const isConnected = await checkBookingStatus();

      if (isConnected) {
        stopPollingOnly();
      } else if (attempts >= 26) {
        stopPollingOnly();
        setTelegramStatus("timed_out");
      }
    }, 2500);
  };

  const handleReopenTelegram = () => {
    if (telegramDeepLink) {
      window.open(telegramDeepLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCancelLinking = () => {
    stopPollingOnly();
    setTelegramStatus("idle");
  };

  return (
    <div className={`rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#374151]">Telegram updates</span>

            {telegramChatId ? (
              <span className="inline-flex items-center rounded-full bg-[#15803D]/10 px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                ● Connected
              </span>
            ) : telegramStatus === "linking" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Waiting for confirmation…
              </span>
            ) : telegramStatus === "timed_out" ? (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                ✕ Timed out
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
                ○ Not connected
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-[#6B7280]">
            {telegramChatId
              ? "We'll message you here as soon as your booking is confirmed."
              : telegramStatus === "linking"
              ? "Tap 'Notify me here' inside the Telegram bot."
              : telegramStatus === "timed_out"
              ? "Didn't receive confirmation in time. Tap Retry."
              : "Get a Telegram message as soon as this booking is accepted."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {telegramChatId ? null : telegramStatus === "linking" ? (
            <>
              <button
                type="button"
                onClick={handleReopenTelegram}
                className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-[#15803D] hover:text-[#15803D] transition"
              >
                Reopen Telegram
              </button>
              <button
                type="button"
                onClick={handleCancelLinking}
                className="rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNotifyMe}
              className="inline-flex items-center gap-2 rounded-md bg-[#229ED9] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#1c8ac0] transition"
            >
              {telegramStatus === "timed_out" ? "Retry" : "Notify me on Telegram"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}