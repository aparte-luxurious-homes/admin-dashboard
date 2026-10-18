import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calendarDateIn, defaultReportRange, lagosMonthStart, lagosToday, REPORT_TIME_ZONE, REPORT_TIME_ZONE_LABEL } from "../dates";

describe("network report default dates in WAT (AN-L7b)", () => {
    // 23:30 UTC on 31 March is 00:30 WAT on 1 April. The old defaults came from
    // toISOString(), i.e. the UTC date, so for this hour they named yesterday
    // — and on the first of the month, last month's range.
    const lateMarchUtc = new Date("2026-03-31T23:30:00Z");

    it("rolls to the next calendar day at midnight Lagos time, an hour before UTC does", () => {
        assert.equal(lateMarchUtc.toISOString().slice(0, 10), "2026-03-31");
        assert.equal(lagosToday(lateMarchUtc), "2026-04-01");
    });

    it("defaults to month-to-date in WAT, so the first of the month is not last month's range", () => {
        assert.deepEqual(defaultReportRange(lateMarchUtc), { start_date: "2026-04-01", end_date: "2026-04-01" });
        assert.equal(lagosMonthStart(lateMarchUtc), "2026-04-01");
    });

    it("agrees with UTC for the other 23 hours of the day", () => {
        const midday = new Date("2026-06-15T12:00:00Z");
        assert.equal(lagosToday(midday), midday.toISOString().slice(0, 10));
        assert.deepEqual(defaultReportRange(midday), { start_date: "2026-06-01", end_date: "2026-06-15" });
    });

    it("produces zero-padded YYYY-MM-DD, the shape <input type=date> and the API expect", () => {
        assert.equal(calendarDateIn(REPORT_TIME_ZONE, new Date("2026-01-05T10:00:00Z")), "2026-01-05");
        assert.match(lagosToday(), /^\d{4}-\d{2}-\d{2}$/);
    });

    it("is pinned to Africa/Lagos and labelled WAT", () => {
        assert.equal(REPORT_TIME_ZONE, "Africa/Lagos");
        assert.equal(REPORT_TIME_ZONE_LABEL, "WAT");
        // Same instant read in another zone must differ, or the zone is being ignored.
        assert.equal(calendarDateIn("UTC", lateMarchUtc), "2026-03-31");
    });
});
