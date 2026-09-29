"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/auth/authContext";
import authenticatedFetch from "@/app/auth/authenticatedFetch";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatServiceType(serviceTypeId) {
  if (!serviceTypeId) return "—";
  return serviceTypeId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function initials(name) {
  return (
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "—"
  );
}

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

function StatusBadge({ status }) {
  const key = (status || "pending").toLowerCase();
  const style = STATUS_STYLES[key] || "bg-black/[0.06] text-black/50";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${style}`}>
      {status || "Pending"}
    </span>
  );
}

function BookingRow({ booking }) {
  return (
    <li className="flex flex-col gap-3 px-5 py-4 text-sm sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141414] font-mono text-xs text-[#faf9f6]">
          {initials(booking.full_name)}
        </div>
        <div>
          <p className="font-medium text-[#141414]">{booking.full_name || "—"}</p>
          <p className="text-xs text-black/45">{booking.phone || "—"}</p>
        </div>
      </div>

      <div className="sm:w-36 sm:shrink-0">
        <p className="text-[#141414]">{formatDate(booking.booking_date)}</p>
        <p className="text-xs text-black/45">{formatTime(booking.start_time)}</p>
      </div>

      <div className="sm:w-36 sm:shrink-0 text-black/70">
        {formatServiceType(booking.service_type_id)}
      </div>

      <div className="sm:w-20 sm:shrink-0 text-black/70">
        {booking.guests != null ? `${booking.guests} guest${booking.guests === 1 ? "" : "s"}` : "—"}
      </div>

      <div className="flex-1 text-black/55">{booking.note || ""}</div>

      <div className="sm:shrink-0">
        <StatusBadge status={booking.status} />
      </div>
    </li>
  );
}

export default function BookingsPage() {
  const { slug } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [pageName, setPageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || !slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadBookings() {
      try {
        const res = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/bookings/${slug}`,
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load bookings.");
        const { data, name } = await res.json();
        if (cancelled) return;
        setBookings(Array.isArray(data) ? data : []);
        if (name) setPageName(name);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load bookings for this page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, slug]);

  return (
    <main className="min-h-screen bg-white font-sans text-[#141414] antialiased">
    

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col justify-between gap-2 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Bookings{pageName ? ` — ${pageName}` : ""}
            </h1>
            <p className="mt-2 font-mono text-xs text-black/45">{process.env.NEXT_PUBLIC_FRONTEND}/{slug}</p>
          </div>
          <p className="text-sm text-black/55">
            {loading || authLoading ? "Loading…" : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="mt-8">
          {loading || authLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-14 rounded-xl border border-black/10 bg-white" />
              <div className="h-14 rounded-xl border border-black/10 bg-white" />
              <div className="h-14 rounded-xl border border-black/10 bg-white" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-black/55">
              {error}
            </div>
          ) : !currentUser ? (
            <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-black/55">
              Please sign in to see bookings.
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-sm text-black/55">
              No bookings yet for this page.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
              <div className="hidden border-b border-black/10 px-5 py-3 text-xs text-black/40 sm:flex sm:items-center sm:gap-4">
                <span className="sm:w-48 sm:shrink-0">Customer</span>
                <span className="sm:w-36 sm:shrink-0">Date &amp; time</span>
                <span className="sm:w-36 sm:shrink-0">Service</span>
                <span className="sm:w-20 sm:shrink-0">Guests</span>
                <span className="flex-1">Note</span>
                <span className="sm:shrink-0">Status</span>
              </div>
              <ul className="divide-y divide-black/[0.06]">
                {bookings.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}