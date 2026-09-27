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
        title: "Watch the day fill in",
        body: "Bookings land straight into your schedule. No calls to answer mid-service.",
      },
    ];

    const quotes = [
      {
        text: "Sundays used to be twenty missed calls. Now the book fills itself in while I'm cooking.",
        name: "Marisol Reyes",
        place: "Owner, Café Ventana",
      },
      {
        text: "Every chair has its own day now. No more double-booked Saturdays.",
        name: "Dwayne Cotter",
        place: "Owner, Cotter & Sons Barbershop",
      },
    ];

    const bookings = [
      { time: "9:00", label: "Wash & cut", who: "Priya M.", tag: "cut", dur: "45m" },
      { time: "9:45", label: "Indoor", who: "party of 2", tag: "table", dur: "1h 30m" },
      { time: "10:30", label: "Colour touch-up", who: "Ana", tag: "colour", dur: "1h" },
      { time: "11:15", label: "Outdoor", who: "party of 6", tag: "table", dur: "2h" },
      { time: "1:00", label: "Fade", who: "Marcus", tag: "cut", dur: "30m" },
      { time: "2:30", label: "— open —", who: "", tag: "", dur: "" },
    ];

    export default function Home() {
              
      return (
        <main className="min-h-screen bg-white font-sans text-[#141414] antialiased">
          {/* Nav */}
          {/* <header className="sticky top-0 z-20 border-b border-black/10 bg-white backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
              <span className="text-lg font-semibold tracking-tight">Ledger</span>
              <nav className="hidden gap-8 text-sm text-black/60 md:flex">
                <a href="#industries" className="transition hover:text-black">Who it's for</a>
                <a href="#how" className="transition hover:text-black">How it works</a>
                <a href="#pricing" className="transition hover:text-black">Pricing</a>
              </nav>
              <a
                href="/signup"
                className="rounded-full bg-[#141414] px-4 py-2 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
              >
                Sign Up 
              </a>
            </div>
          </header> */}

          {/* Hero */}
          <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 md:pt-28">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-[#141414] md:text-6xl">
                The booking page your day already needs
              </h1>
              <p className="mt-6 max-w-lg text-lg text-black/60">
                One link for tables, chairs, and appointments. Guests book themselves
                in, your schedule fills itself out, and the phone stops interrupting
                the work.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <a
                  id="start"
                  href="#start"
                  className="rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
                >
                  Start free for 30 days
                </a>
                <a href="#how" className="text-sm text-black/60 transition hover:text-black">
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-sm text-black/35">No card required. Cancel any time.</p>
            </div>

            {/* Window chrome mock */}
            <div className="mt-16 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#f2f0ea] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
                <span className="ml-3 font-mono text-xs text-black/40">
                  ledger.app — Saturday, 12 Sept
                </span>
                <span className="ml-auto font-mono text-xs text-black/30">6 booked</span>
              </div>
              <ul className="divide-y divide-black/[0.06]">
                {bookings.map((b, i) => (
                  <li
                    key={b.time}
                    className="flex items-center gap-4 px-5 py-3.5 text-sm"
                  >
                    <span className="w-14 shrink-0 font-mono text-xs text-black/35">
                      {b.time}
                    </span>
                    <span className={i === 5 ? "text-black/30" : "text-[#141414]"}>
                      {b.label}
                    </span>
                    {b.who && (
                      <span className="text-black/45">{b.who}</span>
                    )}
                    {b.tag && (
                      <span className="ml-auto flex items-center gap-3">
                        <span className="rounded border border-black/10 px-2 py-0.5 font-mono text-[11px] text-black/40">
                          {b.tag}
                        </span>
                        <span className="w-14 text-right font-mono text-[11px] text-black/30">
                          {b.dur}
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Industries */}
          <section id="industries" className="border-t border-black/10">
            <div className="mx-auto max-w-6xl px-6 py-20">
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#141414] md:text-4xl">
                Built around how you actually book
              </h2>
              <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 md:grid-cols-3">
                {industries.map((item) => (
                  <div key={item.name} className="bg-[#faf9f6] p-8">
                    <h3 className="text-xl font-medium text-[#141414]">{item.name}</h3>
                    <p className="mt-3 inline-block rounded border border-black/10 px-2 py-0.5 font-mono text-[11px] text-black/40">
                      {item.tag}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-black/55">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="border-t border-black/10">
            <div className="mx-auto max-w-6xl px-6 py-20">
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#141414] md:text-4xl">
                Three steps, then it runs itself
              </h2>
              <div className="mt-12 grid gap-10 md:grid-cols-3">
                {steps.map((step) => (
                  <div key={step.n} className="border-t border-black/15 pt-5">
                    <span className="font-mono text-sm text-black/35">{step.n}</span>
                    <h3 className="mt-3 text-lg font-medium text-[#141414]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black/55">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Quotes */}
          <section className="border-y border-black/10 bg-[#f2f0ea]">
            <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
              {quotes.map((q) => (
                <div key={q.name}>
                  <p className="text-xl leading-relaxed text-[#141414]">{q.text}</p>
                  <p className="mt-4 text-sm text-black/45">
                    {q.name} — {q.place}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="border-b border-black/10">
            <div className="mx-auto max-w-6xl px-6 py-20">
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#141414] md:text-4xl">
                One plan. Everything included
              </h2>
              <div className="mt-10 flex flex-col items-start justify-between gap-8 rounded-xl border border-black/10 bg-white p-8 md:flex-row md:items-center">
                <div>
                  <p className="font-mono text-4xl text-[#141414]">
                    $29<span className="text-lg text-black/40">/month</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-black/55">
                    <li>Unlimited bookings and staff</li>
                    <li>Automatic reminders by text and email</li>
                    <li>Your own booking page and link</li>
                  </ul>
                </div>
                <a
                  href="#start"
                  className="whitespace-nowrap rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
                >
                  Start free for 30 days
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer>
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-black/35 md:flex-row">
              <span className="font-medium text-black/70">Ledger</span>
              <span>&copy; {new Date().getFullYear()} Ledger. Made for the people who run the front of house.</span>
            </div>
          </footer>
        </main>
      );
    }