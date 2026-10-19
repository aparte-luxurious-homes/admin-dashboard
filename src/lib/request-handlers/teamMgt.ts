import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

/**
 * Agent Network cleanup (2026-10-14): team lead workspace, admin approval of
 * team requests, mentor reassignment, network reports and commission splits.
 *
 * Every team endpoint is read-only for the team lead except /team/requests,
 * which files a change for an admin to approve. The server decides who is a
 * team lead on every call; these hooks never assume it.
 */

enum TeamKeys {
    teamMe = "teamMe",
    members = "teamMembers",
    properties = "teamProperties",
    property = "teamProperty",
    bookings = "teamBookings",
    booking = "teamBooking",
    transactions = "teamTransactions",
    reviews = "teamReviews",
    referrals = "teamReferrals",
    myRequests = "teamMyRequests",
    adminRequests = "adminTeamRequests",
    adminRequest = "adminTeamRequest",
    unassigned = "networkUnassigned",
    report = "networkReport",
    topTeams = "networkTopTeams",
    myTeam = "networkMyTeam",
    peers = "networkPeers",
    split = "bookingCommissionSplit",
}

export type Paged<T> = { items: T[]; total: number; page: number; size: number };

const unwrap = (resp: any) => resp?.data?.data ?? resp?.data;
const page = (resp: any) => resp?.data as Paged<any>;

// ---------------------------------------------------------------------------
// team lead
// ---------------------------------------------------------------------------

export interface TeamStanding {
    is_team_lead: boolean;
    mentees: number;
    properties: number;
}

/** Whether the calling agent currently leads a team. Agent-only. */
export function GetTeamStanding(role?: UserRole, enabled = true) {
    return useQuery({
        queryKey: [TeamKeys.teamMe],
        queryFn: () => axiosRequest.get(API_ROUTES.team.me),
        enabled: enabled && role === UserRole.AGENT,
        select: (resp: any): TeamStanding => unwrap(resp),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function GetTeamMembers() {
    return useQuery({
        queryKey: [TeamKeys.members],
        queryFn: () => axiosRequest.get(API_ROUTES.team.members),
        select: unwrap,
    });
}

export function GetTeamProperties(params: { search?: string; page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.properties, params],
        queryFn: () => axiosRequest.get(API_ROUTES.team.properties, { params }),
        select: page,
    });
}

export function GetTeamProperty(id?: string) {
    return useQuery({
        queryKey: [TeamKeys.property, id],
        queryFn: () => axiosRequest.get(API_ROUTES.team.propertyDetails(id as string)),
        enabled: Boolean(id),
        select: unwrap,
    });
}

export function GetTeamBookings(params: { status?: string; search?: string; page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.bookings, params],
        queryFn: () => axiosRequest.get(API_ROUTES.team.bookings, { params }),
        select: page,
    });
}

export function GetTeamBooking(id?: string) {
    return useQuery({
        queryKey: [TeamKeys.booking, id],
        queryFn: () => axiosRequest.get(API_ROUTES.team.bookingDetails(id as string)),
        enabled: Boolean(id),
        select: unwrap,
    });
}

export function GetTeamTransactions(params: { kind?: string; page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.transactions, params],
        queryFn: () => axiosRequest.get(API_ROUTES.team.transactions, { params }),
        select: page,
    });
}

export function GetTeamReviews(params: { page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.reviews, params],
        queryFn: () => axiosRequest.get(API_ROUTES.team.reviews, { params }),
        select: page,
    });
}

export function GetTeamReferrals() {
    return useQuery({
        queryKey: [TeamKeys.referrals],
        queryFn: () => axiosRequest.get(API_ROUTES.team.referrals),
        select: unwrap,
    });
}

export type TeamRequestType = "PROPERTY" | "UNIT" | "AVAILABILITY" | "MEDIA_DELETE" | "BOOKING_ACTION";

export interface TeamRequestInput {
    target_type: TeamRequestType;
    property_id?: string;
    target_id?: string;
    action?: string;
    payload?: Record<string, unknown>;
    note?: string;
}

function invalidateTeam(qc: ReturnType<typeof useQueryClient>) {
    [TeamKeys.myRequests, TeamKeys.property, TeamKeys.properties, TeamKeys.booking, TeamKeys.bookings]
        .forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/** File an edit or booking action. Nothing changes until an admin approves. */
export function CreateTeamRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: TeamRequestInput) => axiosRequest.post(API_ROUTES.team.requests, body),
        onSuccess: () => invalidateTeam(qc),
    });
}

/** Request a new photo or video. Attached to the listing only on approval. */
export function CreateTeamMediaRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { propertyId: string; unitId?: string; file: File; note?: string }) => {
            const form = new FormData();
            form.append("property_id", args.propertyId);
            if (args.unitId) form.append("unit_id", args.unitId);
            form.append("media_file", args.file);
            form.append("media_type", args.file.type.startsWith("video/") ? "VIDEO" : "IMAGE");
            if (args.note) form.append("note", args.note);
            return axiosRequest.post(API_ROUTES.team.mediaRequest, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => invalidateTeam(qc),
    });
}

export function GetMyTeamRequests(params: { status?: string; page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.myRequests, params],
        queryFn: () => axiosRequest.get(API_ROUTES.team.requests, { params }),
        select: page,
    });
}

export function CancelTeamRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => axiosRequest.delete(API_ROUTES.team.requestDetails(id)),
        onSuccess: () => invalidateTeam(qc),
    });
}

// ---------------------------------------------------------------------------
// admin: team requests
// ---------------------------------------------------------------------------

export function GetAdminTeamRequests(params: { status?: string; page: number; size: number }) {
    return useQuery({
        queryKey: [TeamKeys.adminRequests, params],
        queryFn: () => axiosRequest.get(API_ROUTES.teamRequests.base, { params }),
        select: page,
    });
}

export function GetAdminTeamRequest(id?: string) {
    return useQuery({
        queryKey: [TeamKeys.adminRequest, id],
        queryFn: () => axiosRequest.get(API_ROUTES.teamRequests.details(id as string)),
        enabled: Boolean(id),
        select: unwrap,
    });
}

export function DecideTeamRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { id: string; decision: "approve" | "reject"; reason?: string }) =>
            args.decision === "approve"
                ? axiosRequest.post(API_ROUTES.teamRequests.approve(args.id))
                : axiosRequest.post(API_ROUTES.teamRequests.reject(args.id), { reason: args.reason }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [TeamKeys.adminRequests] });
            qc.invalidateQueries({ queryKey: [TeamKeys.adminRequest] });
        },
    });
}

// ---------------------------------------------------------------------------
// admin: mentors, reports, splits
// ---------------------------------------------------------------------------

export function GetUnassignedAgents(params: {
    search?: string; tier?: string; tier_change_only?: boolean; page: number; size: number;
}) {
    return useQuery({
        queryKey: [TeamKeys.unassigned, params],
        queryFn: () => axiosRequest.get(API_ROUTES.network.mentorships.unassigned, { params }),
        select: page,
    });
}

/** Give an existing (or ended) mentorship's mentee a new mentor. */
export function ReassignMentor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { mappingId: string; mentorId: string }) =>
            axiosRequest.post(API_ROUTES.network.mentorships.reassign(args.mappingId), {
                mentor_id: args.mentorId,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: [TeamKeys.unassigned] }),
    });
}

/** Assign a mentor to an agent who has none. */
export function AssignMentor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args: { mentorId: string; menteeId: string }) =>
            axiosRequest.post(API_ROUTES.network.mentorships.base, {
                mentor_id: args.mentorId,
                mentee_id: args.menteeId,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: [TeamKeys.unassigned] }),
    });
}

export interface ReportParams {
    start_date?: string;
    end_date?: string;
    tier?: string;
    team_head_id?: string;
}

export function GetNetworkReport(params: ReportParams) {
    return useQuery({
        queryKey: [TeamKeys.report, params],
        queryFn: () => axiosRequest.get(API_ROUTES.network.report, { params }),
        select: unwrap,
    });
}

/** Download the report as CSV or PDF through the authenticated client. */
export async function downloadNetworkReport(params: ReportParams, format: "csv" | "pdf") {
    const resp = await axiosRequest.get(API_ROUTES.network.report, {
        params: { ...params, format },
        responseType: "blob",
        timeout: 120000,
    });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aparte-network-report.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function GetTopTeams(enabled = true) {
    return useQuery({
        queryKey: [TeamKeys.topTeams],
        queryFn: () => axiosRequest.get(API_ROUTES.statistic.adminTopTeams),
        enabled,
        select: unwrap,
        staleTime: 5 * 60 * 1000,
    });
}

export function GetMyTeam(params: { start_date?: string; end_date?: string }) {
    return useQuery({
        queryKey: [TeamKeys.myTeam, params],
        queryFn: () => axiosRequest.get(API_ROUTES.network.myTeam, { params }),
        select: unwrap,
    });
}

export function GetPeers() {
    return useQuery({
        queryKey: [TeamKeys.peers],
        queryFn: () => axiosRequest.get(API_ROUTES.network.peers),
        select: unwrap,
    });
}

export function GetCommissionSplit(bookingId?: string, enabled = true) {
    return useQuery({
        queryKey: [TeamKeys.split, bookingId],
        queryFn: () => axiosRequest.get(API_ROUTES.bookings.commissionSplit(bookingId as string)),
        enabled: enabled && Boolean(bookingId),
        select: unwrap,
        retry: false,
    });
}
