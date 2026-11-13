"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";

import { useAuth } from "@/src/hooks/useAuth";
import { trackEvent } from "@/src/lib/analytics";
import {
    GetOwnerActions,
    GetOwnerAgents,
    GetOwnerCalendar,
    GetOwnerSummary,
} from "@/src/lib/request-handlers/ownerHomeMgt";

import AgentsPanel from "./AgentsPanel";
import BookingsCard from "./BookingsCard";
import MoneyCard from "./MoneyCard";
import NextActions from "./NextActions";
import NightSheet from "./NightSheet";
import OwnerCalendar, { type CalendarSelection } from "./OwnerCalendar";
import SharePill, { type SharePillHandle } from "./SharePill";
import UrgentBar from "./UrgentBar";

const ISO = "yyyy-MM-dd";

/**
 * The owner's home: when am I getting paid, what is happening in my places,
 * is anything waiting on me. Nothing else goes on this page.
 *
 * Three calls on load (summary, this month's calendar, actions). Agents and
 * any further month load after first paint, and each month is cached under its
 * own query key, so paging back costs no request.
 */
export default function OwnerHome() {
    const { user } = useAuth();
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [activeUnitId, setActiveUnitId] = useState("all");
    const [selection, setSelection] = useState<CalendarSelection | null>(null);
    const [wantAgents, setWantAgents] = useState(false);
    const shareRef = useRef<SharePillHandle>(null);

    const from = format(startOfMonth(month), ISO);
    const to = format(endOfMonth(month), ISO);

    const {
        summary,
        isLoading: summaryLoading,
        isError: summaryFailed,
        refetch: refetchSummary,
    } = GetOwnerSummary();
    const {
        calendar,
        isLoading: calendarLoading,
        isError: calendarFailed,
        refetch: refetchCalendar,
    } = GetOwnerCalendar(from, to);
    const { actions } = GetOwnerActions();
    const { agents } = GetOwnerAgents(90, wantAgents);

    // After first paint, so the three calls above are not competing with it.
    useEffect(() => {
        const id = window.setTimeout(() => setWantAgents(true), 0);
        return () => window.clearTimeout(id);
    }, []);

    // Once per load, and only once BOTH answers are in: keying this on the
    // summary alone shipped has_urgent=false whenever the actions call came
    // back second, which is the property section 11 actually reads.
    const viewSent = useRef(false);
    useEffect(() => {
        if (viewSent.current || !summary || !actions) return;
        viewSent.current = true;
        trackEvent("owner_home_viewed", {
            listing_count: summary.bookings.units,
            has_urgent: actions.urgent_count > 0,
        });
    }, [summary, actions]);

    // One listing needs no tabs, so it is the active one from the start.
    useEffect(() => {
        const units = calendar?.units ?? [];
        if (units.length === 1 && activeUnitId !== units[0].unit_id) {
            setActiveUnitId(units[0].unit_id);
        }
    }, [calendar?.units, activeUnitId]);

    const greeting = useMemo(
        () => format(new Date(), "EEEE, d MMMM"),
        []
    );

    // Full width on desktop, with Next and the agents in a right rail so the
    // calendar keeps the room it wants. On a phone the rail's contents follow
    // the calendar in the flow, in the order they always did. (Spec D3 said
    // no rail; the spec owner asked for this one.)
    return (
        <div className="w-full space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Welcome back
                        {user?.profile?.firstName ? `, ${user.profile.firstName}` : ""}
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500">{greeting}</p>
                </div>
                <SharePill ref={shareRef} className="ml-auto max-[660px]:ml-0 max-[660px]:w-full" />
            </div>

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-4">
            <div className="min-w-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {summaryFailed || (!summaryLoading && !summary) ? (
                    // Never leave the skeletons up on a failure: they read as
                    // "still loading" for ever.
                    <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-sm text-gray-700">
                            Your money and bookings could not be loaded just now.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetchSummary()}
                            className="mt-3 rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                        >
                            Try again
                        </button>
                    </div>
                ) : summaryLoading || !summary ? (
                    <>
                        <div className="h-[168px] animate-pulse rounded-xl bg-gray-100" />
                        <div className="h-[168px] animate-pulse rounded-xl bg-gray-100" />
                    </>
                ) : (
                    <>
                        <MoneyCard money={summary.money} />
                        <BookingsCard
                            bookings={summary.bookings}
                            onShare={() => shareRef.current?.copy("bookings_card")}
                        />
                    </>
                )}
            </div>

            <UrgentBar items={actions?.items ?? []} />

            <OwnerCalendar
                data={calendar}
                isLoading={calendarLoading}
                hasFailed={calendarFailed}
                onRetry={() => refetchCalendar()}
                month={month}
                onMonthChange={setMonth}
                activeUnitId={activeUnitId}
                onUnitChange={setActiveUnitId}
                onSelect={setSelection}
                onShare={() => shareRef.current?.copy("calendar_prompt")}
            />
            </div>

            <aside className="mt-4 space-y-4 lg:mt-0">
                <NextActions items={actions?.items ?? []} />
                {agents && <AgentsPanel agents={agents.agents} />}
            </aside>
            </div>

            <NightSheet selection={selection} onClose={() => setSelection(null)} />
        </div>
    );
}
