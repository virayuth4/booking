import { notFound } from "next/navigation";
import BookingSection from "@/app/Components/bookingSection";
import HoursList from "@/app/Components/hourList";
import GalleryCarousel from "@/app/Components/galleryCarousel";
import {
  getBookingPage,
  normalizeOptions,
  getTodayKey,
  to12Hour,
  isOpenNow,
} from "@/lib/bookingPage";
import TelegramInit from "@/app/Components/telegramInit";
import TelegramBookingSwitch from "@/app/Components/telegramBookingSwitch";
import { BookingFooter } from "@/app/Components/bookingFooter";
import TelegramGuard from "@/app/Components/telegramGuard";
import ReserveOnTelegram from "@/app/Components/reserveOnTelegram";

export default async function BookPage({ params, searchParams }) {
  const { slug } = await params;
  const { platform } = await searchParams;
  const isTelegram = platform === "tg";

  const page = await getBookingPage(slug);
  if (!page) notFound();

  const {
    name,
    category,
    logo_url: logoUrl,
    image_rows: rawImageRows = [],
    opening_hours: openingHours,
    sections: rawSections = [],
    service_types: rawServiceTypes = [],
    closed_dates: closedDates = [],
  } = page;

  const sections = normalizeOptions(rawSections);
  const serviceTypes = normalizeOptions(rawServiceTypes);

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
  const reserveCard = <ReserveOnTelegram slug={slug} name={name} />;

  return (
    <main className="relative min-h-dvh w-full bg-white pb-8 font-sans text-[#141414] antialiased">
      <TelegramInit />

      {/* Compact hero (no action buttons: the user is already booking) */}
      <header className="relative flex min-h-[30vh] md:min-h-[75vh] w-full flex-col justify-end overflow-hidden bg-[#141414]">
        {heroImage && (
          <img
            src={heroImage}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-[#141414]/10" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-6 pt-16 sm:px-6">
          <p className="text-sm text-white/60">{openNow ? "Open now" : "Closed now"}</p>

          <h1 className="mt-2 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {name}
          </h1>

          <p className="mt-4 text-sm text-white/70">
            {!todayHours || todayHours.closed
              ? "Closed today"
              : `Today · ${to12Hour(todayHours.open)} – ${to12Hour(todayHours.close)}`}
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 pt-10 sm:px-6">

          
 {/* <BookingSection
        pageId={page.id}
        category={category}
        placeName={name}
        sections={sections}
        serviceTypes={serviceTypes}
        openingHours={openingHours}
        maxDaysAhead={page.max_days_ahead ?? 60}
      />
       */}
          
          
          <TelegramBookingSwitch slug={slug} name={name}>




  {isTelegram ? (
      <TelegramGuard >

      <BookingSection
        pageId={page.id}
        category={category}
        placeName={name}
        sections={sections}
        serviceTypes={serviceTypes}
        openingHours={openingHours}
        maxDaysAhead={page.max_days_ahead ?? 60}
      />
        </TelegramGuard>

    ) : (
      reserveCard
    )}

        </TelegramBookingSwitch>
        {imageRows.length > 0 && <GalleryCarousel rows={imageRows} name={name} />}

        <HoursList
          openingHours={openingHours}
          todayKey={todayKey}
          closedDates={closedDates}
        />

                <div className='pb-10'>
                      <BookingFooter/>
                </div>
      
      </div>
    </main>
  );
}