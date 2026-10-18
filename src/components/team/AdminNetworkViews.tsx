'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Loader from "@/src/components/loader";
import axiosRequest from "@/src/lib/api";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
    AssignMentor,
    DecideTeamRequest,
    downloadNetworkReport,
    GetAdminTeamRequest,
    GetAdminTeamRequests,
    GetCommissionSplit,
    GetMyTeam,
    GetNetworkReport,
    GetPeers,
    GetTopTeams,
    GetUnassignedAgents,
    ReassignMentor,
    ReportParams,
} from "@/src/lib/request-handlers/teamMgt";
import { Badge, DataTable, Pager, Panel, SearchBox, Stat, Tabs, ngn, shortDate } from "./ui";
import { describeRequest, displayValue, fieldLabel } from "./requestText";
import { defaultReportRange, REPORT_TIME_ZONE_LABEL } from "./dates";
import { peerRowKey } from "./rowKeys";
import {
    CommissionSplitData,
    CommissionSplitPosition,
    commissionSplitState,
    OFFLINE_SPLIT_BODY,
    OFFLINE_SPLIT_TITLE,
    positionWasPaid,
} from "./commissionSplit";

const SIZE = 20;

// ---------------------------------------------------------------------------
// team requests: queue and review
// ---------------------------------------------------------------------------

// APPLYING: an admin has approved and the change is being applied (API status machine PENDING -> APPLYING -> APPROVED | FAILED).
type ReqStatus = "" | "PENDING" | "APPLYING" | "APPROVED" | "REJECTED" | "FAILED" | "CANCELLED";

export function TeamRequestsQueue() {
    const router = useRouter();
    const [status, setStatus] = useState<ReqStatus>("PENDING");
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [status]);
    const { data, isLoading, isFetching } = GetAdminTeamRequests({ status: status || undefined, page, size: SIZE });
    return (
        <Panel title="Team requests" subtitle="Edits and booking actions team leads asked for. Nothing changes until you approve.">
            <Tabs<ReqStatus>
                value={status}
                onChange={setStatus}
                options={[
                    { value: "PENDING", label: "Pending" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "APPLYING", label: "Applying" },
                    { value: "FAILED", label: "Could not apply" },
                    { value: "", label: "All" },
                ]}
            />
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                onRowClick={(r: any) => router.push(PAGE_ROUTES.dashboard.propertyManagement.teamRequests.details(r.id))}
                empty={{ title: "No requests" }}
                columns={[
                    { header: "Filed", render: (r: any) => shortDate(r.created_at) },
                    { header: "Team lead", render: (r: any) => r.requester?.name ?? "—" },
                    { header: "Request", render: (r: any) => describeRequest(r) },
                    { header: "Status", render: (r: any) => <Badge value={r.status} /> },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

export function TeamRequestReview({ id }: { id: string }) {
    const { data, isLoading, error } = GetAdminTeamRequest(id);
    const decide = DecideTeamRequest();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");

    if (isLoading) return <div className="flex items-center justify-center py-24"><Loader /></div>;
    if (error || !data) return <Panel title="Team request"><p className="text-sm text-gray-500">{getApiErrorMessage(error, "Request not found")}</p></Panel>;
    const r = data;
    const changed: string[] = r.changed_since_request ?? [];
    const isBooking = r.target_type === "BOOKING_ACTION";
    const keys = isBooking ? Object.keys(r.payload ?? {}) : r.target_type === "AVAILABILITY" ? [] : Object.keys(r.payload ?? {});

    const run = (decision: "approve" | "reject") =>
        decide.mutate({ id: r.id, decision, reason: reason.trim() || undefined }, {
            onSuccess: (resp: any) => {
                const status = resp?.data?.data?.status;
                if (status === "FAILED") toast.error("Approved, but the change could not be applied. See the reason on the request.");
                else toast.success(decision === "approve" ? "Approved and applied" : "Rejected");
                setRejecting(false);
            },
            onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't record this decision")),
        });

    return (
        <Panel
            title={describeRequest(r)}
            subtitle={`Filed by ${r.requester?.name ?? "a team lead"} on ${shortDate(r.created_at)}`}
            actions={r.status === "PENDING" ? (
                <>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50" disabled={decide.isPending} onClick={() => run("approve")}>Approve and apply</button>
                    <button className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium disabled:opacity-50" disabled={decide.isPending} onClick={() => setRejecting(true)}>Reject</button>
                </>
            ) : <Badge value={r.status} />}
        >
            {changed.length > 0 && r.status === "PENDING" && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Changed by someone else since this request was filed: {changed.map(fieldLabel).join(", ")}. Check the current values before approving.
                </div>
            )}
            {r.note && <p className="mb-4 text-sm text-gray-700"><span className="font-medium">Team lead&apos;s note:</span> {r.note}</p>}
            {r.decision_reason && <p className="mb-4 text-sm text-gray-700"><span className="font-medium">Rejection reason:</span> {r.decision_reason}</p>}
            {r.apply_error && <p className="mb-4 text-sm text-red-600"><span className="font-medium">Could not apply:</span> {r.apply_error}</p>}

            {keys.length > 0 && (
                <DataTable
                    rows={keys}
                    rowKey={(k) => k}
                    empty={{ title: "" }}
                    columns={[
                        { header: "Field", render: (k) => fieldLabel(k) },
                        { header: "When filed", render: (k) => displayValue(r.baseline?.[k]) },
                        { header: "Now", render: (k) => <span className={changed.includes(k) ? "text-amber-700 font-medium" : ""}>{displayValue(r.current?.[k])}</span> },
                        { header: "Requested", render: (k) => <span className="font-medium text-gray-900">{displayValue(r.payload?.[k])}</span> },
                    ]}
                />
            )}
            {r.target_type === "AVAILABILITY" && (
                <DataTable
                    rows={r.payload?.dates ?? []}
                    rowKey={(d: any) => d.date}
                    empty={{ title: "" }}
                    columns={[
                        { header: "Date", render: (d: any) => d.date },
                        { header: "Now", render: (d: any) => displayValue(r.current?.dates?.[d.date]) },
                        { header: "Requested", render: (d: any) => `${d.is_blackout ? "Closed" : "Open"}${d.pricing ? ` · ${ngn(d.pricing)}` : ""}` },
                    ]}
                />
            )}
            {r.target_type === "MEDIA_ADD" && r.payload?.media_url && (
                r.payload.media_type === "VIDEO"
                    ? <video src={r.payload.media_url} controls className="max-h-80 rounded-lg border" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={r.payload.media_url} alt="Requested upload" className="max-h-80 rounded-lg border" />
            )}
            {r.target_type === "MEDIA_DELETE" && r.baseline?.media_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.baseline.media_url} alt="To be removed" className="max-h-60 rounded-lg border" />
            )}
            {isBooking && <p className="text-sm text-gray-700">Booking status when filed: <Badge value={r.baseline?.status} /> · now: <Badge value={r.current?.status} /></p>}

            {rejecting && (
                <div className="mt-5 rounded-lg border p-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reason (shared with the team lead, mentee and owner)</label>
                    <textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <button className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50" disabled={decide.isPending || reason.trim().length < 3} onClick={() => run("reject")}>Reject request</button>
                </div>
            )}
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// needs a mentor
// ---------------------------------------------------------------------------

function MentorSearch({ tier, onPick }: { tier: string; onPick: (m: any) => void }) {
    const [search, setSearch] = useState("");
    const [q, setQ] = useState("");
    useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);
    const { data, isFetching } = useQuery({
        queryKey: ["mentorSearch", q],
        queryFn: () => axiosRequest.get(API_ROUTES.network.mentorships.mentors, { params: { search: q, size: 20 } }),
        enabled: q.length >= 2,
    });
    const items: any[] = (data?.data?.items ?? []).filter((m: any) => String(m.current_tier).toUpperCase() === tier);
    return (
        <div className="mt-2">
            <SearchBox value={search} onChange={setSearch} placeholder={`Search ${tier.toLowerCase()} agents…`} />
            {isFetching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
            <ul className="mt-2 divide-y border rounded-lg max-h-48 overflow-y-auto">
                {items.map((m) => (
                    <li key={m.agent_id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email}</span>
                        <button className="text-primary text-sm hover:underline" onClick={() => onPick(m)}>Assign</button>
                    </li>
                ))}
                {q.length >= 2 && !isFetching && !items.length && <li className="px-3 py-2 text-xs text-gray-400">No {tier.toLowerCase()} agents match.</li>}
            </ul>
        </div>
    );
}

export function NeedsMentorView() {
    const [tierChangeOnly, setTierChangeOnly] = useState(true);
    const [tier, setTier] = useState("");
    const [search, setSearch] = useState("");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState<string | null>(null);
    useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t); }, [search]);
    useEffect(() => setPage(1), [q, tier, tierChangeOnly]);

    const { data, isLoading, isFetching } = GetUnassignedAgents({
        search: q || undefined, tier: tier || undefined, tier_change_only: tierChangeOnly, page, size: SIZE,
    });
    const reassign = ReassignMentor();
    const assign = AssignMentor();

    const pick = (row: any, mentorId: string) => {
        const done = {
            onSuccess: () => { toast.success("Mentor assigned"); setOpen(null); },
            onError: (e: unknown) => toast.error(getApiErrorMessage(e, "Couldn't assign this mentor")),
        };
        if (row.last_mapping_id) reassign.mutate({ mappingId: row.last_mapping_id, mentorId }, done);
        else assign.mutate({ mentorId, menteeId: row.agent_id }, done);
    };

    return (
        <Panel
            title="Needs a mentor"
            subtitle="Bronze agents need a Silver mentor and Silver agents a Gold mentor. Until one is assigned, the mentor's share of their bookings goes to Aparte."
        >
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <SearchBox value={search} onChange={setSearch} placeholder="Search name, email or phone…" />
                <select value={tier} onChange={(e) => setTier(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
                    <option value="">Bronze and Silver</option>
                    <option value="BRONZE">Bronze</option>
                    <option value="SILVER">Silver</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={tierChangeOnly} onChange={(e) => setTierChangeOnly(e.target.checked)} />
                    Only agents who lost their mentor to a tier change
                </label>
            </div>
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.agent_id}
                isLoading={isLoading}
                isFetching={isFetching}
                empty={{ title: "Nobody is waiting for a mentor" }}
                columns={[
                    { header: "Agent", render: (r: any) => <div><p className="font-medium text-gray-900">{[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email}</p><p className="text-xs text-gray-400">{r.email}</p></div> },
                    { header: "Tier", render: (r: any) => <Badge kind="tier" value={r.current_tier} /> },
                    { header: "Needs", render: (r: any) => <Badge kind="tier" value={r.needs_mentor_tier} /> },
                    { header: "Last mentor", render: (r: any) => r.last_mentor_name ? <div><p>{r.last_mentor_name}</p><p className="text-xs text-gray-400">{r.last_ended_reason === "TIER_RULE" ? "Ended by tier change" : r.last_ended_reason === "LAUNCH_CLEANUP" ? "Ended at launch cleanup" : (r.last_ended_reason ?? "Ended").toLowerCase()} · {shortDate(r.last_ended_at)}</p></div> : "None" },
                    {
                        header: "Assign",
                        className: "min-w-[260px]",
                        render: (r: any) => (
                            <div>
                                {(r.suggested_mentors ?? []).map((m: any) => (
                                    <div key={m.agent_id} className="flex items-center justify-between gap-2 text-sm">
                                        <span>{[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email} <span className="text-xs text-gray-400">({m.remaining_slots} slots{m.shares_zone ? ", same zone" : ""})</span></span>
                                        <button className="text-primary hover:underline disabled:opacity-40" disabled={reassign.isPending || assign.isPending} onClick={() => pick(r, m.agent_id)}>Assign</button>
                                    </div>
                                ))}
                                <button className="text-xs text-gray-500 hover:underline mt-1" onClick={() => setOpen(open === r.agent_id ? null : r.agent_id)}>
                                    {open === r.agent_id ? "Hide search" : "Find someone else"}
                                </button>
                                {open === r.agent_id && r.needs_mentor_tier && <MentorSearch tier={r.needs_mentor_tier} onPick={(m) => pick(r, m.agent_id)} />}
                            </div>
                        ),
                    },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// global network report
// ---------------------------------------------------------------------------

const REPORT_COLUMNS = (group: "gold" | "silver" | "bronze") => {
    const cols: { header: string; render: (r: any) => any }[] = [
        { header: "Agent", render: (r) => <div><p className="font-medium text-gray-900">{r.agent_name}</p><p className="text-xs text-gray-400">{r.agent_email}</p></div> },
    ];
    if (group === "bronze") cols.push({ header: "Silver mentor", render: (r) => r.silver_mentor ?? "None" });
    if (group !== "gold") cols.push({ header: "Gold mentor", render: (r) => r.gold_mentor ?? "None" });
    if (group !== "gold") cols.push({
        header: "Link",
        render: (r) => (
            <div className="flex flex-col gap-1">
                {r.mentorship_status ? <Badge value={r.mentorship_status} /> : "—"}
                {r.link_breaks_rule && (
                    <span
                        className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200"
                        title="Gold mentors Silver and Silver mentors Bronze. This link breaks that rule and earns the mentor nothing; reassign under Needs a mentor."
                    >
                        Breaks tier rule
                    </span>
                )}
            </div>
        ),
    });
    cols.push(
        { header: "Team (direct / all)", render: (r) => `${r.direct_mentees} / ${r.whole_team}` },
        { header: "Listed", render: (r) => r.properties_listed },
        { header: "Verified", render: (r) => r.properties_verified },
        { header: "Listed & booked", render: (r) => r.listed_properties_booked },
        { header: "Listed bookings value", render: (r) => `${r.listed_bookings} · ${ngn(r.listed_booking_value)}` },
        { header: "Sign-ups", render: (r) => r.referred_signups },
        { header: "Referral bookings value", render: (r) => `${r.referral_bookings} · ${ngn(r.referral_booking_value)}` },
    );
    return cols;
};

export function NetworkReportView() {
    // Month to date in WAT, the clock the API counts "by date made" on. The
    // defaults used to come from toISOString(), which is UTC — see ./dates.ts.
    // Lazy, so it is computed once rather than on every render.
    const [params, setParams] = useState<ReportParams>(() => defaultReportRange());
    const [draft, setDraft] = useState<ReportParams>(params);
    const [downloading, setDownloading] = useState<string | null>(null);
    const { data, isLoading, isFetching, error } = GetNetworkReport(params);

    const download = async (format: "csv" | "pdf") => {
        setDownloading(format);
        try { await downloadNetworkReport(params, format); }
        catch (e) { toast.error(getApiErrorMessage(e, "Couldn't download the report")); }
        finally { setDownloading(null); }
    };
    const btn = "px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

    return (
        <Panel
            title="Agent network report"
            subtitle="Gold agents, then Silver agents with their Gold mentor, then Bronze agents with both mentors. Bookings are paid bookings, counted by the date they were made (West Africa Time)."
            actions={<>
                <button className={btn} disabled={!!downloading} onClick={() => download("csv")}>{downloading === "csv" ? "Preparing…" : "Download CSV"}</button>
                <button className={btn} disabled={!!downloading} onClick={() => download("pdf")}>{downloading === "pdf" ? "Preparing…" : "Download PDF"}</button>
            </>}
        >
            <div className="mb-5 flex flex-wrap gap-3 items-end">
                <label className="text-xs text-gray-600">From ({REPORT_TIME_ZONE_LABEL})<input type="date" className="block border border-gray-200 rounded-lg text-sm px-3 py-2" value={draft.start_date ?? ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></label>
                <label className="text-xs text-gray-600">To ({REPORT_TIME_ZONE_LABEL})<input type="date" className="block border border-gray-200 rounded-lg text-sm px-3 py-2" value={draft.end_date ?? ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></label>
                <label className="text-xs text-gray-600">Tier
                    <select className="block border border-gray-200 rounded-lg text-sm px-3 py-2" value={draft.tier ?? ""} onChange={(e) => setDraft({ ...draft, tier: e.target.value || undefined })}>
                        <option value="">All tiers</option><option value="GOLD">Gold</option><option value="SILVER">Silver</option><option value="BRONZE">Bronze</option>
                    </select>
                </label>
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium" onClick={() => setParams(draft)}>Apply</button>
                {params.team_head_id && <button className={btn} onClick={() => { const p = { ...params, team_head_id: undefined }; setParams(p); setDraft(p); }}>Show all teams</button>}
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{getApiErrorMessage(error, "Couldn't load the report")}</p>}
            {isLoading ? <div className="flex justify-center py-16"><Loader /></div> : (["gold", "silver", "bronze"] as const).map((group) => (
                <div key={group} className={`mb-8 ${isFetching ? "opacity-60" : ""}`}>
                    <h2 className="text-sm font-semibold text-gray-900 mb-2 capitalize">{group} agents ({data?.[group]?.length ?? 0})</h2>
                    <DataTable
                        rows={data?.[group] ?? []}
                        rowKey={(r: any) => r.agent_id}
                        onRowClick={group === "gold" ? (r: any) => { const p = { ...params, team_head_id: r.agent_id }; setParams(p); setDraft(p); } : undefined}
                        empty={{ title: `No ${group} agents` }}
                        columns={REPORT_COLUMNS(group)}
                    />
                </div>
            ))}
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// admin home: top teams
// ---------------------------------------------------------------------------

export function TopTeamsCard({ enabled = true }: { enabled?: boolean }) {
    const { data, isLoading } = GetTopTeams(enabled);
    const rows: any[] = data?.items ?? [];
    return (
        <div className="rounded-[15px] border border-[#D9D9D9] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Top teams</h3>
            <p className="text-xs text-gray-500 mb-3">Ranked by bookings this month, listed or referred</p>
            {isLoading ? <div className="flex justify-center py-6"><Loader /></div> : rows.length ? (
                <ol className="space-y-2">
                    {rows.map((t, i) => (
                        <li key={t.head_id} className="flex items-center justify-between text-sm">
                            <span className="truncate"><span className="text-gray-400 mr-2">{i + 1}.</span>{t.head?.name ?? "Team"} <Badge kind="tier" value={t.head_tier} /></span>
                            <span className="text-gray-600 whitespace-nowrap">{t.bookings} bookings · {t.members} agents</span>
                        </li>
                    ))}
                </ol>
            ) : <p className="text-sm text-gray-400">No team bookings yet this month.</p>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// agent: my team and peers
// ---------------------------------------------------------------------------

export function MyTeamView() {
    const { data, isLoading } = GetMyTeam({});
    const { data: peers, isLoading: peersLoading } = GetPeers();
    return (
        <>
            <Panel title="My team" subtitle="Your mentees' activity this month, and what you earned from each.">
                <DataTable
                    rows={data?.items ?? []}
                    rowKey={(r: any) => r.agent_id}
                    isLoading={isLoading}
                    empty={{ title: "You have no mentees", body: "Silver agents mentor Bronze agents, and Gold agents mentor Silver agents." }}
                    columns={[
                        { header: "Mentee", render: (r: any) => r.name },
                        { header: "Status", render: (r: any) => <Badge value={r.mentorship_status} /> },
                        { header: "Listed", render: (r: any) => r.properties_listed },
                        { header: "Verified", render: (r: any) => r.properties_verified },
                        { header: "Listed bookings", render: (r: any) => `${r.listed_bookings} · ${ngn(r.listed_booking_value)}` },
                        { header: "Referral bookings", render: (r: any) => `${r.referral_bookings} · ${ngn(r.referral_booking_value)}` },
                        { header: "You earned", render: (r: any) => ngn(r.earned_from) },
                    ]}
                />
            </Panel>
            <Panel title={`Agents on your tier${peers?.tier ? ` (${peers.tier.toLowerCase()})` : ""}`} subtitle="Bookings this month. Only names and counts are shown.">
                {/* /network/peers sends names and counts only — no ids, by design —
                    so two agents with the same name and counts collided under the
                    old name+counts key and React dropped one. See ./rowKeys.ts. */}
                <DataTable
                    rows={peers?.items ?? []}
                    rowKey={peerRowKey}
                    isLoading={peersLoading}
                    empty={{ title: "No other agents on your tier" }}
                    columns={[
                        { header: "Agent", render: (r: any) => r.name },
                        { header: "Listed bookings", render: (r: any) => r.listed_bookings },
                        { header: "Referral bookings", render: (r: any) => r.referral_bookings },
                    ]}
                />
            </Panel>
        </>
    );
}

// ---------------------------------------------------------------------------
// booking detail: commission split (admins)
// ---------------------------------------------------------------------------

const VACANCY: Record<string, string> = {
    NO_AGENT: "No agent",
    NO_MENTOR: "No mentor",
    MENTOR_PAUSED: "Mentorship paused",
    TIER_MISMATCH: "Mentor on the wrong tier",
    NO_TIER_STATE: "Mentor has no tier",
    ACCOUNT_INACTIVE: "Account deactivated",
};

export function CommissionSplitCard({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
    const { data, isLoading } = GetCommissionSplit(bookingId, enabled);
    if (!enabled) return null;
    if (isLoading) return null;
    if (!data) return null;
    const split: CommissionSplitData = data;
    const state = commissionSplitState(split);
    return (
        <div className="rounded-[15px] border border-[#D9D9D9] bg-white p-4 shadow-sm mt-4">
            <h3 className="text-sm font-semibold text-gray-900">Commission split</h3>
            {state === "offline" ? (
                // Paid to the host directly: nothing was split and no fee was
                // charged, so there are no amounts to show. The API also sends
                // every position as paid=false here; printing them would read
                // as money the agents are owed. See ./commissionSplit.ts.
                <div className="mt-1">
                    <p className="text-sm font-medium text-gray-800">{OFFLINE_SPLIT_TITLE}</p>
                    <p className="text-sm text-gray-500">{OFFLINE_SPLIT_BODY}</p>
                </div>
            ) : state === "unlocked" ? (
                <p className="text-sm text-gray-500 mt-1">This booking was made before shares were locked in at booking time. Its split was worked out the older way.</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                        <Stat label="Split base" value={ngn(split.splitting_base)} />
                        <Stat label="Listing pool" value={ngn(split.pools?.listing?.amount)} />
                        <Stat label="Referral pool" value={ngn(split.pools?.referral?.amount)} />
                        <Stat label="Unclaimed to Aparte" value={ngn(split.unclaimed_to_platform?.amount)} />
                    </div>
                    <DataTable<CommissionSplitPosition>
                        rows={split.positions ?? []}
                        rowKey={(p) => `${p.pool}-${p.level}`}
                        empty={{ title: "" }}
                        columns={[
                            { header: "Pool", render: (p) => p.pool === "LISTING" ? "Listing" : "Referral" },
                            { header: "Role", render: (p) => p.role },
                            { header: "Agent", render: (p) => p.agent?.name ?? "—" },
                            { header: "Tier", render: (p) => <Badge kind="tier" value={p.tier} /> },
                            {
                                header: "Share",
                                render: (p) => (
                                    <>
                                        {`${p.percentage}% · ${ngn(p.amount)}`}
                                        {/* Only an explicit paid=false is marked: a payload
                                            without the flag predates it and was paid. */}
                                        {!positionWasPaid(p) && (
                                            <span className="ml-1 text-xs text-gray-400" title="This share has not been credited.">· not paid</span>
                                        )}
                                    </>
                                ),
                            },
                            { header: "Goes to", render: (p) => p.status === "EARNS" ? "Agent" : `Aparte (${VACANCY[p.reason ?? ""] ?? p.reason ?? "—"})` },
                        ]}
                    />
                </>
            )}
        </div>
    );
}
