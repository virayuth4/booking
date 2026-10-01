'use client';

import { simplerFormatDate } from '@/lib/formatDate';
import { useEffect, useState } from 'react';

function StatusIcon({ name, className }) {
  const paths = {
    clock: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    check: 'm5 13 4 4L19 7',
    x: 'M6 6l12 12M18 6 6 18',
    info: 'M12 8h.01M11 12h1v5h1m9-5a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  };
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
      <path d={paths[name]} />
    </svg>
  );
}

const CONFIRMED = {
  title: 'Your table is confirmed',
  description: 'The venue has accepted your booking. Show this page if they ask for your details.',
  icon: 'check',
  iconWrap: 'bg-emerald-50 text-emerald-600',
};

const STATUS_CONTENT = {
  pending: {
    title: 'Waiting for the venue to confirm',
    description: "Your table isn't reserved until they accept. This page updates on its own.",
    icon: 'clock',
    iconWrap: 'bg-amber-50 text-amber-600',
    live: true,
  },
  accepted: CONFIRMED,
  confirmed: CONFIRMED,
  declined: {
    title: "The venue couldn't take this booking",
    description: 'Try a different time or date, or contact the venue directly.',
    icon: 'x',
    iconWrap: 'bg-red-50 text-red-600',
  },
};



export default function StatusPoller({ bookingId, initialBooking }) {
  const [booking, setBooking] = useState(initialBooking);

  useEffect(() => {
    // Only worth polling while the merchant hasn't acted yet.
    if (booking.status !== 'pending') return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking/id/${bookingId}`,
          { cache: 'no-store' }
        );
   
        if (!res.ok) return;
        const { booking: fresh } = await res.json();
        if (!cancelled) setBooking(fresh);
      } catch {
        // Silent — next interval will retry. Don't disrupt the page over a flaky poll.
      }
    };

    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId, booking.status]);

  const content = STATUS_CONTENT[booking.status] ?? {
    title: `Status: ${booking.status}`,
    description: 'Contact the venue if you have questions about this booking.',
    icon: 'info',
    iconWrap: 'bg-black/5 text-black/50',
  };

  const rows = [
    { label: 'Date', value: simplerFormatDate(booking.date) },
    { label: 'Time', value: booking.time },
    { label: 'Party size', value: `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}` },
    booking.sectionName && { label: 'Area', value: booking.sectionName },
    booking.serviceTypeName && { label: 'Service', value: booking.serviceTypeName },
    { label: 'Booked under', value: booking.fullName },
    { label: 'Phone Booked under', value: booking.contact },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* Status */}
      <div className="flex items-start gap-3" role="status" aria-live="polite">
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${content.iconWrap}`}>
          <StatusIcon name={content.icon} className="h-5 w-5" />
          {content.live && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-amber-500" />
            </span>
          )}
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#141414]">{content.title}</h2>
          <p className="mt-1 text-sm leading-6 text-black/55">{content.description}</p>
        </div>
      </div>

      {/* Booking summary */}
      <dl className="divide-y divide-black/5 rounded-xl border border-black/10 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-black/45">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-[#141414]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {booking.note && (
        <div className="rounded-xl bg-black/[0.03] px-4 py-3">
          <p className="text-sm text-black/45">Your note</p>
          <p className="mt-1 text-sm leading-6 text-[#141414]">{booking.note}</p>
        </div>
      )}
    </div>
  );
}