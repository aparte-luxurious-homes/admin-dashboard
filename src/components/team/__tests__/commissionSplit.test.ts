import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    CommissionSplitData,
    commissionSplitState,
    isOfflineSplit,
    OFFLINE_SPLIT_TITLE,
    positionWasPaid,
} from "../commissionSplit";

describe("commission split card states (AN-COMM)", () => {
    const lockedOnline: CommissionSplitData = {
        locked: true,
        splitting_base: 100000,
        positions: [{ pool: "LISTING", level: 0, percentage: 5, amount: 5000, status: "EARNS" }],
    };

    it("reads an offline booking as paid offline even when its shares were locked", () => {
        const offline: CommissionSplitData = {
            ...lockedOnline,
            offline: true,
            positions: lockedOnline.positions!.map((p) => ({ ...p, paid: false })),
        };
        assert.equal(isOfflineSplit(offline), true);
        assert.equal(commissionSplitState(offline), "offline");
    });

    it("treats a payload without the offline flag as an ordinary online split", () => {
        assert.equal(isOfflineSplit(lockedOnline), false);
        assert.equal(commissionSplitState(lockedOnline), "split");
        assert.equal(commissionSplitState({ locked: false }), "unlocked");
    });

    it("lets offline win over the legacy unlocked state", () => {
        assert.equal(commissionSplitState({ locked: false, offline: true }), "offline");
    });

    it("accepts only an explicit true as offline", () => {
        assert.equal(isOfflineSplit({ offline: false }), false);
        assert.equal(isOfflineSplit(undefined), false);
        assert.equal(isOfflineSplit({ offline: "true" } as unknown as CommissionSplitData), false);
    });

    it("marks a position not paid only on an explicit false", () => {
        assert.equal(positionWasPaid({}), true);
        assert.equal(positionWasPaid({ paid: true }), true);
        assert.equal(positionWasPaid({ paid: false }), false);
    });

    it("says what the decision asked the admin to read", () => {
        assert.equal(OFFLINE_SPLIT_TITLE, "No commission — paid offline");
    });
});
