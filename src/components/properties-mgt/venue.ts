/**
 * Event-centre listing rules, shared by every screen that lists or shows a hall.
 *
 * Mirrors api-v1 services/properties/venue.py. A venue is hired by the day,
 * half day or hour (any mix), during the hall's opening hours, and a hall may
 * be booked several times a day. The API is the authority; these helpers keep
 * the forms from offering what it would refuse, and make every card say the
 * same thing about a hall.
 */
import { IHalfDayWindow, PropertyType } from "./types";

export type BillingUnit = "PER_DAY" | "PER_HALF_DAY" | "PER_HOUR";

export const BILLING_UNIT_LABEL: Record<BillingUnit, string> = {
  PER_DAY: "day",
  PER_HALF_DAY: "half day",
  PER_HOUR: "hour",
};

export const DEFAULT_OPENING = "08:00";
export const DEFAULT_CLOSING = "23:00";
export const DEFAULT_BUFFER_MINUTES = 60;
export const MAX_BUFFER_MINUTES = 240;
export const MAX_HALF_DAY_WINDOWS = 2;
export const DEFAULT_HALF_DAY_WINDOWS: IHalfDayWindow[] = [
  { name: "Morning", start: "08:00", end: "14:00" },
  { name: "Evening", start: "16:00", end: "23:00" },
];

export const isVenue = (type?: string | null): boolean =>
  String(type ?? "").toUpperCase() === PropertyType.EVENT_CENTRE;

/** Words that change when the listing is an event centre. */
export const venueCopy = (venue: boolean) => ({
  unit: venue ? "hall" : "unit",
  Unit: venue ? "Hall" : "Unit",
  units: venue ? "halls" : "units",
  Units: venue ? "Halls & Spaces" : "Units",
});

/** The hall's rate card as it is filled in on a form. */
export type HallRates = {
  offers_full_day: boolean;
  offers_half_day: boolean;
  offers_hourly: boolean;
  event_price_per_day: string;
  event_price_per_half_day: string;
  event_price_per_hour: string;
};

/** The hall's hours and same-day rules as they are filled in on a form. */
export type HallSchedule = {
  opening_time: string;
  closing_time: string;
  half_day_windows: IHalfDayWindow[];
  event_buffer_minutes: number;
  allows_multiple_bookings_per_day: boolean;
};

export type HallForm = HallRates & HallSchedule;

export const emptyHallForm = (): HallForm => ({
  offers_full_day: true,
  offers_half_day: false,
  offers_hourly: false,
  event_price_per_day: "",
  event_price_per_half_day: "",
  event_price_per_hour: "",
  opening_time: DEFAULT_OPENING,
  closing_time: DEFAULT_CLOSING,
  half_day_windows: DEFAULT_HALF_DAY_WINDOWS.map((w) => ({ ...w })),
  event_buffer_minutes: DEFAULT_BUFFER_MINUTES,
  // New halls may be booked several times a day unless the agent says not.
  allows_multiple_bookings_per_day: true,
});

const positive = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const pick = (unit: any, snake: string, camel: string) =>
  unit?.[snake] ?? unit?.[camel];

/** Read a hall from the API (snake_case or camelCase) into form values. */
export const hallFormFromUnit = (unit: any): HallForm => {
  const day = pick(unit, "event_price_per_day", "eventPricePerDay");
  const half = pick(unit, "event_price_per_half_day", "eventPricePerHalfDay");
  const hour = pick(unit, "event_price_per_hour", "eventPricePerHour");
  const windows = pick(unit, "half_day_windows", "halfDayWindows");
  const buffer = pick(unit, "event_buffer_minutes", "eventBufferMinutes");
  const multiple = pick(unit, "allows_multiple_bookings_per_day", "allowsMultipleBookingsPerDay");
  return {
    offers_full_day: positive(day) > 0,
    offers_half_day: positive(half) > 0,
    offers_hourly: positive(hour) > 0,
    event_price_per_day: positive(day) ? String(day) : "",
    event_price_per_half_day: positive(half) ? String(half) : "",
    event_price_per_hour: positive(hour) ? String(hour) : "",
    opening_time: (pick(unit, "opening_time", "openingTime") || DEFAULT_OPENING).slice(0, 5),
    closing_time: (pick(unit, "closing_time", "closingTime") || DEFAULT_CLOSING).slice(0, 5),
    half_day_windows:
      Array.isArray(windows) && windows.length
        ? windows.map((w: IHalfDayWindow) => ({ ...w }))
        : DEFAULT_HALF_DAY_WINDOWS.map((w) => ({ ...w })),
    event_buffer_minutes: buffer == null ? DEFAULT_BUFFER_MINUTES : Number(buffer),
    // A stored NULL means "one booking a day" (the backend reads it that way).
    allows_multiple_bookings_per_day: Boolean(multiple),
  };
};

/** First thing wrong with a hall's setup, in the agent's words; null if fine. */
export const validateHall = (h: HallForm): string | null => {
  const day = h.offers_full_day ? positive(h.event_price_per_day) : 0;
  const half = h.offers_half_day ? positive(h.event_price_per_half_day) : 0;
  const hour = h.offers_hourly ? positive(h.event_price_per_hour) : 0;
  if (!h.offers_full_day && !h.offers_half_day && !h.offers_hourly)
    return "Choose at least one way this hall is hired.";
  if (h.offers_full_day && !day) return "Enter the full-day price.";
  if (h.offers_half_day && !half) return "Enter the half-day price.";
  if (h.offers_hourly && !hour) return "Enter the hourly price.";
  if (!h.opening_time || !h.closing_time) return "Enter the hall's opening and closing times.";
  if (h.closing_time <= h.opening_time) return "Closing time must be after opening time.";
  if (h.event_buffer_minutes < 0 || h.event_buffer_minutes > MAX_BUFFER_MINUTES)
    return `The gap between events must be between 0 and ${MAX_BUFFER_MINUTES} minutes.`;
  if (h.offers_half_day) {
    if (!h.half_day_windows.length) return "Add at least one half-day session.";
    const sorted = [...h.half_day_windows].sort((a, b) => a.start.localeCompare(b.start));
    const names = new Set<string>();
    for (const w of sorted) {
      if (!w.name.trim()) return "Every half-day session needs a name, e.g. Morning.";
      if (names.has(w.name.trim().toLowerCase())) return "Half-day sessions need different names.";
      names.add(w.name.trim().toLowerCase());
      if (!w.start || !w.end || w.end <= w.start)
        return `The ${w.name} session must end after it starts.`;
      if (w.start < h.opening_time || w.end > h.closing_time)
        return `The ${w.name} session must fall inside the opening hours.`;
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end)
        return `The ${sorted[i - 1].name} and ${sorted[i].name} sessions overlap.`;
    }
  }
  return null;
};

/** The headline rate: day, else half day, else hour. */
export const headlineRate = (
  rates: Pick<HallRates, "event_price_per_day" | "event_price_per_half_day" | "event_price_per_hour"> &
    Partial<HallRates>,
): { price: number; unit: BillingUnit } | null => {
  const order: [BillingUnit, string, boolean | undefined][] = [
    ["PER_DAY", rates.event_price_per_day, rates.offers_full_day],
    ["PER_HALF_DAY", rates.event_price_per_half_day, rates.offers_half_day],
    ["PER_HOUR", rates.event_price_per_hour, rates.offers_hourly],
  ];
  for (const [unit, price, offered] of order) {
    if (offered !== false && positive(price)) return { price: positive(price), unit };
  }
  return null;
};

/** The hall fields the API takes, from a form. An unticked rate is cleared. */
export const hallPayload = (h: HallForm) => {
  const headline = headlineRate(h);
  return {
    price_per_night: headline ? String(headline.price) : "0",
    event_price_per_day: h.offers_full_day ? String(h.event_price_per_day) : null,
    event_price_per_half_day: h.offers_half_day ? String(h.event_price_per_half_day) : null,
    event_price_per_hour: h.offers_hourly ? String(h.event_price_per_hour) : null,
    opening_time: h.opening_time,
    closing_time: h.closing_time,
    half_day_windows: h.offers_half_day
      ? h.half_day_windows.map((w) => ({ name: w.name.trim(), start: w.start, end: w.end }))
      : null,
    event_buffer_minutes: Number(h.event_buffer_minutes) || 0,
    allows_multiple_bookings_per_day: h.allows_multiple_bookings_per_day,
    // A hall has no rooms to count.
    bedroom_count: 0,
    living_room_count: 0,
    kitchen_count: 0,
  };
};

/** "₦500,000 / day · ₦50,000 / hour" — every rate a hall offers. */
export const rateSummary = (unit: any, formatMoney: (n: number) => string): string => {
  const parts: string[] = [];
  const add = (v: unknown, label: string) => {
    if (positive(v)) parts.push(`${formatMoney(positive(v))} / ${label}`);
  };
  add(pick(unit, "event_price_per_day", "eventPricePerDay"), "day");
  add(pick(unit, "event_price_per_half_day", "eventPricePerHalfDay"), "half day");
  add(pick(unit, "event_price_per_hour", "eventPricePerHour"), "hour");
  return parts.join(" · ");
};

/** "08:00–23:00" for a hall, or "" when unknown. */
export const hoursLabel = (unit: any): string => {
  const open = pick(unit, "opening_time", "openingTime");
  const close = pick(unit, "closing_time", "closingTime");
  return open && close ? `${String(open).slice(0, 5)}–${String(close).slice(0, 5)}` : "";
};

/** What a hall's headline price is per: "day", "half day" or "hour". */
export const headlineUnitLabel = (unit: any): string => {
  const stored = pick(unit, "headline_billing_unit", "headlineBillingUnit") as BillingUnit | null;
  if (stored && BILLING_UNIT_LABEL[stored]) return BILLING_UNIT_LABEL[stored];
  const derived = headlineRate({
    event_price_per_day: pick(unit, "event_price_per_day", "eventPricePerDay"),
    event_price_per_half_day: pick(unit, "event_price_per_half_day", "eventPricePerHalfDay"),
    event_price_per_hour: pick(unit, "event_price_per_hour", "eventPricePerHour"),
  });
  return derived ? BILLING_UNIT_LABEL[derived.unit] : "day";
};

/** A listing's price for a table or card: "₦X/night", or "from ₦X / hour" for a venue. */
export const listingPriceLabel = (units: any[] | undefined, venue: boolean): string => {
  const rows = (units ?? [])
    .map((u) => ({ u, price: parseFloat(String(u?.price_per_night ?? u?.pricePerNight ?? 0)) || 0 }))
    .filter((r) => r.price > 0);
  if (!rows.length) return venue ? "No halls" : "No units";
  const min = rows.reduce((a, b) => (b.price < a.price ? b : a));
  const max = Math.max(...rows.map((r) => r.price));
  if (venue) {
    const prefix = rows.length > 1 ? "from " : "";
    return `${prefix}₦${min.price.toLocaleString()} / ${headlineUnitLabel(min.u)}`;
  }
  return min.price === max
    ? `₦${min.price.toLocaleString()}/night`
    : `₦${min.price.toLocaleString()} – ₦${max.toLocaleString()}/night`;
};
