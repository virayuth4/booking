"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, RefreshCw } from "lucide-react";
import { TicketIcon } from "./ticketIcon";
import Link from "next/link";

/** Reads a cookie value by name (client-side only). */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/** Reads + safely parses the "bookings" array from localStorage. */
function readLocalBookings() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("bookings");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse bookings from localStorage", err);
    return [];
  }
}

export default function MyBookingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Portals need the document to exist, so only render one after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = useCallback(() => {
    setBookings(readLocalBookings());
    setSyncError(null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  // Close on Escape key, and lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeModal]);

  // Optional step 2: hit the backend to consolidate with what's stored locally.
  const syncFromServer = useCallback(async () => {
    const anonId = getCookie("anonId"); // adjust cookie name to match your app
    if (!anonId) {
      setSyncError("No anonymous ID found in cookies — can't reach the server yet.");
      return;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKENDS}/api/booking-link/my-booking/${anonId}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const serverBookings = await res.json();

      // Merge local + server, de-duped by id, server copy wins on conflict.
      const localBookings = readLocalBookings();
      const merged = new Map();
      for (const b of localBookings) merged.set(b.id, b);
      for (const b of serverBookings) merged.set(b.id, b);

      const consolidated = Array.from(merged.values());
      window.localStorage.setItem("bookings", JSON.stringify(consolidated));
      setBookings(consolidated);
    } catch (err) {
      console.error("Failed to sync bookings", err);
      setSyncError("Couldn't reach the server. Showing what's saved on this device.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const modal = isOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-booking-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-900 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="my-booking-title" className="text-base font-semibold">
            My bookings
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-5 py-4">
          {bookings.length === 0 ? (
            <p className="text-sm text-white/60">
              No bookings found on this device yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{booking.placeName}</span>
                    {booking.sectionId && (
                      <span className="text-xs text-white/50">
                        Section {String(booking.sectionId)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Page {booking.pageId} · ID {booking.id.slice(0, 8)}…
                  </p>
                </li>
              ))}
            </ul>
          )}

          {syncError && (
            <p className="mt-3 text-xs text-red-400">{syncError}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-xs text-white/40">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={syncFromServer}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync with server"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <Link
  href="/my-bookings"
  className="flex shrink-0 items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
>
  <TicketIcon className="h-4 w-4" />
  My booking
</Link>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}