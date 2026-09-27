"use client";

import { useState, useEffect, useRef } from "react";

const ANON_ID_KEY = "anonId";
const BOOKING_ID = "bookings";

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
    const sorted = [...bookings].sort(
      (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
    );
    return sorted[0]?.id ?? null;
  } catch (error) {
    console.error("Failed to parse bookings from localStorage:", error);
    return null;
  }
}

export default function BookingTelegramNotify({
  telegramBotUsername,
  className = "",
}) {
  const [anonId, setAnonId] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [status, setStatus] = useState("idle"); // "idle" | "linking" | "connected" | "timed_out"
  const [deepLink, setDeepLink] = useState("");
  const pollTimerRef = useRef(null);

  useEffect(() => {
    setAnonId(getOrCreateAnonId());
    setBookingId(getLatestBookingId());
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  // Check on regaining focus too — mirrors the merchant flow
  useEffect(() => {
    const onFocus = () => {
      if (status === "linking" && bookingId) {
        checkStatus(bookingId);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [status, bookingId]);

  // On mount, if a previous session already connected, reflect that
  useEffect(() => {
    if (bookingId) checkStatus(bookingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const checkStatus = async (id) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-notify-status/${id}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) return false;
      const data = await res.json();
      if (data.connected) {
        setStatus("connected");
        stopPolling();
        return true;
      }
    } catch (err) {
      console.error("Booking status poll failed:", err);
    }
    return false;
  };

  const handleNotifyMe = () => {
    if (!telegramBotUsername || !bookingId) return;

    const startPayload = `bk_${bookingId}`;
    const link = `https://t.me/${telegramBotUsername}?start=${startPayload}`;
    setDeepLink(link);

    window.open(link, "_blank", "noopener,noreferrer");
    setStatus("linking");

    stopPolling();
    let attempts = 0;
    pollTimerRef.current = setInterval(async () => {
      attempts += 1;
      const isConnected = await checkStatus(bookingId);
      if (isConnected || attempts >= 26) {
        stopPolling();
        if (!isConnected) setStatus("timed_out");
      }
    }, 2500);
  };

  const handleReopen = () => {
    if (deepLink) window.open(deepLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={` ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#374151]">Telegram updates</span>
            {status === "connected" && (
              <span className="inline-flex items-center rounded-full bg-[#15803D]/10 px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                ● Connected
              </span>
            )}
            {status === "linking" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Waiting for confirmation…
              </span>
            )}
            {status === "timed_out" && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                ✕ Timed out
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            {status === "connected"
              ? "You're all set — we'll message you here as soon as this booking is confirmed."
              : status === "linking"
              ? 'Tap "Start" in Telegram to confirm.'
              : status === "timed_out"
              ? "Didn't receive confirmation in time. Try again."
              : "Get a Telegram message as soon as this booking is accepted."}
          </p>
        </div> */}
      
        <button
          type="button"
          onClick={status === "linking" ? handleReopen : handleNotifyMe}
          disabled={!anonId || !bookingId || status === "connected"}
        className="mt-3 rounded-full border bg-[#229ED9] px-5 py-3 text-sm font-medium text-white transition hover:border-black/20"
        >
          {status === "connected"
            ? "Connected ✓"
            : status === "linking"
            ? "Reopen Telegram"
            : status === "timed_out"
            ? "Retry"
            : "Notify me on Telegram"}
        </button>
      </div>
    </div>
  );
}