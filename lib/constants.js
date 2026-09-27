

export const TELEGRAM_SUPPORT_URL = 'https://t.me/rielpoint'
export const TELEGRAM_SUPPORT_HANDLE = '@rielpoint_support'

export const SITE_NAME = 'RielPoint Cambodia'
export const SITE_DESCRIPTION =
  'Earn cashback on online shopping, travel, and lifestyle bookings. Direct payouts via Bakong & KHQR in USD and KHR.'

export const SUPPORT_EMAIL = 'support@rielpoint.com'

// Payout rails supported
export const PAYOUT_METHODS = ['Bakong', 'KHQR', 'ABA', 'Wing'] 

// Confirmation timeline (kept here so copy stays consistent site-wide)
export const CASHBACK_TIMELINE = {
  pendingHours: '1 – 48 Hours',
  verificationDays: '14 – 45 Days',
  confirmedDays: '30 – 60 Days',
} 

export const CATEGORIES = [
  { key: "restaurant", label: "Restaurant", suggestedServices: ["Indoor", "Outdoor", "Bar seating", "Private room"] },
  { key: "pilates", label: "Pilates & Fitness", suggestedServices: ["Group class", "Private 1-on-1", "Duet session"] },
  { key: "barber", label: "Barber & Grooming", suggestedServices: ["In-shop haircut", "Beard trim", "Home visit"] },
  { key: "salon", label: "Beauty & Spa", suggestedServices: ["Hair", "Nails", "Skincare", "Massage"] },
  { key: "cafe", label: "Café & Bakery", suggestedServices: ["Dine-in", "Takeaway", "Outdoor patio"] },
  { key: "other", label: "Other", suggestedServices: ["Standard service", "Custom booking"] },
];

export const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABEL = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};