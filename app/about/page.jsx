import Link from "next/link";
import TelegramFloat from "../Components/floatingCustomerSupport";

export default function About() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#141414] antialiased">
                <TelegramFloat/>

      <section className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:pb-48 md:pt-28">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Made for the people who run the front of house
          </h1>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-black/60">
            <p>
              Restaurants, barbershops, and salons run on the day in front of
              them. A ringing phone in the middle of service means a missed
              booking or a distracted host.
            </p>
            <p>
              Acme Reserve gives you one booking link. Guests pick a time that
              fits, and every booking arrives as a message in your Telegram. No
              new app to learn and no dashboard to keep open.
            </p>
            <p>
              We keep it small on purpose: one plan, one link, and a schedule
              that fills itself in so you can get on with the work.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/cincin-pizzaria-demo"
              className="inline-block rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]"
            >
              See demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}