"use client";

import { Icon } from "@iconify/react";
import { TbCurrencyNaira } from "react-icons/tb";
import { IHalfDayWindow } from "./types";
import {
  DEFAULT_HALF_DAY_WINDOWS,
  HallForm,
  MAX_BUFFER_MINUTES,
  MAX_HALF_DAY_WINDOWS,
} from "./venue";

/**
 * How an event-centre hall is hired: which rates it offers, its opening hours,
 * its half-day sessions, and whether it can be booked more than once a day.
 *
 * Shared by the listing wizard's hall drawer and the standalone add / edit
 * hall screens, so an agent sees the same form wherever they set up a hall.
 */
interface HallFieldsProps {
  value: HallForm;
  onChange: (patch: Partial<HallForm>) => void;
  error?: string | null;
}

const label = "text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1";
const input =
  "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm";

const RATES = [
  {
    flag: "offers_full_day",
    price: "event_price_per_day",
    title: "Full day",
    hint: "From opening to closing time.",
  },
  {
    flag: "offers_half_day",
    price: "event_price_per_half_day",
    title: "Half day",
    hint: "One of the sessions you set below.",
  },
  {
    flag: "offers_hourly",
    price: "event_price_per_hour",
    title: "Per hour",
    hint: "Guests choose a start time and how many hours.",
  },
] as const;

export default function HallFields({ value, onChange, error }: HallFieldsProps) {
  const setWindow = (index: number, patch: Partial<IHalfDayWindow>) =>
    onChange({
      half_day_windows: value.half_day_windows.map((w, i) =>
        i === index ? { ...w, ...patch } : w,
      ),
    });

  const needsHours = value.offers_half_day || value.offers_hourly;

  return (
    <div className="space-y-5">
      {/* Rates */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          How is this hall hired? <span className="text-primary">*</span>
        </h4>
        <p className="text-[11px] text-zinc-500 -mt-1">
          Tick every way guests can hire it, and give each a price.
        </p>
        {RATES.map((rate) => {
          const on = value[rate.flag];
          return (
            <div
              key={rate.flag}
              className={`rounded-xl border p-3 transition-all ${on ? "border-primary bg-primary/5" : "border-zinc-200 bg-zinc-50"}`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => onChange({ [rate.flag]: e.target.checked } as Partial<HallForm>)}
                  className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                />
                <span className="flex-1">
                  <span className="text-xs font-bold text-zinc-900 block">{rate.title}</span>
                  <span className="text-[11px] text-zinc-500 block">{rate.hint}</span>
                </span>
              </label>
              {on && (
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <TbCurrencyNaira className="text-base text-zinc-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    aria-label={`${rate.title} price`}
                    value={value[rate.price]}
                    onChange={(e) => onChange({ [rate.price]: e.target.value } as Partial<HallForm>)}
                    className={`${input} pl-8 font-semibold`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Opening hours */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Opening hours {needsHours && <span className="text-primary">*</span>}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Opens</label>
            <input
              type="time"
              value={value.opening_time}
              onChange={(e) => onChange({ opening_time: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Closes</label>
            <input
              type="time"
              value={value.closing_time}
              onChange={(e) => onChange({ closing_time: e.target.value })}
              className={input}
            />
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Hourly hires must fit inside these hours. A full-day hire holds all of them.
        </p>
      </div>

      {/* Half-day sessions */}
      {value.offers_half_day && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Half-day sessions <span className="text-primary">*</span>
            </h4>
            <button
              type="button"
              disabled={value.half_day_windows.length >= MAX_HALF_DAY_WINDOWS}
              onClick={() =>
                onChange({
                  half_day_windows: [
                    ...value.half_day_windows,
                    {
                      ...(DEFAULT_HALF_DAY_WINDOWS[value.half_day_windows.length] ?? {
                        name: "",
                        start: value.opening_time,
                        end: value.closing_time,
                      }),
                    },
                  ],
                })
              }
              className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <Icon icon="solar:add-circle-bold" className="text-xs" /> ADD
            </button>
          </div>
          {value.half_day_windows.map((w, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <label className={label}>Name</label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Morning"
                  value={w.name}
                  onChange={(e) => setWindow(index, { name: e.target.value })}
                  className={input}
                />
              </div>
              <div className="w-24">
                <label className={label}>Starts</label>
                <input
                  type="time"
                  value={w.start}
                  onChange={(e) => setWindow(index, { start: e.target.value })}
                  className={`${input} px-2`}
                />
              </div>
              <div className="w-24">
                <label className={label}>Ends</label>
                <input
                  type="time"
                  value={w.end}
                  onChange={(e) => setWindow(index, { end: e.target.value })}
                  className={`${input} px-2`}
                />
              </div>
              <button
                type="button"
                aria-label={`Remove ${w.name || "session"}`}
                onClick={() =>
                  onChange({ half_day_windows: value.half_day_windows.filter((_, i) => i !== index) })
                }
                className="p-2 mb-1 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
              </button>
            </div>
          ))}
          {value.half_day_windows.length === 0 && (
            <p className="text-[11px] text-zinc-500 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg py-3 text-center">
              Add the session guests can book, e.g. Morning 08:00–14:00.
            </p>
          )}
        </div>
      )}

      {/* Same-day bookings */}
      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${value.allows_multiple_bookings_per_day ? "border-primary bg-primary/5" : "border-zinc-200 bg-zinc-50"}`}
        >
          <input
            type="checkbox"
            checked={value.allows_multiple_bookings_per_day}
            onChange={(e) => onChange({ allows_multiple_bookings_per_day: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
          />
          <span className="flex-1">
            <span className="text-xs font-bold text-zinc-900 block">
              This hall can be booked more than once a day
            </span>
            <span className="text-[11px] text-zinc-500 block leading-snug">
              For example a morning event and an evening event, as long as their
              times don&apos;t overlap. Untick it if any booking takes the hall for
              the whole day.
            </span>
          </span>
        </label>
        {value.allows_multiple_bookings_per_day && (
          <div className="w-48">
            <label className={label}>Gap between events (minutes)</label>
            <input
              type="number"
              min={0}
              max={MAX_BUFFER_MINUTES}
              step={15}
              value={value.event_buffer_minutes}
              onChange={(e) =>
                onChange({
                  event_buffer_minutes: Math.min(
                    MAX_BUFFER_MINUTES,
                    Math.max(0, parseInt(e.target.value, 10) || 0),
                  ),
                })
              }
              className={input}
            />
            <p className="text-[11px] text-zinc-500 mt-1 ml-1">
              Time to clean and set up after each event.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
          <Icon icon="mdi:alert-circle-outline" className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
