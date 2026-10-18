'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
    CancelTeamRequest,
    GetMyTeamRequests,
    GetTeamBookings,
    GetTeamMembers,
    GetTeamProperties,
    GetTeamReferrals,
    GetTeamReviews,
    GetTeamTransactions,
} from "@/src/lib/request-handlers/teamMgt";
import { Badge, DataTable, Pager, Panel, SearchBox, Tabs, ngn, shortDate } from "./ui";
import { describeRequest } from "./requestText";

const SIZE = 20;

function useDebounced(value: string, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value.trim()), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

// ---------------------------------------------------------------------------

export function TeamMembersView() {
    const { data, isLoading } = GetTeamMembers();
    const rows: any[] = data?.items ?? [];
    return (
        <Panel
            title="Team members"
            subtitle={`Your mentees, this month${data?.period_start ? ` (since ${shortDate(data.period_start)})` : ""}. Paused mentees stay listed.`}
        >
            <DataTable
                rows={rows}
                rowKey={(r) => r.agent_id}
                isLoading={isLoading}
                empty={{ title: "No mentees yet" }}
                columns={[
                    { header: "Agent", render: (r) => <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{r.email}</p></div> },
                    { header: "Tier", render: (r) => <Badge kind="tier" value={r.tier} /> },
                    { header: "Status", render: (r) => <Badge value={r.mentorship_status} /> },
                    { header: "Listed", render: (r) => r.properties_listed },
                    { header: "Verified", render: (r) => r.properties_verified },
                    { header: "Booked", render: (r) => r.listed_properties_booked },
                    { header: "Listed bookings", render: (r) => `${r.listed_bookings} · ${ngn(r.listed_booking_value)}` },
                    { header: "Referral bookings", render: (r) => `${r.referral_bookings} · ${ngn(r.referral_booking_value)}` },
                    { header: "Sign-ups", render: (r) => r.referred_signups },
                    { header: "You earned", render: (r) => ngn(r.earned_from) },
                ]}
            />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

export function TeamPropertiesView() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const q = useDebounced(search);
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [q]);
    const { data, isLoading, isFetching } = GetTeamProperties({ search: q || undefined, page, size: SIZE });
    return (
        <Panel title="Team properties" subtitle="Properties your mentees manage. Changes you make are sent to an admin for approval.">
            <div className="mb-4"><SearchBox value={search} onChange={setSearch} placeholder="Search by name, city or address…" /></div>
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                onRowClick={(r: any) => router.push(PAGE_ROUTES.dashboard.team.propertyDetails(r.id))}
                empty={{ title: q ? "No properties match that search" : "No team properties yet" }}
                columns={[
                    { header: "Property", render: (r: any) => <div><p className="font-medium text-gray-900">{r.name}</p><p className="text-xs text-gray-400">{[r.city, r.state].filter(Boolean).join(", ")}</p></div> },
                    { header: "Agent", render: (r: any) => r.agent?.name ?? "—" },
                    { header: "Owner", render: (r: any) => r.owner ? <div><p>{r.owner.name}</p><p className="text-xs text-gray-400">{r.owner.email}</p></div> : "—" },
                    { header: "Verified", render: (r: any) => <Badge value={r.is_verified ? "APPROVED" : "PENDING"} /> },
                    { header: "Pending change", render: (r: any) => r.has_pending_request ? <Badge value="PENDING" /> : "—" },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

const BOOKING_STATUSES = [
    "", "APPROVAL_PENDING", "PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT",
    "CANCEL_REQUESTED", "CANCELLED", "COMPLETED",
];

export function TeamBookingsView() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const q = useDebounced(search);
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [q, status]);
    const { data, isLoading, isFetching } = GetTeamBookings({ search: q || undefined, status: status || undefined, page, size: SIZE });
    return (
        <Panel title="Team bookings" subtitle="Bookings on your mentees' properties and bookings your mentees referred.">
            <div className="mb-4 flex gap-3 flex-wrap">
                <SearchBox value={search} onChange={setSearch} placeholder="Search booking ID or property…" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
                    {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ").toLowerCase() : "All statuses"}</option>)}
                </select>
            </div>
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                onRowClick={(r: any) => router.push(PAGE_ROUTES.dashboard.team.bookingDetails(r.id))}
                empty={{ title: "No bookings found" }}
                columns={[
                    { header: "Booking", render: (r: any) => <div><p className="font-medium text-gray-900">{r.booking_id}</p><p className="text-xs text-gray-400">{r.property?.name} · {r.unit?.name}</p></div> },
                    { header: "Guest", render: (r: any) => r.guest_name },
                    { header: "Dates", render: (r: any) => `${shortDate(r.start_date)} – ${shortDate(r.end_date)}` },
                    { header: "Total", render: (r: any) => ngn(r.total_price) },
                    { header: "Status", render: (r: any) => <Badge value={r.status} /> },
                    { header: "Via", render: (r: any) => r.is_team_property ? (r.listing_agent?.name ?? "Listing") : `Referral by ${r.referrer?.name ?? "mentee"}` },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

type TxKind = "" | "earnings" | "withdrawals" | "payments" | "refunds";

export function TeamTransactionsView({ initialKind = "" }: { initialKind?: TxKind }) {
    const [kind, setKind] = useState<TxKind>(initialKind);
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [kind]);
    const { data, isLoading, isFetching } = GetTeamTransactions({ kind: kind || undefined, page, size: SIZE });
    return (
        <Panel title="Team transactions" subtitle="Who moved money, how much, and its status. Wallet balances and bank details are never shown.">
            <Tabs<TxKind>
                value={kind}
                onChange={setKind}
                options={[
                    { value: "", label: "All" },
                    { value: "earnings", label: "Earnings" },
                    { value: "withdrawals", label: "Withdrawals" },
                    { value: "payments", label: "Guest payments" },
                    { value: "refunds", label: "Refunds" },
                ]}
            />
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                empty={{ title: "No transactions" }}
                columns={[
                    { header: "Date", render: (r: any) => shortDate(r.created_at) },
                    { header: "Who", render: (r: any) => <div><p>{r.who?.name}</p><p className="text-xs text-gray-400">{r.who?.kind === "mentee" ? "Mentee" : "Guest"}</p></div> },
                    { header: "Type", render: (r: any) => `${r.type.toLowerCase()} · ${r.action.toLowerCase()}` },
                    { header: "Amount", render: (r: any) => ngn(r.amount) + (r.fee_amount ? ` (fee ${ngn(r.fee_amount)})` : "") },
                    { header: "Status", render: (r: any) => <Badge value={r.status} /> },
                    { header: "Description", render: (r: any) => <span className="text-xs text-gray-500">{r.description ?? "—"}</span> },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

export function TeamReviewsView() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isFetching } = GetTeamReviews({ page, size: SIZE });
    return (
        <Panel title="Team reviews" subtitle="Guest reviews of your mentees' properties.">
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                empty={{ title: "No reviews yet" }}
                columns={[
                    { header: "Date", render: (r: any) => shortDate(r.created_at) },
                    { header: "Property", render: (r: any) => r.property?.name },
                    { header: "Guest", render: (r: any) => r.guest_name },
                    { header: "Rating", render: (r: any) => `${r.rating} / 5` },
                    { header: "Comment", render: (r: any) => <span className="text-sm">{r.comment ?? "—"}</span> },
                    { header: "Flagged", render: (r: any) => r.is_flagged ? <Badge value="FAILED" /> : "—" },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

export function TeamReferralsView() {
    const { data, isLoading } = GetTeamReferrals();
    return (
        <Panel title="Team referrals" subtitle="Sign-ups and referral bookings by each mentee, this month and all time.">
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.agent?.id}
                isLoading={isLoading}
                empty={{ title: "No mentees yet" }}
                columns={[
                    { header: "Mentee", render: (r: any) => r.agent?.name ?? "—" },
                    { header: "Sign-ups (month)", render: (r: any) => r.signups_mtd },
                    { header: "Bookings (month)", render: (r: any) => `${r.referral_bookings_mtd} · ${ngn(r.referral_value_mtd)}` },
                    { header: "Sign-ups (all time)", render: (r: any) => r.signups_total },
                    { header: "Bookings (all time)", render: (r: any) => `${r.referral_bookings_total} · ${ngn(r.referral_value_total)}` },
                ]}
            />
        </Panel>
    );
}

// ---------------------------------------------------------------------------

// APPLYING: an admin has approved and the change is being applied (API status machine PENDING -> APPLYING -> APPROVED | FAILED).
type ReqStatus = "" | "PENDING" | "APPLYING" | "APPROVED" | "REJECTED" | "FAILED" | "CANCELLED";

export function TeamRequestsView() {
    const [status, setStatus] = useState<ReqStatus>("PENDING");
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [status]);
    const { data, isLoading, isFetching } = GetMyTeamRequests({ status: status || undefined, page, size: SIZE });
    const cancel = CancelTeamRequest();
    return (
        <Panel title="My requests" subtitle="Changes you asked for. Each one is applied only after an admin approves it.">
            <Tabs<ReqStatus>
                value={status}
                onChange={setStatus}
                options={[
                    { value: "PENDING", label: "Pending" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "APPLYING", label: "Applying" },
                    { value: "FAILED", label: "Could not apply" },
                    { value: "CANCELLED", label: "Cancelled" },
                    { value: "", label: "All" },
                ]}
            />
            <DataTable
                rows={data?.items ?? []}
                rowKey={(r: any) => r.id}
                isLoading={isLoading}
                isFetching={isFetching}
                empty={{ title: "No requests" }}
                columns={[
                    { header: "Filed", render: (r: any) => shortDate(r.created_at) },
                    { header: "Request", render: (r: any) => describeRequest(r) },
                    { header: "Status", render: (r: any) => <Badge value={r.status} /> },
                    { header: "Outcome", render: (r: any) => <span className="text-xs text-gray-500">{r.decision_reason ?? r.apply_error ?? (r.decided_by ? `By ${r.decided_by.name}` : "—")}</span> },
                    {
                        header: "",
                        render: (r: any) => r.status === "PENDING" ? (
                            <button
                                disabled={cancel.isPending}
                                onClick={() => cancel.mutate(r.id, {
                                    onSuccess: () => toast.success("Request cancelled"),
                                    onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't cancel this request")),
                                })}
                                className="text-sm text-red-600 hover:underline disabled:opacity-40"
                            >
                                Cancel
                            </button>
                        ) : null,
                    },
                ]}
            />
            <Pager page={page} size={SIZE} total={data?.total ?? 0} onPage={setPage} />
        </Panel>
    );
}
