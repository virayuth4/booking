"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth/authContext";
import authenticatedFetch from "@/app/auth/authenticatedFetch";
import { FormatTime } from "@/lib/formatTime";
import { initials } from "@/lib/initials";

const stats = [
  { label: "Page views", value: "1,284", delta: "+18%", period: "vs last week" },
  { label: "Bookings", value: "96", delta: "+6%", period: "vs last week" },
  { label: "Conversion", value: "7.5%", delta: "+0.4pt", period: "vs last week" },
];

const activity = [
  { time: "9:41", label: "New booking", who: "Priya M.", tag: "cut" },
  { time: "9:12", label: "Page view", who: "from Instagram bio", tag: "view" },
  { time: "8:55", label: "New booking", who: "party of 2", tag: "table" },
  { time: "8:30", label: "Page view", who: "direct link", tag: "view" },
  { time: "8:02", label: "New booking", who: "Ana", tag: "colour" },
];

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];


function summarizeHours(hours) {
  if (!hours) return [];
  const rows = DAYS.map(({ key, label }) => {
    const day = hours[key] || {};
    const sig = day.closed ? "closed" : `${day.open}-${day.close}`;
    return { label, sig, closed: day.closed, open: day.open, close: day.close };
  });

  const groups = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.sig === row.sig) {
      last.to = row.label;
    } else {
      groups.push({ from: row.label, to: row.label, sig: row.sig, closed: row.closed, open: row.open, close: row.close });
    }
  }

  return groups.map((g) => {
    const range = g.from === g.to ? g.from : `${g.from}–${g.to}`;
    const time = g.closed ? "Closed" : `${FormatTime(g.open)}–${FormatTime(g.close)}`;
    return `${range} ${time}`;
  });
}



function PageCard({ page }) {
  const link = `${process.env.NEXT_PUBLIC_FRONTEND}/${page.slug}`;
  const hoursSummary = summarizeHours(page.opening_hours);
  const photoCount = Array.isArray(page.image_paths) ? page.image_paths.length : 0;

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#141414] font-mono text-sm text-[#faf9f6]">
            {initials(page.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{page.name}</h2>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                Live
              </span>
            </div>
            <a
              href={`https://${link}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-xs text-black/45 hover:text-black/70"
            >
              {link}
            </a>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={`/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-[#141414] transition hover:border-black/20"
          >
            View page
          </a>
          <Link
            href={`/admin/booking/${page.slug}`}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-[#141414] transition hover:border-black/20"
          >
            View bookings
          </Link>
          <Link
            href={`/admin/booking/create?edit=true&id=${page.id}`}
            className="rounded-full bg-[#141414] px-5 py-2.5 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
          >
            Edit page
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-black/10 pt-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-black/40">Contact</p>
          <p className="mt-1.5 text-sm text-[#141414]">{page.phone || "—"}</p>
          <p className="mt-0.5 text-sm text-black/55">{page.telegram || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-black/40">Hours</p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-[#141414]">
            {hoursSummary.length ? (
              hoursSummary.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li className="text-black/40">Not set</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs text-black/40">Extras</p>
          <p className="mt-1.5 text-sm text-[#141414]">
            {photoCount} photo{photoCount === 1 ? "" : "s"}
          </p>
          {page.map && (
            <a
              href={page.map}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-sm text-black/55 hover:text-black/80"
            >
              Map link ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminHome() {
  const { currentUser, loading: authLoading } = useAuth();
  const [pages, setPages] = useState([]);
  const [plan, setPlan] = useState("basic");
  const [limit, setLimit] = useState(1);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState("");
  console.log("CurrentUser in Admin", currentUser)

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setPagesLoading(false);
      return;
    }

    let cancelled = false;
    async function loadPages() {
      try {
        const res = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/booking-settings`,
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load booking pages.");
        const { data, plan: planValue, limit: limitValue } = await res.json();
        if (cancelled) return;
        setPages(Array.isArray(data) ? data : []);
        if (planValue) setPlan(planValue);
        if (typeof limitValue === "number") setLimit(limitValue);
      } catch (err) {
        console.error(err);
        if (!cancelled) setPagesError("Couldn't load your booking pages.");
      } finally {
        if (!cancelled) setPagesLoading(false);
      }
    }
    loadPages();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser]);

  const atLimit = pages.length >= limit;

  return (
    <main className="min-h-screen bg-[#faf9f6] font-sans text-[#141414] antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf9f6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold tracking-tight">acme reserve</span>
          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-black/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-black/45 sm:inline">
              {plan}
            </span>
            <div className="h-8 w-8 rounded-full bg-[#141414] text-center font-mono text-xs leading-8 text-[#faf9f6]">
              {initials(currentUser?.fullname || currentUser?.email)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Booking pages */}
        <section className="border-b border-black/10 pb-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Your booking pages
              </h1>
              <p className="mt-2 text-sm text-black/55">
                {pagesLoading || authLoading
                  ? "Loading…"
                  : atLimit
                  ? `${pages.length} of ${limit} pages used on the ${plan} plan.`
                  : `${pages.length} of ${limit} pages used.`}
              </p>
            </div>

            {!pagesLoading && !authLoading && (
              atLimit ? (
                <button
                  type="button"
                  title={`Your ${plan} plan allows ${limit} page${limit === 1 ? "" : "s"}.`}
                  className="cursor-not-allowed rounded-full border border-black/10 bg-black/[0.04] px-5 py-2.5 text-sm font-medium text-black/35"
                  disabled
                >
                  {plan === "basic" ? "Upgrade to add more pages" : "Page limit reached"}
                </button>
              ) : (
                <Link
                  href="/admin/booking/create"
                  className="rounded-full bg-[#141414] px-5 py-2.5 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
                >
                  + Add page
                </Link>
              )
            )}
          </div>

          <div className="mt-6 space-y-4">
            {pagesLoading || authLoading ? (
              <div className="animate-pulse rounded-xl border border-black/10 bg-white p-6">
                <div className="h-4 w-40 rounded bg-black/10" />
                <div className="mt-3 h-3 w-64 rounded bg-black/10" />
              </div>
            ) : pagesError ? (
              <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-black/55">
                {pagesError}
              </div>
            ) : !currentUser ? (
              <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-black/55">
                Please sign in to see your booking pages.
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/15 bg-white p-8">
                <p className="text-sm text-black/55">
                  You haven&apos;t set up a booking page yet.
                </p>
                <Link
                  href="/admin/booking/create"
                  className="rounded-full bg-[#141414] px-5 py-2.5 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
                >
                  Build your first page
                </Link>
              </div>
            ) : (
              pages.map((page) => <PageCard key={page.id} page={page} />)
            )}
          </div>
        </section>

        {/* Analytics */}
        <section className="mt-10">
          <h2 className="text-lg font-medium">Analytics</h2>
          <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-6">
                <p className="text-xs text-black/45">{s.label}</p>
                <p className="mt-2 font-mono text-3xl text-[#141414]">{s.value}</p>
                <p className="mt-1 text-xs text-black/40">
                  <span className="text-[#141414]/70">{s.delta}</span> {s.period}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
            <div className="border-b border-black/10 px-5 py-3.5 text-xs text-black/40">
              Recent activity
            </div>
            <ul className="divide-y divide-black/[0.06]">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                  <span className="w-12 shrink-0 font-mono text-xs text-black/35">{a.time}</span>
                  <span>{a.label}</span>
                  <span className="text-black/45">{a.who}</span>
                  <span className="ml-auto rounded border border-black/10 px-2 py-0.5 font-mono text-[11px] text-black/40">
                    {a.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}