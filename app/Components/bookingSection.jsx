'use client';

import { useState, useEffect, useMemo } from 'react';
import { AuthContext, useAuth } from '../auth/authContext';
import { ClockIcon, XIcon, User, Phone, StickyNote, Users, Calendar, Clock, Utensils, MapPin } from 'lucide-react';
import BookingTelegramNotify from './bookingTelegramNotify';
import { useWriteAccessGate } from './useWriteAccessGate';
import { MONTH_LABELS, WEEKDAY_LABELS } from '@/lib/constants';
import { groupTimeSlots, getDaySchedule } from '@/lib/groupTimeSlots';
import { API_BASE } from '@/lib/apiBase';


function pad2(n) {
  return String(n).padStart(2, '0');
}

const DATA_DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];




function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isSameDay(a, b) {
  return a && b && toDateKey(a) === toDateKey(b);
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

const VERIFY_AVAILABILITY = false;



const getSlots = (day) => {
  if (!day || day.closed) return [];
  if (Array.isArray(day.slots) && day.slots.length) return day.slots;
  if (day.open && day.close) return [{ open: day.open, close: day.close }];
  return [];
};

async function defaultGetAvailableTimes(section, dateKey, serviceType, pageId) {
  const params = new URLSearchParams({ pageId, date: dateKey });
  if (section?.id) params.set('sectionId', section.id);
  if (serviceType?.id) params.set('serviceTypeId', serviceType.id);

  const url = `${API_BASE}/api/booking-link/booking/availability?${params}`;
  try {
   const res = await fetch(`${url}`);
    const text = await res.text();
    console.log('availability', res.status, url, text.slice(0, 200));
    if (!res.ok) return [];
    return JSON.parse(text).slots ?? [];
  } catch (err) {
    console.error('availability error', url, err);
    return [];
  }
}
/**
 * Always-visible, embedded booking widget — not a modal. Meant to be
 * dropped directly into a page (e.g. below an hours section) with a
 * matching id so "Reserve" links elsewhere on the page can jump to it.
 */
export default function BookingSection({
  id = 'booking',
   pageId,
  placeName = '',
  sections = [],
  serviceTypes = [],
  openingHours = {},
  maxGuests = 10,
  maxDaysAhead = 60,
  getAvailableTimes = defaultGetAvailableTimes,
  onConfirm,
}) {
  const [step, setStep] = useState(1);
  const [activeField, setActiveField] = useState(null);

  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [section, setSection] = useState(() => (sections.length === 1 ? sections[0] : null));  
  const [serviceType, setServiceType] = useState(() => (serviceTypes.length > 0 ? serviceTypes[0] : null));
  const [time, setTime] = useState(null);
  const { getAnonId } = useAuth();
  const anonId = getAnonId()


    const BOOKINGS_STORAGE_KEY = 'bookings';

function getStoredBookings() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}


  function saveBookingToStorage(booking) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredBookings();
    // De-dupe by id if the backend returns one; otherwise just append.
    const filtered = booking.id
      ? existing.filter((b) => b.id !== booking.id)
      : existing;
    const updated = [...filtered, booking];
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage can fail (private browsing, quota, etc.) — booking still succeeded server-side, so don't block the UI on this.
  }
}

  // Sync if props change
useEffect(() => {
  if (serviceTypes.length > 0 && !serviceType) {
    setServiceType(serviceTypes[0]);
  }
}, [serviceTypes, serviceType]);
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [telegramReady, setTelegramReady] = useState(false);


  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [needsTelegramPermission, setNeedsTelegramPermission] = useState(false);




  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + maxDaysAhead);
    return d;
  }, [today, maxDaysAhead]);

  const calendarCells = useMemo(
    () => buildMonthGrid(visibleMonth.year, visibleMonth.month),
    [visibleMonth]
  );

const canShowTimes = Boolean(
  (sections.length === 0 || section) &&
  (serviceTypes.length === 0 || serviceType) &&
  selectedDate
);

useEffect(() => {
  if (!canShowTimes) {
    setTimeSlots([]);
    return;
  }
  let cancelled = false;
  getAvailableTimes(section, toDateKey(selectedDate), serviceType, pageId).then((slots) => {
    if (!cancelled) setTimeSlots(slots || []);
  });
  return () => {
    cancelled = true;
  };
}, [canShowTimes, section, selectedDate, serviceType, getAvailableTimes, pageId]);


function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  const tg = window.Telegram?.WebApp;
  // initData is an empty string when the page is opened outside Telegram
  return tg?.initData ? tg : null;
}

function requestTelegramWriteAccess(tg) {
  return new Promise((resolve) => {
    if (tg.initDataUnsafe?.user?.allows_write_to_pm) return resolve(true);
    if (!tg.isVersionAtLeast?.('6.9') || !tg.requestWriteAccess) return resolve(false);
    try {
      tg.requestWriteAccess((allowed) => resolve(Boolean(allowed)));
    } catch {
      resolve(false);
    }
  });
}

  const canGoPrevMonth =
    visibleMonth.year > today.getFullYear() ||
    (visibleMonth.year === today.getFullYear() && visibleMonth.month > today.getMonth());

  const canGoNextMonth =
    visibleMonth.year < maxDate.getFullYear() ||
    (visibleMonth.year === maxDate.getFullYear() && visibleMonth.month < maxDate.getMonth());

  function changeMonth(delta) {
    setVisibleMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function toggleField(field) {
    setActiveField((current) => (current === field ? null : field));
  }


const bookingComplete = Boolean(
  
  (sections.length === 0 || section) &&
  (serviceTypes.length === 0 || serviceType) &&
  selectedDate &&
  time &&
  guests
);

  const contactComplete = fullName.trim().length > 0 && contact.trim().length > 0;

  function goToDetails() {
    if (!bookingComplete) return;
    setActiveField(null);
    setStep(2);
  }

 function backToBooking() {
  setStep(1);
  setNeedsTelegramPermission(false);
  setError(null);
}

function startOver() {
    setStep(1);
    setActiveField(null);
    setGuests(2);
    setSelectedDate(null);
    setSection(sections.length === 1 ? sections[0] : null);
    setServiceType(serviceTypes.length === 1 ? serviceTypes[0] : null);
    setTime(null);
    setFullName('');
    setContact('');
    setNote('');
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
    setNeedsTelegramPermission(false);
  }

// Does the actual API call. Only runs once permission is settled.
async function submitBooking(tg, writeAllowed) {
  setSubmitting(true);
  setError(null);

  try {
    const url = `${API_BASE}/api/booking-link/booking/create`;
    const res = await fetch(`${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId,
        anonId,
        sectionId: section?.id ?? null,
        serviceTypeId: serviceType?.id ?? null,
        guests,
        date: toDateKey(selectedDate),
        time,
        fullName: fullName.trim(),
        contact: contact.trim(),
        note: note.trim(),
        telegramInitData: tg?.initData ?? null,
        telegramWriteAccess: writeAllowed,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('booking/create failed body:', body);
      throw new Error(body.error || 'Request failed');
    }

    const data = await res.json();

    const bookingRecord = {
      id: data.booking?.id ?? null,
      pageId,
      placeName,
      sectionId: section?.id ?? null,
      sectionName: section?.name ?? null,
      serviceTypeId: serviceType?.id ?? null,
      serviceTypeName: serviceType?.name ?? null,
      guests,
      date: toDateKey(selectedDate),
      time,
      fullName: fullName.trim(),
      contact: contact.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
      ...data.booking,
    };

    saveBookingToStorage(bookingRecord);
    setBookingId(data.booking?.id ?? null);

    if (onConfirm) {
      try {
        await onConfirm(data.booking);
      } catch (onConfirmErr) {
        console.error('onConfirm callback threw:', onConfirmErr);
      }
    }

    setTelegramReady(Boolean(tg) && writeAllowed);
    setSubmitted(true);
  } catch (err) {
    console.error('submitBooking error:', err);
    setError(err.message || 'Something went wrong. Please try again.');
  } finally {
    setSubmitting(false);
  }
}

// "Confirm booking" button
async function handleConfirmBooking() {
  if (!bookingComplete || !contactComplete) return;
  setError(null);

  const tg = getTelegramWebApp();

  // Not inside Telegram: nothing to ask, just submit.
  if (!tg) return submitBooking(null, false);

  const allowed = await requestTelegramWriteAccess(tg);
  if (!allowed) {
    // Do NOT submit. Show the "Allow notifications" button instead.
    setNeedsTelegramPermission(true);
    setError('Please allow notifications so we can confirm your booking on Telegram.');
    return;
  }

  return submitBooking(tg, true);
}

// "Allow notifications" button (shown after a denial)
async function handleAllowNotifications() {
  const tg = getTelegramWebApp();
  if (!tg) {
    setNeedsTelegramPermission(false);
    return;
  }

  setError(null);
  const allowed = await requestTelegramWriteAccess(tg);
  if (!allowed) {
    setError('Notifications are still blocked. Tap "Allow notifications" and choose OK.');
    return;
  }

  setNeedsTelegramPermission(false);
  await submitBooking(tg, true);
}


  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : null;
return (
    <section id={id} className="scroll-mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-[#141414]">Reserve a table</h2>
      <p className="mt-1 text-sm text-black/45">
        {placeName ? `Book a table at ${placeName} in a couple of taps.` : 'Book a table in a couple of taps.'}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {!submitted && (
          <div className="flex gap-1.5 px-5 pt-5">
            <ProgressSegment active={step >= 1} label="Booking" />
            <ProgressSegment active={step >= 2} label="Your details" />
          </div>
        )}

        <div className="px-5 py-5">
          {submitted ? (
         <PendingPanel
            guests={guests}
            date={selectedDate}
            section={section}
            serviceType={serviceType}
            time={time}
            bookingId={bookingId}
            telegramReady={telegramReady}
            telegramBotUsername={process.env.NEXT_PUBLIC_MERCHANT_TELEGRAM_BOT_USERNAME
}
            onDone={startOver}
          />
          ) : submitting ? (
            <LoadingPanel />
          ) : step === 1 ? (
            <BookingStep
              section={section}
              serviceType={serviceType}
              guests={guests}
              setGuests={setGuests}
              maxGuests={maxGuests}
              selectedDateLabel={formattedDate}
              time={time}
              canShowTimes={canShowTimes}
              timeSlots={timeSlots}
              activeField={activeField}
              onToggleField={toggleField}
              openingHours={openingHours}
              sections={sections}
              serviceTypes={serviceTypes}
              onSelectSection={(v) => {
                setSection(v);
                setActiveField(null);
              }}
              onSelectServiceType={(v) => {
                setServiceType(v);
                setActiveField(null);
              }}
             onSelectDate={(d) => {
                setSelectedDate(d);
                setTime(null);
                setActiveField(null);
              }}
              onSelectTime={(t) => {
                setTime(t);
                setActiveField(null);
              }}
              calendarCells={calendarCells}
              visibleMonth={visibleMonth}
              changeMonth={changeMonth}
              today={today}
              maxDate={maxDate}
              selectedDate={selectedDate}
              canGoPrevMonth={canGoPrevMonth}
              canGoNextMonth={canGoNextMonth}
            />
          ) : (
            <DetailsStep
              fullName={fullName}
              setFullName={setFullName}
              contact={contact}
              setContact={setContact}
              note={note}
              setNote={setNote}
            />
          )}
        </div>

        {!submitted && !submitting && (
          <div className="border-t border-black/10 px-5 py-4">
            {step === 1 ? (
              <button
                type="button"
                disabled={!bookingComplete}
                onClick={goToDetails}
                className="w-full rounded-full bg-[#141414] px-5 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
             <div className="flex flex-col gap-2">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={backToBooking}
      className="shrink-0 rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black/60 transition hover:border-black/20 hover:text-black"
    >
      Back
    </button>

    <div className="flex-1">
      {needsTelegramPermission ? (
        <button
          type="button"
          onClick={handleAllowNotifications}
          className="w-full rounded-full bg-[#229ED9] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Allow notifications 
        </button>
      ) : (
        <button
          type="button"
          disabled={!contactComplete}
          onClick={handleConfirmBooking}
          className="w-full rounded-full bg-[#141414] px-5 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm booking
        </button>
      )}
    </div>
  </div>

  {error && (
    <p className="text-center text-xs font-medium text-red-600">{error}</p>
  )}
</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================= PROGRESS ============================= */

function ProgressSegment({ active, label }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className={`h-1 rounded-full transition-colors ${active ? 'bg-[#141414]' : 'bg-black/10'}`} />
      <span className={`text-[11px] font-medium ${active ? 'text-[#141414]' : 'text-black/35'}`}>{label}</span>
    </div>
  );
}

/* ============================== STEP 1 =============================== */

function BookingStep({
  openingHours,
  section,
  serviceType,
  guests,
  setGuests,
  maxGuests,
  selectedDateLabel,
  time,
  canShowTimes,
  timeSlots,
  activeField,
  onToggleField,
  sections,
  serviceTypes,
  onSelectSection,
  onSelectServiceType,
  onSelectDate,
  onSelectTime,
  calendarCells,
  visibleMonth,
  changeMonth,
  today,
  maxDate,
  selectedDate,
  canGoPrevMonth,
  canGoNextMonth,
}) {
  return (
    <div className="flex flex-col gap-3">
{sections.length > 1 && (
  <BookingField
    label="Location"
    icon={MapPin}
    value={section?.name}
    placeholder="Choose a location"
    isOpen={activeField === 'location'}
    onClick={() => onToggleField('location')}
  >
    <LocationSelector sections={sections} selected={section} onSelect={onSelectSection} />
  </BookingField>
)}

<BookingField
  label="Guests"
  icon={Users}
  value={`${guests} ${guests === 1 ? 'guest' : 'guests'}`}
  isOpen={activeField === 'guests'}
  onClick={() => onToggleField('guests')}
>
  <GuestSelector
    guests={guests}
    setGuests={setGuests}
    maxGuests={maxGuests}
    onConfirm={() => onToggleField('guests')}
  />
</BookingField>

<BookingField
  label="Service type"
  icon={Utensils}
  value={serviceType?.name}
  placeholder="Choose service type"
  isOpen={activeField === 'serviceType'}
  onClick={() => onToggleField('serviceType')}
>
  <ServiceTypeSelector serviceTypes={serviceTypes} selected={serviceType} onSelect={onSelectServiceType} />
</BookingField>

<BookingField
  label="Date"
  icon={Calendar}
  value={selectedDateLabel}
  placeholder="Choose a date"
  isOpen={activeField === 'date'}
  onClick={() => onToggleField('date')}
>
  <DateSelector
    calendarCells={calendarCells}
    visibleMonth={visibleMonth}
    changeMonth={changeMonth}
    today={today}
    maxDate={maxDate}
    selectedDate={selectedDate}
    onSelectDate={onSelectDate}
    canGoPrevMonth={canGoPrevMonth}
    canGoNextMonth={canGoNextMonth}
  />
</BookingField>

<BookingField
  label="Time"
  icon={Clock}
  value={time}
  placeholder={canShowTimes ? 'Choose a time' : 'Choose location, service and date first'}
  disabled={!canShowTimes}
  isOpen={activeField === 'time'}
  onClick={() => onToggleField('time')}
>
<TimeSelector
  timeSlots={timeSlots}
  time={time}
  onSelectTime={onSelectTime}
  daySchedule={getDaySchedule(openingHours, selectedDate)}
/>
</BookingField>
    </div>
  );
}

/* ============================== STEP 2 =============================== */

function DetailsStep({ fullName, setFullName, contact, setContact, note, setNote }) {
  return (
    <div className="flex flex-col gap-5">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <User className="h-3.5 w-3.5" />
          Full name
        </span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Sokha Chan"
          className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-base text-[#141414] outline-none transition-colors placeholder:text-black/30 focus:border-[#141414]"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <Phone className="h-3.5 w-3.5" />
          Phone or Telegram Number
        </span>
        <input
          type="number"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="e.g. 012 345 678 "
          className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-base text-[#141414] outline-none transition-colors placeholder:text-black/30 focus:border-[#141414]"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <StickyNote className="h-3.5 w-3.5" />
          Note <span className="ml-1 font-normal text-black/30">optional</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Allergies, special occasion, seating preference..."
          rows={4}
          className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-base text-[#141414] outline-none transition-colors placeholder:text-black/30 focus:border-[#141414]"
        />
      </label>
    </div>
  );
}
/* ============================ BOOKING FIELD ============================ */

function BookingField({ label, icon: Icon, value, placeholder = 'Choose', onClick, disabled = false, isOpen, children }) {
  return (
    <>
      <div
        className={`overflow-hidden rounded-2xl border transition-colors ${
          disabled ? 'border-black/5 bg-[#faf9f6]' : 'border-black/10'
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`group flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors ${
            disabled ? 'cursor-not-allowed' : 'hover:bg-[#faf9f6]'
          }`}
        >
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/40">
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </span>
            <span className={`mt-1 block truncate text-sm font-medium ${value ? 'text-[#141414]' : 'text-black/35'}`}>
              {value || placeholder}
            </span>
          </div>
          {!disabled && <ChevronRightIcon className="ml-3 h-4 w-4 shrink-0 text-black/35" />}
        </button>
      </div>

      <Modal isOpen={isOpen && !disabled} onClose={onClick} title={label}>
        {children}
      </Modal>
    </>
  );
}

/* ================================= MODAL ================================= */

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#141414]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition hover:bg-black/5 hover:text-black"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* =========================== LOCATION SELECTOR =========================== */

function LocationSelector({ sections, selected, onSelect }) {
  if (!sections || sections.length === 0) {
    return <p className="py-2 text-center text-sm text-black/40">No locations available.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {sections.map((option) => {
        const isSelected = selected?.id === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              isSelected ? 'border-[#141414] bg-[#faf9f6]' : 'border-black/10 hover:border-black/25 hover:bg-[#faf9f6]'
            }`}
          >
            <span className={`text-sm font-medium ${isSelected ? 'text-[#141414]' : 'text-black/60'}`}>
              {option.name}
            </span>
            {isSelected && <CheckIcon className="h-4 w-4 text-[#141414]" />}
          </button>
        );
      })}
    </div>
  );
}

/* ============================= GUEST SELECTOR ============================= */

function GuestSelector({ guests, setGuests, maxGuests, onConfirm }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          type="button"
          disabled={guests <= 1}
          onClick={() => setGuests((g) => Math.max(1, g - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:border-black/25 disabled:opacity-30"
          aria-label="Decrease guests"
        >
          <MinusIcon className="h-4 w-4" />
        </button>

        <div className="w-20 text-center">
          <div className="text-2xl font-semibold text-[#141414]">{guests}</div>
          <div className="mt-1 text-xs text-black/45">{guests === 1 ? 'guest' : 'guests'}</div>
        </div>

        <button
          type="button"
          disabled={guests >= maxGuests}
          onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:border-black/25 disabled:opacity-30"
          aria-label="Increase guests"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="w-full rounded-full bg-[#141414] px-5 py-3 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
      >
        Confirm {guests} {guests === 1 ? 'guest' : 'guests'}
      </button>
    </div>
  );
}
/* ========================= SERVICE TYPE SELECTOR ========================= */

function ServiceTypeSelector({ serviceTypes, selected, onSelect }) {
  if (!serviceTypes || serviceTypes.length === 0) {
    return <p className="py-2 text-center text-sm text-black/40">No service types available.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {serviceTypes.map((option) => {
        const isSelected = selected?.id === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              isSelected ? 'border-[#141414] bg-[#faf9f6]' : 'border-black/10 hover:border-black/25 hover:bg-[#faf9f6]'
            }`}
          >
            <span className={`text-sm font-medium ${isSelected ? 'text-[#141414]' : 'text-black/60'}`}>
              {option.name}
            </span>
            {isSelected && <CheckIcon className="h-4 w-4 text-[#141414]" />}
          </button>
        );
      })}
    </div>
  );
}
/* ============================== DATE SELECTOR ============================== */

function DateSelector({
  calendarCells,
  visibleMonth,
  changeMonth,
  today,
  maxDate,
  selectedDate,
  onSelectDate,
  canGoPrevMonth,
  canGoNextMonth,
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrevMonth}
          onClick={() => changeMonth(-1)}
          className="rounded-full p-2 text-black/60 transition hover:bg-[#faf9f6] disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <span className="text-sm font-semibold text-[#141414]">
          {MONTH_LABELS[visibleMonth.month]} {visibleMonth.year}
        </span>

        <button
          type="button"
          disabled={!canGoNextMonth}
          onClick={() => changeMonth(1)}
          className="rounded-full p-2 text-black/60 transition hover:bg-[#faf9f6] disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="text-[11px] font-medium text-black/35">
            {weekday}
          </span>
        ))}

        {calendarCells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const disabled = date < today || date > maxDate;
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={toDateKey(date)}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                selected
                  ? 'bg-[#141414] font-semibold text-[#faf9f6]'
                  : disabled
                  ? 'text-black/20'
                  : isToday
                  ? 'font-semibold text-[#141414] hover:bg-[#faf9f6]'
                  : 'text-black/60 hover:bg-[#faf9f6]'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== TIME SELECTOR ============================== */

function TimeSelector({ timeSlots, time, onSelectTime, daySchedule }) {
  if (timeSlots.length === 0) {
    return <p className="py-4 text-center text-sm text-black/45">No times available.</p>;
  }

  const groups = groupTimeSlots(timeSlots, daySchedule);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key}>
          {group.label && (
            <h3 className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-black/45">
              <span>{group.label}</span>
              <span className="font-normal normal-case tracking-normal text-black/30">
                {group.range}
              </span>
            </h3>
          )}
          <div className="grid grid-cols-3 gap-2">
            {group.slots.map((slot) => {
              const selected = time === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                  className={`rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[#141414] bg-[#faf9f6] text-[#141414]'
                      : slot.available
                      ? 'border-black/10 text-black/60 hover:border-black/25 hover:bg-[#faf9f6]'
                      : 'border-black/5 text-black/20 line-through'
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
/* =================================== LOADING =================================== */

function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-[#141414]" />
      <p className="text-sm text-black/45">Confirming your table...</p>
    </div>
  );
}

/* =================================== SUCCESS =================================== */

function SuccessPanel({ guests, date, section, serviceType, time, onDone }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <CheckIcon className="h-6 w-6 text-emerald-600" />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#141414]">Table reserved</p>
        <p className="mt-2 text-sm leading-6 text-black/50">
          {guests} {guests === 1 ? 'guest' : 'guests'} · {section?.name} · {serviceType?.name} · {time}
          {date && (
            <>
              {' '}
              on {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-3 px-5 py-3 text-sm font-medium text-[#141414] transition hover:border-black/20"
      >
        Make another booking
      </button>
    </div>
  );
}


function PendingPanel({ guests, date, section, serviceType, time, bookingId, telegramReady, telegramBotUsername, onDone }) {
  const [notifyRequested, setNotifyRequested] = useState(false);
  const linked = telegramReady || notifyRequested;

  const handleNotify = () => {
    // Deep link with the booking id as the /start payload — the bot picks
    // this up in the webhook and links the resulting chat_id to the booking.
    const deepLink = `https://t.me/${telegramBotUsername}?start=${bookingId}`;
    window.open(deepLink, '_blank', 'noopener,noreferrer');
    setNotifyRequested(true);
  };

  const rows = [
    date && {
      label: 'Date',
      value: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    },
    time && { label: 'Time', value: time },
    { label: 'Party size', value: `${guests} ${guests === 1 ? 'guest' : 'guests'}` },
    section?.name && { label: 'Area', value: section.name },
    serviceType?.name && { label: 'Service', value: serviceType.name },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Status */}
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
          <ClockIcon className="h-5 w-5 text-amber-600" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-amber-500" />
          </span>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#141414]">Waiting for the venue to confirm</h2>
          <p className="mt-1 text-sm leading-6 text-black/55">
            Your table isn&apos;t reserved until they accept. This usually doesn&apos;t take long.
          </p>
        </div>
      </div>

      {/* Booking summary */}
      <dl className="divide-y divide-black/5 rounded-xl border border-black/10 px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-black/45">{row.label}</dt>
            <dd className="text-right text-sm font-medium text-[#141414]">{row.value}</dd>
          </div>
        ))}
      </dl>

      {/* Notifications */}
      {linked ? (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm leading-6 text-emerald-800">
            Telegram is connected. We&apos;ll message you as soon as the venue responds.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl bg-black/[0.03] px-4 py-4">
          <p className="text-sm leading-6 text-black/60">
            Don&apos;t want to keep this page open? Get the venue&apos;s answer on Telegram instead.
          </p>
          <button
            type="button"
            onClick={handleNotify}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#141414] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L5.4 13.8.7 12.3c-1-.3-1-1 .2-1.5L20.400 3.700c.9-.3 1.700.2 1.500.6Z" />
            </svg>
            Get updates on Telegram
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="self-center rounded-md px-3 py-2 text-sm font-medium text-black/60 underline underline-offset-4 transition-colors hover:text-[#141414] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#141414]"
      >
        Make another booking
      </button>
    </div>
  );
}

/* ===================================== ICONS ===================================== */

function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}