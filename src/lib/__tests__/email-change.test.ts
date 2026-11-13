import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    emailChangeError,
    EMAIL_TAKEN_MESSAGE,
    EXPIRED_CODE_MESSAGE,
    RATE_LIMITED_MESSAGE,
    sanitizeEmailCode,
    secondsUntil,
    wrongCodeMessage,
} from "../email-change";

const err = (status: number, detail?: unknown) => ({ response: { status, data: { detail } } });

describe("sanitizeEmailCode", () => {
    it("keeps the first six digits of whatever was pasted", () => {
        assert.equal(sanitizeEmailCode("123 456"), "123456");
        assert.equal(sanitizeEmailCode("Code: 987654."), "987654");
        assert.equal(sanitizeEmailCode("12345678"), "123456");
        assert.equal(sanitizeEmailCode(""), "");
    });
});

describe("wrongCodeMessage", () => {
    it("counts the tries left", () => {
        assert.equal(wrongCodeMessage(3), "That code isn't right. 3 tries left.");
        assert.equal(wrongCodeMessage(1), "That code isn't right. 1 try left.");
        assert.equal(wrongCodeMessage(null), "That code isn't right.");
    });

    it("says when that was the last try", () => {
        assert.match(wrongCodeMessage(0), /last try/);
    });
});

describe("emailChangeError", () => {
    it("names a taken address", () => {
        assert.deepEqual(emailChangeError(err(409, "Email in use"), "request"), {
            kind: "taken",
            message: EMAIL_TAKEN_MESSAGE,
            attemptsLeft: null,
        });
        assert.equal(emailChangeError(err(409), "confirm").message, EMAIL_TAKEN_MESSAGE);
    });

    it("asks for a minute on a 429", () => {
        assert.equal(emailChangeError(err(429), "request").message, RATE_LIMITED_MESSAGE);
    });

    it("reads tries left from a sentence", () => {
        const e = emailChangeError(err(400, "Incorrect code. 3 attempts left."), "confirm");
        assert.equal(e.kind, "wrong_code");
        assert.equal(e.attemptsLeft, 3);
        assert.equal(e.message, "That code isn't right. 3 tries left.");
    });

    it("reads tries left from a structured detail", () => {
        const e = emailChangeError(
            err(400, { code: "INVALID_CODE", message: "Wrong code", attempts_left: 2 }),
            "confirm"
        );
        assert.equal(e.kind, "wrong_code");
        assert.equal(e.message, "That code isn't right. 2 tries left.");
    });

    it("recognises an expired code either way", () => {
        assert.equal(emailChangeError(err(400, "This code has expired."), "confirm").message, EXPIRED_CODE_MESSAGE);
        assert.equal(emailChangeError(err(400, { code: "CODE_EXPIRED" }), "confirm").kind, "expired");
    });

    it("passes any other 400 through in the API's words", () => {
        assert.equal(
            emailChangeError(err(400, "That is already your email address."), "request").message,
            "That is already your email address."
        );
        assert.equal(
            emailChangeError(err(400, "There is no email change waiting to be confirmed."), "confirm").kind,
            "other"
        );
    });

    it("falls back to a plain sentence when there is no response", () => {
        assert.match(emailChangeError(new Error("offline"), "confirm").message, /Couldn't confirm/);
        assert.match(emailChangeError(new Error("offline"), "request").message, /Couldn't send/);
    });
});

describe("secondsUntil", () => {
    it("rounds up and never goes negative", () => {
        assert.equal(secondsUntil(10_500, 10_000), 1);
        assert.equal(secondsUntil(70_000, 10_000), 60);
        assert.equal(secondsUntil(5_000, 10_000), 0);
        assert.equal(secondsUntil(null, 10_000), 0);
    });
});
