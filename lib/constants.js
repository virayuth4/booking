

export const TELEGRAM_SUPPORT_URL = 'https://t.me/rielpoint'
export const TELEGRAM_SUPPORT_HANDLE = '@rielpoint_support'




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


export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];


export const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  accepted: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700' },
  declined: { label: 'Declined', className: 'bg-red-50 text-red-700' },
};