const bookings = [
  {
    party: 2,
    seating: "Outdoor",
    date: "Saturday, 19 Sept",
    time: "6:00 pm",
    name: "Sam",
    phone: "012 222 333",
  },
];

const confirmedBy = "@staff_member_1";

const confirmedBooking = {
  party: 4,
  seating: "Indoor",
  date: "Saturday, 12 Sept",
  time: "7:30 pm",
  name: "Dara",
  phone: "012 345 678",
};

const seatingEmoji = { Indoor: "🍴", Outdoor: "🍴" };

const customerMessages = [
  {
    day: "Friday",
    time: "9:41 am",
    title: "Booking at Cincin Pizzaria been confirmed ✅",
    intro: "",
  },
  {
    day: "Saturday",
    time: "9:00 am",
    title: "Reminder 🔔",
    intro: "Your booking at Cincin Pizzaria is today",
  },
];

const bubble =
  "rounded-2xl rounded-tl-sm bg-white p-4 text-sm leading-relaxed shadow-xl shadow-black/10";

const keyBtn =
  "rounded-lg bg-black/5 px-3 py-2 text-sm font-medium text-[#141414] transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#141414]";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 240 240" className="h-10 w-10" aria-hidden="true">
      <circle cx="120" cy="120" r="120" fill="#229ED9" />
      <path
        fill="#fff"
        d="M54.3 118.8c35-15.2 58.3-25.3 70-30.2 33.3-13.9 40.3-16.3 44.8-16.4 1 0 3.2.2 4.7 1.4 1.2 1 1.5 2.3 1.7 3.300.2 1 .4 3.100.2 4.800-1.800 19-9.600 65.100-13.600 86.300-1.700 9-5 12-8.200 12.300-7 .6-12.300-4.600-19-9-10.600-6.900-16.500-11.200-26.800-18-11.900-7.800-4.200-12.100 2.600-19.100 1.800-1.800 32.500-29.800 33.100-32.300.1-.3.1-1.500-.6-2.100-.7-.6-1.700-.4-2.500-.2-1.100.2-17.900 11.400-50.600 33.500-4.800 3.300-9.100 4.900-13 4.800-4.300-.1-12.500-2.400-18.700-4.400-7.500-2.400-13.500-3.700-13-7.900.3-2.200 3.300-4.400 8.900-6.700Z"
      />
    </svg>
  );
}

function Label({ children }) {
  return (
    <p className="mb-3 self-start rounded-full bg-[#141414] px-3 py-1 text-xs font-medium text-white">
      {children}
    </p>
  );
}

function BookingDetails({ booking, showGuest = true }) {
  const rows = [
    ["👥", `Party of ${booking.party}`],
    [seatingEmoji[booking.seating], `${booking.seating} table`],
    ["📅", booking.date],
    ["🕖", booking.time],
    ...(showGuest
      ? [
          ["👤", booking.name],
          ["📞", booking.phone],
        ]
      : []),
  ];

  return (
    <ul className="mt-2 space-y-1 text-black/70">
      {rows.map(([icon, text], i) => (
        <li key={i} className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function PhoneCard({ label, ariaLabel, name, avatar, children }) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div
        aria-label={ariaLabel}
        className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl shadow-black/10"
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-4 py-3">
          {avatar}
          <div className="leading-tight">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-[#229ED9]">bot · Telegram</p>
          </div>
        </div>
        <div className="flex-1 space-y-6 px-4 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function TelegramPreview() {
  return (
    <div className="mx-auto grid w-full max-w-4xl items-stretch gap-10 md:grid-cols-2 md:gap-8">
      {/* Merchant */}
      <PhoneCard
        label="What you see"
        ariaLabel="Example booking messages the business receives in Telegram"
        name="Acme Reserve Merchant"
        avatar={<TelegramIcon />}
      >
        <p className="text-center text-xs text-black/40">Today</p>

        {bookings.map((b) => (
          <div key={b.phone} className="max-w-[90%]">
            <div className={bubble}>
              <p className="font-medium">New booking 🔔</p>
              <BookingDetails booking={b} />
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button type="button" className={keyBtn}>✅ Accept</button>
              <button type="button" className={keyBtn}>❌ Decline</button>
            </div>
          </div>
        ))}

        {/* After accepting: manage the booking */}
        <div className="max-w-[90%]">
          <div className={bubble}>
            <p className="font-medium">Booking Confirmed ✅</p>
            <BookingDetails booking={confirmedBooking} />
            <p className="mt-4 text-black/70">Confirmed by {confirmedBy}</p>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button type="button" className={keyBtn}>🎉 Completed</button>
            <button type="button" className={keyBtn}>🚫 No show</button>
            <button type="button" className={`${keyBtn} col-span-2`}>
              🗑 Cancel Booking
            </button>
          </div>
        </div>
      </PhoneCard>

      {/* Customer */}
      <PhoneCard
        label="What your customers see"
        ariaLabel="Example confirmation and reminder messages a customer receives in Telegram"
        name="Acme Reserve"
        avatar={
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black">
            AR
          </div>
        }
      >
        {customerMessages.map((m) => (
          <div key={m.day}>
            <p className="mb-3 text-center text-xs text-black/40">{m.day}</p>
            <div className="max-w-[90%]">
              <div className={bubble}>
                <p className="font-medium">{m.title}</p>
                <p className="mt-1 text-black/70">{m.intro}</p>
                <BookingDetails booking={confirmedBooking} showGuest={false} />
                <p className="mt-2 text-right text-[11px] text-black/30">{m.time}</p>
              </div>
              <div className="mt-1.5 grid gap-1.5">
                <button type="button" className={keyBtn}>💬 Message Cincin Pizzaria</button>
                <button type="button" className={keyBtn}>📅 View booking</button>
              </div>
            </div>
          </div>
        ))}
      </PhoneCard>
    </div>
  );
}