'use client';

import { FormatDisplayDate, FormatDisplayTime } from '@/lib/formatTime';
import { isGroupedItems } from '@base-ui/react/internals/resolveValueLabel';
import { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indicator: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    indicator: 'bg-amber-500 animate-pulse',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    indicator: 'bg-rose-500',
  },
};

function TelegramButton({ username }) {
  if (!username) return null;
  const handle = username.replace(/^@/, '');

  return (
    <a
      href={`${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
      onClick={(e) => e.stopPropagation()}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M21.05 3.487a1.5 1.5 0 0 0-1.523-.263L2.85 9.61c-1.133.44-1.126 2.036.01 2.468l4.44 1.68 1.71 5.487c.207.665 1.04.883 1.539.4l2.55-2.463 4.464 3.32c.816.607 1.985.166 2.204-.822l3.29-14.86a1.5 1.5 0 0 0-.008-.833zM9.06 13.51l8.4-6.24c.2-.15.44.11.27.29L11 14.33l-.27 3.12-1.67-3.94z" />
      </svg>
      Message store
    </a>
  );
}

export default function BookingList({ initialBookings, anonId }) {
  const [bookings, setBookings] = useState(
    Array.isArray(initialBookings) ? initialBookings : [initialBookings].filter(Boolean)
  );

  // Poll for updates if any booking is still pending confirmation
  useEffect(() => {
    const hasPending = bookings.some((b) => b.status === 'pending');
    if (!hasPending || !anonId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/bookings/anon/${anonId}`
        );
        if (res.ok) {
          const data = await res.json();
          const updated = Array.isArray(data.booking) ? data.booking : [data.booking];
          setBookings(updated);
        }
      } catch (err) {
        console.error('Failed to poll booking updates:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [anonId, bookings]);

  if (!bookings || bookings.length === 0) {
    return (
      <div className="py-8 text-center text-sm font-normal text-black/40">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((item) => {
        const statusMeta = STATUS_CONFIG[item.status] || {
          label: item.status,
          badge: 'bg-zinc-50 text-zinc-700 border-zinc-200',
          indicator: 'bg-zinc-400',
        };

        return (
          <div
            key={item.id}
            className="rounded-xl border border-black/10 bg-[#FAFAFA] p-4 transition-colors hover:border-black/20"
          >
            {/* Header: Merchant Name & Status Badge */}
            <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#141414]">
                    {item.page_name || item.full_name}
                  </h2>
                 
                </div>
                <p className="mt-0.5 text-xs text-black/50">
                  Booked by {item.full_name}
                  {item.phone ? ` · ${item.phone}` : ''}
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.indicator}`} />
                {statusMeta.label}
              </span>
            </div>

            {/* Core Details Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-y-3.5 gap-2.5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Date
                </p>
                <p className="mt-1 text-sm font-semibold text-[#141414]">
                  {FormatDisplayDate(item.booking_date)}
                </p>
              </div>

                 <div>
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Party Size
                </p>
                <p className="mt-1 text-sm font-semibold text-[#141414]">
                  {item.guests} {item.guests === 1 ? 'Guest' : 'Guests'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Time
                </p>
                <p className="mt-1 text-sm font-semibold text-[#141414]">
                  {FormatDisplayTime(item.start_time)}
                </p>
              </div>

           

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Area
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#141414]">
                  {item.service_type_id?.replace(/-/g, ' ') || 'General'}
                </p>
              </div>
            </div>

            {/* Notes if provided */}
            {item.note && (
              <div className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-xs text-black/70">
                <span className="font-semibold text-[#141414]">Note: </span>
                {item.note}
              </div>
            )}

            {/* Merchant contact: Telegram message + phone below */}
            {(item.page_telegram || item.page_phone) && (
              <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-black/40">
                    Contact {item.page_name}
                  </span>
                  <TelegramButton username={item.page_telegram} />
                </div>
                {item.page_phone && (
                  <p className="mt-1.5 text-xs text-black/60">
                    {item.page_phone}
                  </p>
                )}
              </div>
            )}

            {/* Reference ID footer */}
            <div className="mt-3.5 flex items-center justify-between border-t border-black/10 pt-2.5 text-xs font-medium uppercase tracking-wider text-black/40">
              <span>Ref: {item.id}</span>
              <span>
                Booked {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}