const NOTE_PLACEHOLDERS = {
  restaurant: "Allergies, special occasion, seating preference...",
  cafe: "Allergies, special occasion, seating preference...",
  bar: "Special occasion, seating preference, group size...",
  salon: "Preferred stylist, hair type, what you'd like done...",
  barber: "Preferred barber, style you want, any sensitivities...",
  spa: "Preferred therapist, pressure level, areas to focus on...",
  pilates: "Injuries, experience level, equipment preference...",
  gym: "Injuries, experience level, goals...",
  yoga: "Injuries, experience level, anything we should know...",
};

const DEFAULT_NOTE_PLACEHOLDER = "Anything we should know before your visit...";

export function getNotePlaceholder(category) {
  const key = String(category ?? "").trim().toLowerCase();
  return NOTE_PLACEHOLDERS[key] ?? DEFAULT_NOTE_PLACEHOLDER;
}