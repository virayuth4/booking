const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Label is derived from when the shift starts
const getShiftLabel = (openMins) => {
  const hour = Math.floor(openMins / 60) % 24;
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

// Normalise a day's schedule into a list of shifts.
// Falls back to the legacy open/close if `slots` is missing.
const getShifts = (daySchedule) => {
  if (!daySchedule || daySchedule.closed) return [];
  const shifts = daySchedule.slots?.length
    ? daySchedule.slots
    : [{ open: daySchedule.open, close: daySchedule.close }];

  return shifts
    .filter((s) => s.open && s.close)
    .map((s) => {
      const from = toMinutes(s.open);
      let to = toMinutes(s.close);
      if (to <= from) to += 24 * 60; // overnight shift, e.g. 18:00-02:00
      return { open: s.open, close: s.close, from, to };
    })
    .sort((a, b) => a.from - b.from);
};

/**
 * groupTimeSlots(timeSlots, daySchedule)
 * -> [{ key, label, range, slots }]  (one group per shift, empty ones skipped)
 */
export function groupTimeSlots(timeSlots, daySchedule) {
  const shifts = getShifts(daySchedule);

  // No schedule info: show everything in one ungrouped list
  if (shifts.length === 0) {
    return [{ key: 'all', label: null, range: null, slots: timeSlots }];
  }

  return shifts
    .map((shift, i) => ({
      key: `shift-${i}`,
      label: getShiftLabel(shift.from),
      range: `${shift.open} – ${shift.close}`,
      slots: timeSlots.filter((slot) => {
        let mins = toMinutes(slot.time);
        if (mins < shift.from && shift.to > 24 * 60) mins += 24 * 60; // after midnight
        return mins >= shift.from && mins < shift.to;
      }),
    }))
    .filter((group) => group.slots.length > 0);
}

// Helper to pick the right day from your hours object
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];


export const getDaySchedule = (openingHours, date) =>
  date ? openingHours?.[DAY_KEYS[new Date(date).getDay()]] : undefined;