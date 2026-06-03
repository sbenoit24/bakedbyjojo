// Pickup-window scheduling helpers. Time slots are generated from the constants
// below — change a start/end/interval here and the calendar UI follows.
//
// Times are stored as minutes-since-midnight (e.g. 17 * 60 === 5:00 PM) so the
// arithmetic stays simple and locale-independent.

const WEEKDAY = { startMin: 17 * 60, endMin: 20 * 60, stepMin: 30 }; // Mon–Fri 5:00–8:00 PM
const WEEKEND = { startMin: 13 * 60, endMin: 19 * 60, stepMin: 30 }; // Sat/Sun 1:00–7:00 PM

// Latest selectable pickup date = today + this many days.
export const PICKUP_WINDOW_DAYS = 60;

export type Slot = { minutes: number; label: string };

// "5:00 PM" — pure arithmetic, no Intl/locale, so it's safe to call during render.
function labelFor(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function buildSlots({ startMin, endMin, stepMin }: { startMin: number; endMin: number; stepMin: number }): Slot[] {
  const out: Slot[] = [];
  for (let m = startMin; m <= endMin; m += stepMin) out.push({ minutes: m, label: labelFor(m) });
  return out;
}

// day: 0 = Sunday … 6 = Saturday (matches Date.getDay()).
export function slotsForDay(day: number): Slot[] {
  return day === 0 || day === 6 ? buildSlots(WEEKEND) : buildSlots(WEEKDAY);
}

// Parse "YYYY-MM-DD" into a LOCAL-midnight Date. We build it from parts rather
// than `new Date(str)` (which would parse as UTC) so the day matches how the
// calendar compares dates locally.
export function parseLocalDate(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

// Build an ISO 8601 string with the user's local UTC offset, e.g.
// "2026-06-07T18:30:00-04:00", from a selected calendar day plus a slot's
// minutes-since-midnight. Calls `new Date()`, so only invoke from event
// handlers — never during render.
export function toISOWithOffset(date: Date, minutes: number): string {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0,
  );
  const p = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const tz = -d.getTimezoneOffset(); // minutes east of UTC
  const sign = tz >= 0 ? "+" : "-";
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:00` +
    `${sign}${p(Math.floor(Math.abs(tz) / 60))}:${p(Math.abs(tz) % 60)}`
  );
}
