'use client';
import { useState } from "react";
import Link from "next/link";
import TelegramFloat from "./Components/floatingCustomerSupport";
import TelegramPreview from "./Components/telegramPreview";

const industries = [
  {
    name: "Restaurants",
    tag: "table · 4pm-close",
    note: "Hold tables by time and party size, seat walk-ins without double-booking.",
  },
  {
    name: "Barbershops",
    tag: "chair · 4pm-close",
    note: "Chair-by-chair schedules, so every barber sees only their own day.",
  },
  {
    name: "Salons",
    tag: "service · 4pm-close",
    note: "Block out real service length, from a quick trim to a full colour.",
  },
];

const steps = [
  {
    n: "01",
    title: "Set your hours",
    body: "Add your days, your chairs or tables, and how long each service takes.",
  },
  {
    n: "02",
    title: "Share your link",
    body: "Put it in your bio, your window, your receipts — wherever people find you.",
  },
  {
    n: "03",
    title: "Get bookings on Telegram",
    body: "Every booking lands as a message. No app to check, no calls to answer mid-service.",
  },
];








export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#141414] antialiased">
              <TelegramFloat/>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-32 px-6 pb-24 pt-20 md:grid-cols-2 md:pb-32 md:pt-28">
        <div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Bookings that land in your Telegram
          </h1>
          <p className="mt-6 max-w-md text-lg text-black/60">
            Share one booking link. When a guest books a table, chair, or
            appointment, you get a message on Telegram right away.
          </p>
          <div className="mt-8">
            <Link
              id="start"
              href="/cincin-pizzaria-demo"
              className="inline-block rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]"
            >
              See demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-black/40">
            $15/month · 14-day free trial · No upfront card needed
          </p>
        </div>


      </section>

<section className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
  <TelegramPreview />
</section>
    

      {/* Industries */}
      {/* <section id="industries">
        <div className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Built around how you actually book
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {industries.map((item) => (
              <div key={item.name}>
                <h3 className="text-xl font-medium">{item.name}</h3>
                <p className="mt-2 font-mono text-[11px] text-black/40">
                  {item.tag}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-black/55">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* How it works */}
      {/* <section id="how">
        <div className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps, then it runs itself
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <span className="font-mono text-sm text-black/35">{step.n}</span>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

     

      {/* Pricing */}
      <section id="pricing">
        <div className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            One plan. Everything included
          </h2>
          <div className="mt-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-4xl">
                $15<span className="text-lg text-black/40">/month</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-black/55">
                <li>Unlimited bookings and staff</li>
                <li>Instant booking alerts on Telegram/Telegram group</li>
                <li>Your own booking page and link</li>
                 <li>Cancel anytime</li>
               
              </ul>
            </div>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Start free for 14 days
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 pb-12 text-sm text-black/35 md:flex-row">
          <span className="font-medium text-black/70">acme reserve</span>
          <span>&copy; {new Date().getFullYear()} Acme reserve. Made for the people who run the front of house.</span>
        </div>
      </footer>
    </main>
  );
}