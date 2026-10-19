/**
 * Calendar dates in West Africa Time.
 *
 * The network report counts bookings by the date they were made in WAT
 * (UTC+1, no daylight saving), so a default range built on any other clock
 * disagrees with the numbers under it. NetworkReportView used to build its
 * defaults from `new Date().toISOString()`, which is UTC: an admin opening the
 * page between midnight and 1am Lagos time got yesterday as "today", and on
 * the first of the month the whole default range belonged to the previous
 * month. Intl reads the browser's own tz database, so this needs no
 * dependency (date-fns-tz is not installed) and no hand-written offset.
 */

export const REPORT_TIME_ZONE = "Africa/Lagos";

/** How the range is labelled to the person reading it. */
export const REPORT_TIME_ZONE_LABEL = "WAT";

/** `YYYY-MM-DD` of `at` as read off the wall clock in `timeZone`. */
export function calendarDateIn(timeZone: string, at: Date = new Date()): string {
    // formatToParts rather than format(): the output must be the ISO shape
    // <input type="date"> and the API's start_date/end_date expect, and no
    // locale's separator should be trusted to produce it.
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(at);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
    return `${part("year")}-${part("month")}-${part("day")}`;
}

export const lagosToday = (at: Date = new Date()): string => calendarDateIn(REPORT_TIME_ZONE, at);

/** First day of the WAT month `at` falls in. */
export const lagosMonthStart = (at: Date = new Date()): string => `${lagosToday(at).slice(0, 8)}01`;

/** The network report's default range: month to date, in WAT. */
export function defaultReportRange(at: Date = new Date()): { start_date: string; end_date: string } {
    return { start_date: lagosMonthStart(at), end_date: lagosToday(at) };
}
