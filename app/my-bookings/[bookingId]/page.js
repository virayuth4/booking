import { notFound } from 'next/navigation';
import StatusPoller from './statusPoller';

async function getBooking(bookingId) {
    console.log("bookingId", bookingId)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking/id/${bookingId}`,
    { cache: 'no-store' }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load booking.');

  const { booking } = await res.json();
  return booking;
}

export default async function MyBookingPage({ params }) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);

  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-lg px-5 py-10">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-black/40">
            {booking.businessName}
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[#141414]">Your booking</h1>
        </div>

        <div className="px-5 py-5">
          <StatusPoller bookingId={bookingId} initialBooking={booking} />
        </div>
      </div>
    </main>
  );
}