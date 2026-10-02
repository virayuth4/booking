const RESERVE_LABELS = {
  restaurant: "Reserve a table",
  salon: "Book an appointment",
  "pilates studio": "Book a class",
};

export function getReserveLabel(category) {
  const key = String(category ?? "").trim().toLowerCase();
  return RESERVE_LABELS[key] ?? "Reserve now";
}