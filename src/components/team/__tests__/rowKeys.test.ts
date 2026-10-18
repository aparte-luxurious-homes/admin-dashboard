import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { peerRowKey } from "../rowKeys";

describe("peers table row keys (AN-L7c)", () => {
    // What /network/peers actually returns: names and counts, no ids.
    const twins = [
        { name: "Tunde Bello", listed_bookings: 0, referral_bookings: 0 },
        { name: "Tunde Bello", listed_bookings: 0, referral_bookings: 0 },
        { name: "Ada Eze", listed_bookings: 2, referral_bookings: 1 },
    ];

    it("gives two agents with the same name and counts distinct keys", () => {
        // The key this replaces, kept here so the collision it caused stays on record.
        const legacy = twins.map((r) => `${r.name}-${r.listed_bookings}-${r.referral_bookings}`);
        assert.equal(new Set(legacy).size, 2, "the old key merged the two Tunde Bellos");

        const keys = twins.map(peerRowKey);
        assert.equal(new Set(keys).size, twins.length);
    });

    it("prefers the row's id when the API sends one", () => {
        assert.equal(peerRowKey({ id: "7c1e" }, 4), "peer-7c1e");
        assert.equal(peerRowKey({ agent_id: "a9f0" }, 4), "peer-a9f0");
        assert.equal(peerRowKey({ agent_id: "a9f0", id: "7c1e" }, 4), "peer-a9f0");
    });

    it("falls back to the position in the list when there is no usable id", () => {
        assert.equal(peerRowKey({}, 0), "peer-0");
        assert.equal(peerRowKey({ id: null }, 3), "peer-3");
        assert.equal(peerRowKey({ id: "" }, 5), "peer-5");
    });
});
