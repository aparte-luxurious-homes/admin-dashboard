import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canFixEmail, canFixEmailFor, fixEmailErrorMessage } from "../email-access";

const STAFF = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN", "ANALYST"];
const NON_STAFF = ["GUEST", "OWNER", "AGENT"];

describe("canFixEmail", () => {
    it("is held by super admins, admins and operations admins only", () => {
        assert.equal(canFixEmail("SUPER_ADMIN"), true);
        assert.equal(canFixEmail("ADMIN"), true);
        assert.equal(canFixEmail("OPERATIONS_ADMIN"), true);
        assert.equal(canFixEmail("SUPPORT_ADMIN"), false);
        assert.equal(canFixEmail("ANALYST"), false);
        assert.equal(canFixEmail("AGENT"), false);
        assert.equal(canFixEmail(undefined), false);
    });
});

describe("canFixEmailFor", () => {
    it("lets a super admin fix anyone, staff included", () => {
        for (const target of [...STAFF, ...NON_STAFF]) {
            assert.equal(canFixEmailFor("SUPER_ADMIN", target), true, target);
        }
    });

    it("lets admins and operations admins fix guests, owners and agents only", () => {
        for (const viewer of ["ADMIN", "OPERATIONS_ADMIN"]) {
            for (const target of NON_STAFF) {
                assert.equal(canFixEmailFor(viewer, target), true, `${viewer} -> ${target}`);
            }
            for (const target of STAFF) {
                assert.equal(canFixEmailFor(viewer, target), false, `${viewer} -> ${target}`);
            }
        }
    });

    it("refuses an unknown target role rather than guessing", () => {
        assert.equal(canFixEmailFor("ADMIN", ""), false);
        assert.equal(canFixEmailFor("ADMIN", "MANAGER"), false);
        assert.equal(canFixEmailFor("ADMIN", undefined), false);
    });

    it("never lets support admins fix anyone", () => {
        for (const target of [...STAFF, ...NON_STAFF]) {
            assert.equal(canFixEmailFor("SUPPORT_ADMIN", target), false, target);
        }
    });
});

describe("fixEmailErrorMessage", () => {
    const err = (status: number, detail?: unknown) => ({ response: { status, data: { detail } } });

    it("shows the API's own reason for a 403", () => {
        assert.equal(
            fixEmailErrorMessage(err(403, "Only a super admin can change a staff account's email. Ask a super admin.")),
            "Only a super admin can change a staff account's email. Ask a super admin."
        );
    });

    it("falls back to a plain sentence when a 403 carries no reason", () => {
        assert.match(fixEmailErrorMessage(err(403)) ?? "", /can't change email addresses/);
    });

    it("names the conflict", () => {
        assert.equal(fixEmailErrorMessage(err(409, "taken")), "Another account already uses that email address.");
    });

    it("has no opinion on other failures", () => {
        assert.equal(fixEmailErrorMessage(err(500)), null);
        assert.equal(fixEmailErrorMessage(new Error("offline")), null);
    });
});
