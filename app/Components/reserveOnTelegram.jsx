import { TelegramIcon } from "@/lib/icons";

const BOT = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;

function buildTelegramLink(slug) {
  return `${BOT}?startapp=${encodeURIComponent(slug)}`;
}

export default function ReserveOnTelegram({ slug, name }) {
  return (
    <section className="w-full bg-white px-2 py-6 text-center sm:py-8">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#229ED9]/10 text-[#229ED9]">
          <TelegramIcon className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#141414] sm:text-3xl">
          Reserve a table
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-black/60">
          Reservations at {name} are made in our Telegram app. 
        </p>

        {BOT ? (
          <a
            href={buildTelegramLink(slug)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1c8ec6] active:scale-[0.98] sm:w-auto sm:min-w-64"
          >
            <TelegramIcon className="h-4 w-4" />
            Reserve {name}
          </a>
        ) : (
          <p className="mt-6 text-sm text-black/40">
            Telegram booking is unavailable.
          </p>
        )}

        <p className="mt-4 text-xs text-black/40">Opens in Telegram</p>
      </div>
    </section>
  );
}