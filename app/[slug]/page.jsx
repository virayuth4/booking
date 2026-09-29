import { notFound } from "next/navigation";
import HoursList from "../Components/hourList";
import MobileActionBar from "../Components/mobileActionBar";
import GalleryCarousel from "../Components/galleryCarousel";
import { getBookingPage } from "@/lib/bookingPage";
import { TelegramIcon } from "@/lib/icons";
import { BookingFooter } from "../Components/bookingFooter";

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function to12Hour(time) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${hour12}${period}` : `${hour12}:${mStr}${period}`;
}

function getTodayKey() {
  return DAY_ORDER[(new Date().getDay() + 6) % 7]; // getDay(): Sun=0 -> map to mon-first index
}

function isOpenNow(hours) {
  const todayKey = getTodayKey();
  const today = hours?.[todayKey];
  if (!today || today.closed) return false;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}

function toTelHref(phone) {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function toTelegramHref(telegram) {
  if (!telegram) return null;
  if (telegram.startsWith("http")) return telegram;
  return `https://t.me/${telegram.replace("@", "")}`;
}

export default async function BookingPage({ params }) {
  const { slug } = await params;

  const page = await getBookingPage(slug);

  if (!page) notFound();

  const {
    name,
    logo_url: logoUrl,
    image_rows: rawImageRows = [],
    phone,
    telegram,
    map,
    opening_hours: openingHours,
    closed_dates: closedDates = [],
  } = page;

  const todayKey = getTodayKey();
  const todayHours = openingHours?.[todayKey];
  const openNow = isOpenNow(openingHours);

  // Clean up rows: trim labels, de-dupe images within a row, drop empty rows.
  const imageRows = (Array.isArray(rawImageRows) ? rawImageRows : [])
    .map((row) => ({
      label: row?.label?.trim() || "",
      images: [...new Set(row?.image_paths ?? [])],
    }))
    .filter((row) => row.images.length > 0);

  // Hero = first image of the first row, falling back to the logo.
  const heroImage = imageRows[0]?.images[0] || logoUrl;

  const telHref = toTelHref(phone);
  const telegramHref = toTelegramHref(telegram);

  // Telegram Mini App deep link (falls back to "#booking" if the env var is missing)
  const miniAppHref = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK
    ? `${process.env.NEXT_PUBLIC_TG_MINIAPP_LINK}?startapp=${slug}`
    : "#booking";
  
    const reserveExternal = miniAppHref !== "#booking";
  const reserveProps = reserveExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <main className="relative min-h-dvh w-full bg-white pb-32 font-sans text-[#141414] antialiased">
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* Hero */}
      <header className="relative flex min-h-[60vh] w-full flex-col justify-end overflow-hidden bg-[#141414] sm:min-h-[85vh]">
        {heroImage && (
          <img
            src={heroImage}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-[#141414]/10" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-10 pt-24 sm:px-6 sm:pb-14">
          <p className="text-sm text-white/60">{openNow ? "Open now" : "Closed now"}</p>

          <h1 className="mt-2 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {name}
          </h1>

          <p className="mt-4 text-sm text-white/70">
            {!todayHours || todayHours.closed
              ? "Closed today"
              : `Today · ${to12Hour(todayHours.open)} – ${to12Hour(todayHours.close)}`}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={miniAppHref}
              {...reserveProps}
              className="inline-flex items-center gap-2 rounded-full bg-[#faf9f6] px-5 py-3 text-sm font-medium text-[#141414] transition hover:bg-white"
            >
              <CalendarIcon className="h-4 w-4" />
              Reserve a table
            </a>
            {telHref && (
              <a
                href={telHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                <PhoneIcon className="h-4 w-4" />
                {phone}
              </a>
            )}
            {telegramHref && (
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                <TelegramIcon className="h-4 w-4" />
                Message on Telegram
              </a>
            )}
            {map && (
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Get directions
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[1fr_280px] lg:gap-12">
          {/* Primary column */}
          <div className="flex min-w-0 flex-col gap-10">
            {imageRows.length > 0 && (
              <GalleryCarousel rows={imageRows} name={name} />
            )}

            <HoursList
              openingHours={openingHours}
              todayKey={todayKey}
              closedDates={closedDates}
            />
          </div>

          {/* Contact card: sticky on desktop, hidden on mobile */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-6">
              <h2 className="text-lg font-semibold tracking-tight text-[#141414]">
                Reserve
              </h2>
              <p className="mt-1 text-sm text-black/45">
                Pick a time online, or call or message us directly.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <a
                  href={miniAppHref}
                  {...reserveProps}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#141414] px-4 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Reserve
                </a>
                {telHref && (
                  <a
                    href={telHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-[#141414] transition hover:border-black/20"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {phone}
                  </a>
                )}
                {telegramHref && (
                  <a
                    href={telegramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-[#141414] transition hover:border-black/20"
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Message on Telegram
                  </a>
                )}
                {map && (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-black/60 underline decoration-black/20 decoration-2 underline-offset-4 transition hover:text-black"
                  >
                    Get directions
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

    <BookingFooter/>

      {/* Mobile floating action pill */}
      <MobileActionBar telegramHref={telegramHref} miniAppHref={miniAppHref}/>
    </main>
  );
}

function PhoneIcon({ className }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

