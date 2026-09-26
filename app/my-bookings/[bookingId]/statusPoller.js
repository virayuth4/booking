'use client';

import { useEffect, useState } from 'react';

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  accepted: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700' },
  declined: { label: 'Declined', className: 'bg-red-50 text-red-700' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

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

  const statusInfo = STATUS_STYLES[booking.status] ?? {
    label: booking.status,
    className: 'bg-black/5 text-black/60',
  };

  return (
    <div className="flex flex-col gap-4">
      <span
        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>

      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-black/40">Date</dt>
        <dd className="text-right font-medium text-[#141414]">{formatDate(booking.date)}</dd>

        <dt className="text-black/40">Time</dt>
        <dd className="text-right font-medium text-[#141414]">{booking.time}</dd>

        <dt className="text-black/40">Guests</dt>
        <dd className="text-right font-medium text-[#141414]">{booking.guests}</dd>

        {booking.sectionName && (
          <>
            <dt className="text-black/40">Location</dt>
            <dd className="text-right font-medium text-[#141414]">{booking.sectionName}</dd>
          </>
        )}

        {booking.serviceTypeName && (
          <>
            <dt className="text-black/40">Service</dt>
            <dd className="text-right font-medium text-[#141414]">{booking.serviceTypeName}</dd>
          </>
        )}

        <dt className="text-black/40">Booked under</dt>
        <dd className="text-right font-medium text-[#141414]">{booking.fullName}</dd>
      </dl>

      {booking.note && (
        <div className="rounded-xl bg-[#faf9f6] px-3.5 py-2.5 text-sm text-black/60">
          <span className="block text-xs font-medium text-black/40">Note</span>
          {booking.note}
        </div>
      )}
    </div>
  );
}