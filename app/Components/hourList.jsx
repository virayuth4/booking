"use client";

import { DAY_LABEL, DAY_ORDER } from "@/lib/constants";
import { useState } from "react";

function to12Hour(time) {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${hour12}${period}` : `${hour12}:${mStr}${period}`;
}

// Returns a day's time ranges, supporting both the new `slots` shape
// and the legacy { open, close } shape. Empty array = closed / no hours.
function getSlots(day) {
  if (!day || day.closed) return [];
  if (Array.isArray(day.slots) && day.slots.length) {
    return [...day.slots].sort((a, b) => a.open.localeCompare(b.open));
  }
  if (day.open && day.close) return [{ open: day.open, close: day.close }];
  return [];
}

const formatSlot = (s) => `${to12Hour(s.open)} – ${to12Hour(s.close)}`;

export default function HoursList({ openingHours, todayKey, closedDates = [] }) {
  const [expanded, setExpanded] = useState(true);
  const todaySlots = getSlots(openingHours?.[todayKey]);

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <h2 className="text-xl font-semibold tracking-tight text-[#141414]">Hours</h2>
        <span className="flex items-center gap-1.5 text-right text-sm font-medium text-black/45">
          {todaySlots.length === 0
            ? "Closed today"
            : todaySlots.map(formatSlot).join(" · ")}
          <ChevronIcon
            className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/10">
            {DAY_ORDER.map((day) => {
              const slots = getSlots(openingHours?.[day]);
              const isToday = day === todayKey;
              return (
                <li
                  key={day}
                  className={`flex items-start gap-4 px-5 py-3.5 text-sm ${
                    isToday ? "bg-[#faf9f6]" : ""
                  }`}
                >
                  <span
                    className={`w-28 shrink-0 ${
                      isToday ? "font-medium text-[#141414]" : "text-black/60"
                    }`}
                  >
                    {DAY_LABEL[day]}
                  </span>

                  {slots.length === 0 ? (
                    <span className="text-black/30">Closed</span>
                  ) : (
                    <div
                      className={`flex flex-col gap-1 ${
                        isToday ? "text-[#141414]" : "text-black/45"
                      }`}
                    >
                      {slots.map((slot, idx) => (
                        <span key={idx}>{formatSlot(slot)}</span>
                      ))}
                    </div>
                  )}

                  {isToday && (
                    <span className="ml-auto shrink-0 rounded border border-black/10 px-2 py-0.5 font-mono text-[11px] text-black/40">
                      today
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {closedDates.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-black/60">Closed on</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {closedDates.map((date) => (
                  <span
                    key={date}
                    className="rounded border border-black/10 px-2 py-0.5 font-mono text-[11px] text-black/40"
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}