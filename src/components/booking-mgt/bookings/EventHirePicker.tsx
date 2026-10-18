"use client";

import { useEffect, useMemo } from "react";
import { GetEventSlots } from "@/src/lib/request-handlers/unitMgt";
import { BILLING_UNIT_LABEL, BillingUnit } from "../../properties-mgt/venue";

/**
 * How a staff member books an event-centre hall: by the day, a half-day
 * session or a number of hours, at a time that is still free.
 *
 * Reads `GET .../event-slots` for the chosen date, which is computed by the
 * same engine that accepts or refuses the booking, so it only ever offers a
 * slot the API will take.
 */
export type EventHire = {
  billing_unit: BillingUnit;
  /** Days for a full-day hire, hours for an hourly one, 1 for a session. */
  billing_duration: number;
  event_start_time: string | null;
  half_day_window_name: string | null;
};

interface EventHirePickerProps {
  propertyId?: string | number;
  unit: any;
  /** The event date, YYYY-MM-DD; the first day of a full-day hire. */
  date?: string;
  value: EventHire;
  onChange: (next: EventHire) => void;
}

const select =
  "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm";

export const offeredUnits = (unit: any): BillingUnit[] => {
  const listed = unit?.offered_billing_units as BillingUnit[] | undefined;
  if (Array.isArray(listed) && listed.length) return listed;
  return unit?.event_price_per_day || unit?.eventPricePerDay ? ["PER_DAY"] : [];
};

export const emptyHire = (unit: any): EventHire => ({
  billing_unit: offeredUnits(unit)[0] ?? "PER_DAY",
  billing_duration: 1,
  event_start_time: null,
  half_day_window_name: null,
});

/** True once the hire names everything the API needs. */
export const hireIsComplete = (hire: EventHire): boolean =>
  hire.billing_unit === "PER_DAY"
    ? hire.billing_duration >= 1
    : hire.billing_unit === "PER_HOUR"
      ? !!hire.event_start_time && hire.billing_duration >= 1
      : !!hire.half_day_window_name;

export default function EventHirePicker({
  propertyId,
  unit,
  date,
  value,
  onChange,
}: EventHirePickerProps) {
  const offered = offeredUnits(unit);
  const { data, isLoading } = GetEventSlots(propertyId, unit?.id, date, !!date);
  const slots = data?.data?.data;

  const starts: { start: string; max_hours: number }[] = useMemo(
    () => slots?.hourly_starts ?? [],
    [slots],
  );
  const chosenStart = starts.find((s) => s.start === value.event_start_time);

  // A slot taken since it was picked, or a date change, clears the choice
  // rather than leaving a stale time the API would refuse.
  useEffect(() => {
    if (!slots) return;
    if (value.billing_unit === "PER_HOUR" && value.event_start_time && !chosenStart) {
      onChange({ ...value, event_start_time: null });
    }
    if (value.billing_unit === "PER_HALF_DAY" && value.half_day_window_name) {
      const w = (slots.half_day_windows ?? []).find(
        (x: any) => x.name === value.half_day_window_name,
      );
      if (!w?.available) onChange({ ...value, half_day_window_name: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  if (!offered.length) {
    return (
      <p className="text-xs text-amber-600">
        This hall has no rates set up yet. Edit the hall to add how it is hired.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-zinc-700 block mb-1">Hire by</label>
        <select
          className={select}
          value={value.billing_unit}
          onChange={(e) =>
            onChange({
              billing_unit: e.target.value as BillingUnit,
              billing_duration: 1,
              event_start_time: null,
              half_day_window_name: null,
            })
          }
        >
          {offered.map((u) => (
            <option key={u} value={u}>
              {u === "PER_DAY" ? "Full day" : u === "PER_HALF_DAY" ? "Half-day session" : "The hour"}
            </option>
          ))}
        </select>
      </div>

      {!date ? (
        <p className="text-xs text-zinc-500">Pick the event date to see free times.</p>
      ) : isLoading ? (
        <p className="text-xs text-zinc-500">Checking free times...</p>
      ) : value.billing_unit === "PER_DAY" ? (
        <div>
          <label className="text-sm font-medium text-zinc-700 block mb-1">Number of days</label>
          <input
            type="number"
            min={1}
            max={30}
            className={select}
            value={value.billing_duration}
            onChange={(e) =>
              onChange({
                ...value,
                billing_duration: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)),
              })
            }
          />
          {slots && !slots.full_day_available && (
            <p className="text-xs text-red-500 mt-1">
              The hall is already booked for part of this day.
            </p>
          )}
        </div>
      ) : value.billing_unit === "PER_HALF_DAY" ? (
        <div className="flex flex-wrap gap-2">
          {(slots?.half_day_windows ?? []).map((w: any) => (
            <button
              key={w.name}
              type="button"
              disabled={!w.available}
              onClick={() => onChange({ ...value, billing_duration: 1, half_day_window_name: w.name })}
              className={`px-3 py-2 rounded-lg border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${value.half_day_window_name === w.name ? "border-primary bg-primary/10 text-primary font-semibold" : "border-zinc-200 text-zinc-700"}`}
            >
              {w.name} · {w.start}–{w.end}
              {!w.available && " (taken)"}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Starts at</label>
            <select
              className={select}
              value={value.event_start_time ?? ""}
              onChange={(e) =>
                onChange({ ...value, event_start_time: e.target.value || null, billing_duration: 1 })
              }
            >
              <option value="">Select a time</option>
              {starts.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.start}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Hours</label>
            <select
              className={select}
              disabled={!chosenStart}
              value={value.billing_duration}
              onChange={(e) => onChange({ ...value, billing_duration: Number(e.target.value) })}
            >
              {Array.from({ length: chosenStart?.max_hours ?? 1 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h} {h === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </div>
          {starts.length === 0 && (
            <p className="col-span-2 text-xs text-red-500">No free hours on this date.</p>
          )}
        </div>
      )}

      {slots?.busy?.length > 0 && (
        <p className="text-[11px] text-zinc-500">
          Already booked: {slots.busy.map((b: any) => `${b.start}–${b.end}`).join(", ")}
          {" "}(includes the {slots.event_buffer_minutes}-minute gap between events)
        </p>
      )}
      <p className="text-[11px] text-zinc-400">
        Open {slots?.opening_time ?? "--"}–{slots?.closing_time ?? "--"} · priced per{" "}
        {BILLING_UNIT_LABEL[value.billing_unit]}
      </p>
    </div>
  );
}
