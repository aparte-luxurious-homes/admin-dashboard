/**
 * Regression tests for the report request handler.
 *
 * The dashboard has no test runner installed, so these run on Node's built-in
 * one: `node src/lib/request-handlers/__tests__/run-reportsMgt.mjs` compiles
 * this file and the handler with the repo's own tsc and executes them with
 * `node --test`, stubbing only the axios instance (`../api`). They are also
 * type-checked by `npx tsc --noEmit -p tsconfig.json` like any other source.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import axiosRequest from "../../api";
import {
    REPORT_PAYMENT_METHODS,
    reportErrorMessage,
    requestReport,
    requestReportEmail,
} from "../reportsMgt";

type Call = { url: string; config: any };

/** Make the stubbed axios instance answer the next GET with `response`. */
function answerWith(response: any): Call[] {
    const calls: Call[] = [];
    (axiosRequest as any).get = async (url: string, config: any) => {
        calls.push({ url, config });
        return response;
    };
    return calls;
}

function failWith(error: any) {
    (axiosRequest as any).get = async () => {
        throw error;
    };
}

/** What a FastAPI HTTPException looks like once axios has rejected it. */
function httpError(status: number, detail: unknown) {
    return { message: `Request failed with status code ${status}`, response: { status, data: { detail } } };
}

test("payment-method filter values are the strings the API stores on bookings.payment_method", () => {
    // api-v1 services/bookings/schemas.py: "cash", "pos", "bank_transfer", "online".
    // PAYSTACK / TRANSFER / CASH / POS matched nothing and emptied the report.
    assert.deepEqual(
        REPORT_PAYMENT_METHODS.map((m) => m.value).sort(),
        ["bank_transfer", "cash", "online", "pos"],
    );
    for (const m of REPORT_PAYMENT_METHODS) {
        assert.equal(m.value, m.value.toLowerCase(), `${m.value} must be lowercase`);
        assert.ok(m.label.trim().length > 0, `${m.value} needs a label`);
    }
    assert.equal(
        REPORT_PAYMENT_METHODS.find((m) => m.value === "online")?.label,
        "Online (card/transfer via gateway)",
    );
    assert.equal(REPORT_PAYMENT_METHODS.find((m) => m.value === "bank_transfer")?.label, "Bank transfer");
});

test("a sent report resolves with the API's own message and the email delivery", async () => {
    const calls = answerWith({
        data: {
            message: "Your booking report has been sent to owner@example.com",
            data: { delivery: "email", sent_to: "owner@example.com", attached: true },
        },
    });

    const outcome = await requestReportEmail("/reports/bookings/export", "pdf");

    assert.deepEqual(outcome, {
        delivery: "email",
        message: "Your booking report has been sent to owner@example.com",
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].config.params.format, "pdf");
    // Generating + emailing outlasts the client's default 30s; the handler
    // must ask for more or it reports an error for a report that then arrives.
    assert.ok(calls[0].config.timeout > 30000);
});

test("a repeat within the API's window is reported as already sent, naming the address", async () => {
    answerWith({
        data: {
            message: "Your booking report has been sent to owner@example.com",
            data: { delivery: "already_sent", sent_to: "owner@example.com" },
        },
    });

    const outcome = await requestReportEmail("/reports/bookings/export", "csv");

    assert.equal(outcome.delivery, "already_sent");
    assert.equal(outcome.message, "This report was already sent to owner@example.com a moment ago");
});

test("already_sent is recognised at the top level of the body too", async () => {
    answerWith({ data: { delivery: "already_sent", message: "Already sent." } });

    const outcome = await requestReportEmail("/reports/bookings/export", "csv");

    assert.equal(outcome.delivery, "already_sent");
    // No address to name: fall back to the API's wording rather than inventing one.
    assert.equal(outcome.message, "Already sent.");
});

test("already_sent with neither address nor message still gets a sentence", async () => {
    answerWith({ data: { data: { delivery: "already_sent" } } });

    const outcome = await requestReportEmail("/reports/bookings/export", "xlsx");

    assert.equal(outcome.delivery, "already_sent");
    assert.equal(outcome.message, "This report was already sent to your email a moment ago");
});

test("owners and agents are emailed; the outcome carries the delivery for the toast", async () => {
    answerWith({ data: { data: { delivery: "email", sent_to: "agent@example.com" } } });

    const owner = await requestReport("/reports/bookings/export", "pdf", "OWNER");
    assert.equal(owner.delivery, "email");
    assert.equal(owner.message, "Your report has been sent to agent@example.com");

    const agent = await requestReport("/agents/bookings/export", "pdf", "AGENT");
    assert.equal(agent.delivery, "email");
});

test("a timeout is not reported as a failed email", async () => {
    failWith({ code: "ECONNABORTED", message: "timeout of 120000ms exceeded" });

    await assert.rejects(
        requestReportEmail("/reports/bookings/export", "pdf"),
        (err: any) => /will arrive in your email/.test(err.message),
    );
});

test("a 400 'too large' is rethrown untouched so the API's sentence reaches the toast verbatim", async () => {
    const detail = "This report is too large to email. Narrow the date range and try again.";
    const error = httpError(400, detail);
    failWith(error);

    await assert.rejects(requestReportEmail("/reports/bookings/export", "pdf"), (err) => err === error);
    assert.equal(reportErrorMessage(error, "Failed to export report"), detail);
});

test("reportErrorMessage prefers detail, then message, then the axios message, then the fallback", () => {
    assert.equal(
        reportErrorMessage({ response: { data: { message: "Add an email to receive reports" } } }, "fb"),
        "Add an email to receive reports",
    );
    assert.equal(reportErrorMessage({ message: "Network Error" }, "fb"), "Network Error");
    assert.equal(reportErrorMessage(undefined, "Failed to export report"), "Failed to export report");
    assert.equal(reportErrorMessage({ response: { data: { detail: "" } }, message: "" }, "fb"), "fb");
});

test("a 422's list of field errors is not shown as [object Object]", () => {
    const error = httpError(422, [{ loc: ["query", "start_date"], msg: "invalid date format", type: "value_error" }]);
    const shown = reportErrorMessage(error, "Failed to export report");
    assert.equal(typeof shown, "string");
    assert.doesNotMatch(shown, /object Object/);
    assert.equal(shown, "Request failed with status code 422");
});
