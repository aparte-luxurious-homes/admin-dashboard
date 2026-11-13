import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    balanceDeadline,
    canRefund,
    canTransitionPayment,
    csvCell,
    equalShares,
    hoursUntil,
    isInstalmentEligible,
    isOpenPayment,
    koboToNaira,
    nairaToKobo,
    plansToCsv,
    splitInstalment,
    summariseContributors,
    validateCustomShares,
    validateInstalmentConfig,
    validateInviteFriendsConfig,
} from "../flexPayments";
import { FlexPaymentKind, FlexPaymentStatus as S } from "../types/flexPayments";

describe("kobo conversion", () => {
    it("converts naira numbers and strings, including thousands separators", () => {
        assert.equal(nairaToKobo(200000), 20_000_000);
        assert.equal(nairaToKobo("200000.00"), 20_000_000);
        assert.equal(nairaToKobo("1,530,000.50"), 153_000_050);
    });
    it("survives float noise", () => {
        assert.equal(nairaToKobo(0.1 + 0.2), 30);
        assert.equal(nairaToKobo(19.99), 1999);
    });
    it("returns 0 for junk", () => {
        assert.equal(nairaToKobo("abc"), 0);
        assert.equal(nairaToKobo(NaN), 0);
    });
    it("round-trips", () => {
        assert.equal(koboToNaira(nairaToKobo(1234.56)), 1234.56);
    });
});

describe("splitInstalment", () => {
    it("matches the PRD example: 60% of ₦200,000", () => {
        assert.deepEqual(splitInstalment(20_000_000, 60), { initialKobo: 12_000_000, balanceKobo: 8_000_000 });
    });
    it("always sums exactly to the total, even for awkward amounts", () => {
        for (const total of [1, 99, 100_001, 33_333_333, 20_000_001]) {
            for (const pct of [10, 33, 50, 60, 70, 90]) {
                const { initialKobo, balanceKobo } = splitInstalment(total, pct);
                assert.equal(initialKobo + balanceKobo, total, `${total} @ ${pct}%`);
                assert.ok(Number.isInteger(initialKobo) && Number.isInteger(balanceKobo));
            }
        }
    });
});

describe("balance deadline and eligibility", () => {
    it("is N days before check-in, and 0 means at check-in", () => {
        assert.equal(balanceDeadline("2026-12-10T12:00:00Z", 3).toISOString(), "2026-12-07T12:00:00.000Z");
        assert.equal(balanceDeadline("2026-12-10T12:00:00Z", 0).toISOString(), "2026-12-10T12:00:00.000Z");
    });
    it("is eligible only while the deadline is still ahead", () => {
        const now = new Date("2026-12-01T00:00:00Z");
        assert.equal(isInstalmentEligible("2026-12-10T00:00:00Z", 3, now), true);
        assert.equal(isInstalmentEligible("2026-12-03T00:00:00Z", 3, now), false); // deadline is today
        assert.equal(isInstalmentEligible("2026-12-02T00:00:00Z", 3, now), false); // deadline already passed
    });
});

describe("validateInstalmentConfig", () => {
    const ok = { enabled: true, initial_percentage: 60, balance_deadline_days_before_checkin: 3 };
    it("accepts a sensible config and the 0-day (at check-in) deadline", () => {
        assert.deepEqual(validateInstalmentConfig(ok), {});
        assert.deepEqual(validateInstalmentConfig({ ...ok, balance_deadline_days_before_checkin: 0 }), {});
    });
    it("rejects out-of-range, fractional and NaN percentages", () => {
        for (const bad of [0, 9, 91, 100, 55.5, NaN]) {
            assert.ok(validateInstalmentConfig({ ...ok, initial_percentage: bad }).initial_percentage, String(bad));
        }
    });
    it("rejects negative, fractional and too-long deadlines", () => {
        for (const bad of [-1, 2.5, 31, NaN]) {
            assert.ok(
                validateInstalmentConfig({ ...ok, balance_deadline_days_before_checkin: bad })
                    .balance_deadline_days_before_checkin,
                String(bad),
            );
        }
    });
});

describe("equalShares", () => {
    it("splits evenly when it divides", () => {
        assert.deepEqual(equalShares(30_000_000, 3), [10_000_000, 10_000_000, 10_000_000]);
    });
    it("hands leftover kobo to the first shares so the sum is exact", () => {
        assert.deepEqual(equalShares(100, 3), [34, 33, 33]);
        for (const [total, n] of [[1, 2], [100_001, 7], [33_333_333, 10]] as const) {
            const shares = equalShares(total, n);
            assert.equal(shares.length, n);
            assert.equal(shares.reduce((a, b) => a + b, 0), total);
            assert.ok(Math.max(...shares) - Math.min(...shares) <= 1);
        }
    });
    it("refuses a nonsensical count", () => {
        assert.deepEqual(equalShares(100, 0), []);
        assert.deepEqual(equalShares(100, 1.5), []);
    });
});

describe("validateCustomShares", () => {
    it("accepts shares that sum exactly", () => {
        assert.equal(validateCustomShares(30_000_000, [10_000_000, 15_000_000, 5_000_000]), null);
    });
    it("reports short and over totals", () => {
        assert.match(validateCustomShares(1000, [400, 500]) ?? "", /short/);
        assert.match(validateCustomShares(1000, [600, 500]) ?? "", /over/);
    });
    it("rejects empty, zero, negative and fractional shares", () => {
        assert.ok(validateCustomShares(1000, []));
        assert.ok(validateCustomShares(1000, [1000, 0]));
        assert.ok(validateCustomShares(1000, [1500, -500]));
        assert.ok(validateCustomShares(1000, [500.5, 499.5]));
    });
});

describe("validateInviteFriendsConfig", () => {
    const ok = { enabled: true, min_contributors: 2, max_contributors: 10, allow_equal_split: true, allow_custom_split: true };
    it("accepts the PRD defaults", () => {
        assert.deepEqual(validateInviteFriendsConfig(ok), {});
    });
    it("enforces 2..10 and max >= min", () => {
        assert.ok(validateInviteFriendsConfig({ ...ok, min_contributors: 1 }).min_contributors);
        assert.ok(validateInviteFriendsConfig({ ...ok, max_contributors: 11 }).max_contributors);
        assert.ok(validateInviteFriendsConfig({ ...ok, min_contributors: 5, max_contributors: 3 }).max_contributors);
        assert.deepEqual(validateInviteFriendsConfig({ ...ok, min_contributors: 4, max_contributors: 4 }), {});
    });
    it("needs at least one split mode", () => {
        assert.ok(validateInviteFriendsConfig({ ...ok, allow_equal_split: false, allow_custom_split: false }).split);
        assert.deepEqual(validateInviteFriendsConfig({ ...ok, allow_equal_split: false }), {});
    });
});

describe("summariseContributors", () => {
    it("counts only verified (PAID) shares — the PRD's ₦300,000 example", () => {
        const s = summariseContributors(
            [
                { shareKobo: 10_000_000, status: "PAID" },
                { shareKobo: 10_000_000, status: "PAID" },
                { shareKobo: 10_000_000, status: "PENDING" },
            ],
            30_000_000,
        );
        assert.deepEqual(s, { paidKobo: 20_000_000, outstandingKobo: 10_000_000, paidCount: 2, percentPaid: 66 });
    });
    it("does not count processing, failed or refunded shares as received", () => {
        const s = summariseContributors(
            [
                { shareKobo: 500, status: "PROCESSING" },
                { shareKobo: 500, status: "FAILED" },
                { shareKobo: 500, status: "REFUNDED" },
            ],
            1500,
        );
        assert.equal(s.paidKobo, 0);
        assert.equal(s.percentPaid, 0);
    });
    it("copes with a zero total", () => {
        assert.equal(summariseContributors([], 0).percentPaid, 0);
    });
});

describe("payment status transitions (PRD 6.2)", () => {
    it("allows the documented moves", () => {
        assert.ok(canTransitionPayment(S.PENDING, S.PROCESSING));
        assert.ok(canTransitionPayment(S.PROCESSING, S.PARTIALLY_PAID));
        assert.ok(canTransitionPayment(S.PROCESSING, S.FULLY_PAID));
        assert.ok(canTransitionPayment(S.PARTIALLY_PAID, S.FULLY_PAID));
        assert.ok(canTransitionPayment(S.PROCESSING, S.FAILED));
        assert.ok(canTransitionPayment(S.FAILED, S.PROCESSING));
        assert.ok(canTransitionPayment(S.PENDING, S.EXPIRED));
        assert.ok(canTransitionPayment(S.PARTIALLY_PAID, S.EXPIRED));
        for (const from of [S.PARTIALLY_PAID, S.FULLY_PAID, S.EXPIRED]) {
            assert.ok(canTransitionPayment(from, S.REFUNDED), from);
        }
    });
    it("refuses the rest", () => {
        assert.equal(canTransitionPayment(S.PENDING, S.FULLY_PAID), false); // must pass through PROCESSING
        assert.equal(canTransitionPayment(S.FULLY_PAID, S.PENDING), false);
        assert.equal(canTransitionPayment(S.FULLY_PAID, S.EXPIRED), false);
        assert.equal(canTransitionPayment(S.PENDING, S.REFUNDED), false); // nothing was paid
        for (const to of Object.values(S)) {
            assert.equal(canTransitionPayment(S.REFUNDED, to), false, `REFUNDED -> ${to}`);
        }
    });
    it("derives open and refundable from the table", () => {
        assert.equal(isOpenPayment(S.PARTIALLY_PAID), true);
        assert.equal(isOpenPayment(S.FULLY_PAID), false);
        assert.equal(isOpenPayment(S.REFUNDED), false);
        assert.equal(canRefund(S.FULLY_PAID), true);
        assert.equal(canRefund(S.PENDING), false);
        assert.equal(canRefund(S.REFUNDED), false);
    });
});

describe("hoursUntil", () => {
    const now = new Date("2026-12-01T00:00:00Z");
    it("is positive before, negative after, null with no usable deadline", () => {
        assert.equal(hoursUntil("2026-12-01T12:00:00Z", now), 12);
        assert.equal(hoursUntil("2026-11-30T12:00:00Z", now), -12);
        assert.equal(hoursUntil(null, now), null);
        assert.equal(hoursUntil("nope", now), null);
    });
});

describe("CSV export", () => {
    it("quotes cells and doubles embedded quotes", () => {
        assert.equal(csvCell('He said "hi", ok'), '"He said ""hi"", ok"');
    });
    it("defuses spreadsheet formulas in user-supplied text", () => {
        for (const evil of ["=HYPERLINK(\"x\")", "+1+1", "-2", "@SUM(A1)"]) {
            assert.ok(csvCell(evil).startsWith(`"'`), evil);
        }
        assert.equal(csvCell("Ada Obi"), '"Ada Obi"');
    });
    it("writes naira with two decimals and the outstanding balance", () => {
        const csv = plansToCsv([
            {
                bookingRef: "BK-1",
                kind: FlexPaymentKind.INSTALMENT,
                status: S.PARTIALLY_PAID,
                guestName: "=Ada",
                propertyName: "Palm Court",
                totalKobo: 20_000_000,
                paidKobo: 12_000_000,
                dueAt: null,
            },
        ]).split("\r\n");
        assert.equal(csv.length, 2);
        assert.match(csv[0], /^"Booking","Type"/);
        assert.equal(
            csv[1],
            `"BK-1","Instalment","Partially paid","'=Ada","Palm Court","200000.00","120000.00","80000.00",""`,
        );
    });
});
