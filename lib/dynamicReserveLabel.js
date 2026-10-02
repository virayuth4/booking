// lib/reserveLabel.js
const RESERVE_CONFIG = {
  restaurant: { label: "Reserve a table", action: "Book a table" },
  salon: { label: "Book an appointment", action: "Book an appointment" },
  "pilates studio": { label: "Book a class", action: "Book a class" },
};

const DEFAULT_CONFIG = { label: "Reserve now", action: "Book" };

function getConfig(category) {
  const key = String(category ?? "").trim().toLowerCase();
  return RESERVE_CONFIG[key] ?? DEFAULT_CONFIG;
}

export function getReserveLabel(category) {
  return getConfig(category).label;
}

export function getReserveSubtitle(category, placeName) {
  const { action } = getConfig(category);
  return placeName
    ? `${action} at ${placeName} in a couple of taps.`
    : `${action} in a couple of taps.`;
}