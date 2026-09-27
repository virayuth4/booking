import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import BookingList from '../Components/bookingList';

async function getBookings(anonId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/bookings/anon/${anonId}`,
    { cache: 'no-store' }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load bookings.');

  const data = await res.json();
  // Ensure an array even if the backend returns a single booking object
  return Array.isArray(data.booking) ? data.booking : [data.booking].filter(Boolean);
}

export default async function AnonBookingPage() {
  const cookieStore = await cookies();
  const anonId = cookieStore.get('anonId')?.value;

  if (!anonId) notFound();

  const bookings = await getBookings(anonId);
  if (!bookings || bookings.length === 0) notFound();

  return (
    <main className="mx-auto max-w-lg px-5 py-10">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-black/40">
            Reservations
          </p>
          <h1 className="mt-1 text-lg font-semibold text-[#141414]">
            Your Bookings ({bookings.length})
          </h1>
        </div>

        <div className="px-5 py-5">
          <BookingList initialBookings={bookings} anonId={anonId} />
        </div>
      </div>
    </main>
  );
}