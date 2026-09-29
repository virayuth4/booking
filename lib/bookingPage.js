const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND;

export async function getBookingPage(slug) {
  const res = await fetch(
    `${BACKEND}/api/booking-link/booking-settings/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 60, tags: [`booking-page:${slug}`] } }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load booking page (${res.status})`);

  const json = await res.json();
  return json.data;
}

// Normalize strings or objects into { id, name }
export function normalizeOptions(items = []) {
  return items.map((item, index) => {
    if (typeof item === "string") {
      return { id: item.toLowerCase().replace(/\s+/g, "-"), name: item };
    }
    return {
      id: String(item.id ?? item._id ?? index),
      name: item.name ?? item.title ?? item.label ?? "Standard",
    };
  });
}

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function getTodayKey() {
  return DAY_ORDER[(new Date().getDay() + 6) % 7]; // Sun=0 -> mon-first index
}

export function to12Hour(time) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${hour12}${period}` : `${hour12}:${mStr}${period}`;
}

export function isOpenNow(hours) {
  const today = hours?.[getTodayKey()];
  if (!today || today.closed) return false;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);

  return minutesNow >= openH * 60 + openM && minutesNow < closeH * 60 + closeM;
}