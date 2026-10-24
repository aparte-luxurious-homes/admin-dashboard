import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { editDistance, isLikelyEmail, suggestEmail } from "../email-check";

describe("editDistance", () => {
    it("counts an adjacent swap as one edit", () => {
        assert.equal(editDistance("gmial", "gmail"), 1);
        assert.equal(editDistance("hotmial", "hotmail"), 1);
    });

    it("counts inserts, deletes and substitutions", () => {
        assert.equal(editDistance("gnail.com", "gmail.com"), 1);
        assert.equal(editDistance("yahooo.com", "yahoo.com"), 1);
        assert.equal(editDistance("gmai.com", "gmail.com"), 1);
        assert.equal(editDistance("", "abc"), 3);
    });
});

describe("suggestEmail", () => {
    const cases: Array<[string, string]> = [
        ["ezekiel@gnail.com", "ezekiel@gmail.com"],
        ["ezekiel@gmial.com", "ezekiel@gmail.com"],
        ["ezekiel@gmai.com", "ezekiel@gmail.com"],
        ["ezekiel@gamil.com", "ezekiel@gmail.com"],
        ["ezekiel@gmail.con", "ezekiel@gmail.com"],
        ["ezekiel@gmail.co", "ezekiel@gmail.com"],
        ["ezekiel@gmial.con", "ezekiel@gmail.com"],
        ["ezekiel@gmailcom", "ezekiel@gmail.com"],
        ["ezekiel@gmail,com", "ezekiel@gmail.com"],
        ["ezekiel@gmail.com.com", "ezekiel@gmail.com"],
        ["ezekiel@mail.gmial.com", "ezekiel@gmail.com"],
        ["ezekiel@yahooo.com", "ezekiel@yahoo.com"],
        ["ezekiel@yaho.com", "ezekiel@yahoo.com"],
        ["ezekiel@hotmial.com", "ezekiel@hotmail.com"],
        ["ezekiel@outlok.com", "ezekiel@outlook.com"],
        ["ezekiel@icloud.co", "ezekiel@icloud.com"],
        ["ezekiel@aol.co", "ezekiel@aol.com"],
        ["ezekiel@ymail.co", "ezekiel@ymail.com"],
        ["ezekiel@acme.con", "ezekiel@acme.com"],
        ["ezekiel@acme.ogr", "ezekiel@acme.org"],
    ];
    for (const [typed, expected] of cases) {
        it(`suggests ${expected} for ${typed}`, () => {
            assert.equal(suggestEmail(typed), expected);
        });
    }

    it("keeps the local part exactly as typed", () => {
        assert.equal(suggestEmail("Ezekiel.Obi+stay@GNAIL.COM"), "Ezekiel.Obi+stay@gmail.com");
    });

    const clean = [
        "ezekiel@gmail.com",
        "ezekiel@yahoo.co.uk",
        "ezekiel@ymail.com",
        "ezekiel@mail.com",
        "ezekiel@mac.com",
        "ezekiel@msn.com",
        "ezekiel@aon.com",
        "ezekiel@bol.com",
        "ezekiel@hotmail.ca",
        "ezekiel@yahoo.co.in",
        "ezekiel@acme.co",
        "ezekiel@aparte.ng",
        "ezekiel@company.com.ng",
        "ezekiel@yahoo.com.ng",
    ];
    for (const email of clean) {
        it(`leaves ${email} alone`, () => {
            assert.equal(suggestEmail(email), null);
        });
    }

    it("does not guess at malformed input", () => {
        for (const raw of ["", "ezekiel", "@gmail.com", "ezekiel@", "a b@gnail.com"]) {
            assert.equal(suggestEmail(raw), null, raw);
        }
    });
});

describe("isLikelyEmail", () => {
    it("accepts a plain address and rejects obvious non-addresses", () => {
        assert.equal(isLikelyEmail("ezekiel@gmail.com"), true);
        assert.equal(isLikelyEmail(" ezekiel@gmail.com "), true);
        assert.equal(isLikelyEmail("ezekiel@gmail"), false);
        assert.equal(isLikelyEmail("ezekiel gmail.com"), false);
    });
});
