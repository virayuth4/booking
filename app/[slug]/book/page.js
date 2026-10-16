// app/[slug]/book/page.js
import { redirect, notFound } from "next/navigation";
import BookingSection from "@/app/Components/bookingSection";
import TelegramInit from "@/app/Components/telegramInit";
import TelegramBookingSwitch from "@/app/Components/telegramBookingSwitch";
import { getBookingPage, normalizeOptions } from "@/lib/bookingPage";

const BOT = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;

function buildTelegramLink(slug) {
  return `${BOT}?startapp=${encodeURIComponent(slug)}`;
}

export default async function BookPage({ params, searchParams }) {
  const { slug } = await params;
  const { platform } = await searchParams;
  const isTelegram = platform === "tg";

  // Regular browser visitors: send them to the Mini App.
  if (!isTelegram) {
    redirect(buildTelegramLink(slug));
  }

  // Inside the Mini App: render the booking UI.
  const page = await getBookingPage(slug);
  if (!page) notFound();

  const {
    name,
    category,
    opening_hours: openingHours,
    sections: rawSections = [],
    service_types: rawServiceTypes = [],
  } = page;

  const sections = normalizeOptions(rawSections);
  const serviceTypes = normalizeOptions(rawServiceTypes);

  return (
    <main className="relative min-h-dvh w-full bg-white pb-8 font-sans text-[#141414] antialiased">
      <TelegramInit />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 pt-10 sm:px-6">
        <TelegramBookingSwitch
          slug={slug}
          name={name}
          category={category}
          isTelegram={isTelegram}
        >
          <BookingSection
            pageId={page.id}
            category={category}
            placeName={name}
            sections={sections}
            serviceTypes={serviceTypes}
            serviceNote={page.service_types_note}
            openingHours={openingHours}
            maxDaysAhead={page.max_days_ahead ?? 60}
          />
        </TelegramBookingSwitch>
      </div>
    </main>
  );
}