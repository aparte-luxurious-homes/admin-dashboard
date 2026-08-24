"use client";

/**
 * MenteeCandidatePicker — paginated, multi-select table of agents a mentor is
 * eligible to take on, used inside the "Invite a Mentee" modal.
 *
 * Serves both views. An agent picking their own mentees hits
 * /network/mentorship/candidates; an admin picking on someone's behalf hits
 * /admin/network/mentorship/candidates?mentor_id=… — same eligibility filters
 * either way (active agents strictly below the mentor's tier, no un-ended
 * mentorship, outside the re-link cooldown), so the `endpoint` / `extraParams`
 * props are the only difference.
 *
 * Server-driven throughout: search and paging are query params, so the
 * component never holds more than one page in memory.
 *
 * Selection is capped at the mentor's remaining allowance, which the candidate
 * response carries (mentee_cap / remaining_mentee_slots). That cap is advisory
 * here — the backend re-checks it per create, which is what actually protects
 * the invariant.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-hot-toast";

import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import Loader from "@/src/components/loader";

export interface MenteeCandidate {
    agent_id?: string;
    id?: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
    current_tier?: string;
}

const TIER_STYLES: Record<string, string> = {
    BRONZE: "text-amber-700 bg-amber-50 border-amber-300",
    SILVER: "text-slate-600 bg-slate-100 border-slate-300",
    GOLD:   "text-yellow-600 bg-yellow-50 border-yellow-300",
};

const PAGE_SIZE = 10;

/**
 * Fixed shell height, shared by every state (loading, empty, at-capacity,
 * populated) so the modal never resizes underneath the user. Sized to seat a
 * full PAGE_SIZE page without scrolling: 10 rows x 52px + 41px header + the
 * caption / search / footer chrome. The max-h caps it on short viewports,
 * where the row area scrolls instead.
 */
const SHELL_HEIGHT = "h-[860px] max-h-[calc(100vh-140px)]";

export function candidateKey(c: MenteeCandidate): string {
    return (c.agent_id ?? c.id ?? c.user_id ?? "") as string;
}

export function candidateName(c: MenteeCandidate): string {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    return name || c.email || "—";
}

function TierPill({ tier }: { tier?: string }) {
    if (!tier) return null;
    const style = TIER_STYLES[tier] ?? "text-gray-600 bg-gray-50 border-gray-300";
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${style}`}>
            <Icon icon="mdi:shield-star-outline" width="11" />
            {tier.charAt(0) + tier.slice(1).toLowerCase()}
        </span>
    );
}

/**
 * Controlled checkbox. The shared ui/customCheckbox holds its own internal
 * state, so it cannot follow programmatic changes (select-all, random pick,
 * clear-on-success) — this table needs the parent to be the only source of
 * truth, hence a plain input styled to match.
 */
function RowCheckbox({
    checked, disabled, onChange, indeterminate = false, label,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    indeterminate?: boolean;
    label: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate && !checked;
    }, [indeterminate, checked]);

    return (
        <label
            className={`inline-flex items-center ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            onClick={(e) => e.stopPropagation()}
        >
            <input
                ref={ref}
                type="checkbox"
                aria-label={label}
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span
                className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                    checked || indeterminate
                        ? "bg-primary border-primary"
                        : "border-zinc-300 bg-white hover:border-zinc-400"
                }`}
            >
                {checked ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : indeterminate ? (
                    <span className="w-2 h-0.5 bg-white rounded" />
                ) : null}
            </span>
        </label>
    );
}

interface Props {
    /** Tiers the mentor may take on, e.g. ["SILVER", "BRONZE"] — display only. */
    tiersBelowLabel: string;
    /** Remaining allowance: mentee_cap - active_mentee_count. */
    remainingSlots: number;
    menteeCap: number;
    /** False while the allowance is still resolving. The response's own
     *  mentee_cap / remaining_mentee_slots override these props once it lands. */
    allowanceLoaded: boolean;
    /** Candidate endpoint; defaults to the agent's own. */
    endpoint?: string;
    /** Extra query params sent on every request, e.g. { mentor_id }. */
    extraParams?: Record<string, string | number>;
    /** "self" addresses the mentor directly; "mentor" is the admin-on-behalf voice. */
    voice?: "self" | "mentor";
    /** Invite a single candidate (row menu). */
    onMentorOne: (candidate: MenteeCandidate) => void;
    /** Invite everything currently ticked. */
    onMentorMany: (candidates: MenteeCandidate[]) => void;
    isSubmitting: boolean;
    /** Bumped by the parent after a successful invite to force a refetch. */
    refreshToken?: number;
}

export default function MenteeCandidatePicker({
    tiersBelowLabel,
    remainingSlots,
    menteeCap,
    allowanceLoaded,
    endpoint = API_ROUTES.network.mentorshipCandidates,
    extraParams,
    voice = "self",
    onMentorOne,
    onMentorMany,
    isSubmitting,
    refreshToken = 0,
}: Props) {
    const subjectLabel = useMemo(
        () => voice === "mentor"
            ? { can: "This mentor can take on", cap: "This mentor has reached their mentee limit" }
            : { can: "You can take on",         cap: "You’ve reached your mentee limit" },
        [voice],
    );

    const paramsKey = JSON.stringify(extraParams ?? {});

    const [rows, setRows]         = useState<MenteeCandidate[]>([]);
    const [total, setTotal]       = useState(0);
    const [page, setPage]         = useState(1);
    const [search, setSearch]     = useState("");
    const [isLoading, setLoading] = useState(true);
    const [menuFor, setMenuFor]   = useState<string | null>(null);
    // The candidate response reports the mentor's capacity. Preferred over the
    // props so the admin view needs no separate allowance lookup.
    const [serverAllowance, setServerAllowance] = useState<{ cap: number; remaining: number } | null>(null);
    // A rejected first load (e.g. 403 when the chosen mentor is not Silver or
    // Gold) must surface, not spin forever waiting on an allowance.
    const [loadError, setLoadError] = useState<string | null>(null);

    // Keyed by agent id so a selection survives paging and searching — the row
    // objects themselves are replaced on every fetch.
    const [selected, setSelected] = useState<Record<string, MenteeCandidate>>({});

    const cap       = serverAllowance?.cap ?? menteeCap;
    const remaining = serverAllowance?.remaining ?? remainingSlots;
    const ready     = allowanceLoaded || serverAllowance !== null;

    const selectedIds   = useMemo(() => Object.keys(selected), [selected]);
    const selectedCount = selectedIds.length;
    const atCapacity    = selectedCount >= remaining;
    const totalPages    = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const menuRef = useRef<HTMLDivElement>(null);

    // Debounced fetch. Search and paging both go to the server, so a page never
    // holds more than PAGE_SIZE rows regardless of how many agents exist.
    useEffect(() => {
        const term = search.trim();
        const timer = setTimeout(() => {
            setLoading(true);
            setLoadError(null);
            axiosRequest
                .get(endpoint, {
                    params: { page, size: PAGE_SIZE, ...extraParams, ...(term ? { search: term } : {}) },
                })
                .then((res) => {
                    const payload = res?.data?.data ?? res?.data;
                    const items = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
                    setRows(items);
                    setTotal(payload?.total ?? items.length);
                    if (typeof payload?.mentee_cap === "number") {
                        setServerAllowance({
                            cap: payload.mentee_cap,
                            remaining: payload.remaining_mentee_slots ?? 0,
                        });
                    }
                })
                .catch((err) => {
                    const message =
                        err?.response?.data?.detail ||
                        err?.response?.data?.message ||
                        "Failed to load candidates";
                    setLoadError(message);
                    toast.error(message);
                })
                .finally(() => setLoading(false));
        }, term ? 300 : 0);
        return () => clearTimeout(timer);
        // extraParams is tracked via paramsKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, refreshToken, endpoint, paramsKey]);

    // Drop selections once an invite round completes — the invited agents are
    // no longer eligible, and the fetch effect above is already refetching.
    useEffect(() => {
        if (!refreshToken) return;
        setSelected({});
    }, [refreshToken]);

    // Invites can empty the last page; step back rather than stranding the user
    // on a page that no longer exists.
    useEffect(() => {
        if (!isLoading && rows.length === 0 && page > 1) setPage((p) => p - 1);
    }, [isLoading, rows.length, page]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const toggleRow = useCallback((c: MenteeCandidate, next: boolean) => {
        const id = candidateKey(c);
        setSelected((prev) => {
            if (!next) {
                const { [id]: _removed, ...rest } = prev;
                return rest;
            }
            if (Object.keys(prev).length >= remaining) {
                toast.error(`${subjectLabel.can} ${remaining} more ${remaining === 1 ? "mentee" : "mentees"}`);
                return prev;
            }
            return { ...prev, [id]: c };
        });
    }, [remaining, subjectLabel]);

    const selectableOnPage = useMemo(
        () => rows.filter((r) => candidateKey(r) && !selected[candidateKey(r)]),
        [rows, selected],
    );
    const allOnPageSelected = rows.length > 0 && selectableOnPage.length === 0;

    const togglePage = useCallback((next: boolean) => {
        setSelected((prev) => {
            if (!next) {
                const rest = { ...prev };
                rows.forEach((r) => delete rest[candidateKey(r)]);
                return rest;
            }
            const merged = { ...prev };
            for (const r of rows) {
                if (Object.keys(merged).length >= remaining) break;
                const id = candidateKey(r);
                if (id) merged[id] = r;
            }
            return merged;
        });
    }, [rows, remaining]);

    /**
     * Fills every remaining slot with a random draw from the eligible pool.
     * Pulls one server page sized to the whole pool so the draw spans all
     * candidates, not just the page on screen — capped at the endpoint's
     * documented max page size of 100.
     */
    const randomFill = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosRequest.get(endpoint, {
                params: { page: 1, size: 100, ...extraParams },
            });
            const payload = res?.data?.data ?? res?.data;
            const pool: MenteeCandidate[] = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
            if (pool.length === 0) {
                toast.error("No eligible candidates to pick from");
                return;
            }
            // Fisher–Yates over a copy, then take the first N.
            const shuffled = [...pool];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const picked = shuffled.slice(0, remaining);
            setSelected(Object.fromEntries(picked.map((c) => [candidateKey(c), c])));
            toast.success(`Randomly selected ${picked.length} ${picked.length === 1 ? "agent" : "agents"}`);
        } catch {
            toast.error("Could not build a random selection");
        } finally {
            setLoading(false);
        }
        // extraParams is tracked via paramsKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, endpoint, paramsKey]);

    const clearSelection = useCallback(() => setSelected({}), []);

    if (loadError && !ready) {
        return (
            <div className={`flex flex-col items-center justify-center px-6 text-center ${SHELL_HEIGHT}`}>
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <Icon icon="mdi:alert-circle-outline" width="26" className="text-red-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Can&apos;t list candidates</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">{loadError}</p>
            </div>
        );
    }

    if (!ready) {
        return <div className={`flex items-center justify-center ${SHELL_HEIGHT}`}><Loader /></div>;
    }

    if (remaining <= 0) {
        return (
            <div className={`flex flex-col items-center justify-center px-6 text-center ${SHELL_HEIGHT}`}>
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                    <Icon icon="mdi:account-multiple-remove-outline" width="26" className="text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{subjectLabel.cap}</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    This mentor is at {cap} of a maximum {cap}. An existing mentorship must end before a new one can start.
                </p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-0 ${SHELL_HEIGHT}`}>
            {/* Allowance caption + bulk actions */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex gap-2.5">
                    <Icon icon="mdi:information-outline" width="16" className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed max-w-lg">
                        {subjectLabel.can}{" "}
                        <span className="font-semibold text-gray-900">
                            {remaining} more {remaining === 1 ? "mentee" : "mentees"}
                        </span>{" "}
                        (limit {cap}). Showing {tiersBelowLabel.toLowerCase()} agents who
                        aren&apos;t already in a mentorship.
                        {selectedCount > 0 && (
                            <> <span className="font-semibold text-primary">{selectedCount} selected.</span></>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {selectedCount > 0 ? (
                        <button
                            onClick={clearSelection}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <Icon icon="mdi:close-circle-outline" width="14" />
                            Deselect all
                        </button>
                    ) : (
                        <button
                            onClick={randomFill}
                            disabled={isSubmitting || isLoading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 disabled:opacity-40 transition-colors"
                        >
                            <Icon icon="mdi:shuffle-variant" width="14" />
                            Randomly select {remaining}
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100">
                <div className="relative max-w-sm">
                    <Icon icon="mdi:magnify" width="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center"><Loader /></div>
                ) : rows.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <th className="pl-6 pr-2 py-3 w-10">
                                    <RowCheckbox
                                        label="Select all on this page"
                                        checked={allOnPageSelected}
                                        indeterminate={selectedCount > 0 && !allOnPageSelected}
                                        disabled={isSubmitting || (atCapacity && !allOnPageSelected)}
                                        onChange={togglePage}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">Agent</th>
                                <th className="px-4 py-3 text-left">Tier</th>
                                <th className="px-4 py-3 text-left">Phone</th>
                                <th className="px-4 py-3 text-right w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rows.map((c) => {
                                const id = candidateKey(c);
                                const isSelected = Boolean(selected[id]);
                                const blocked = !isSelected && atCapacity;
                                return (
                                    <tr
                                        key={id}
                                        onClick={() => !blocked && !isSubmitting && toggleRow(c, !isSelected)}
                                        className={`transition-colors ${blocked ? "opacity-50" : "cursor-pointer hover:bg-gray-50"} ${isSelected ? "bg-primary/5" : ""}`}
                                    >
                                        <td className="pl-6 pr-2 py-2.5">
                                            <RowCheckbox
                                                label={`Select ${candidateName(c)}`}
                                                checked={isSelected}
                                                disabled={blocked || isSubmitting}
                                                onChange={(next) => toggleRow(c, next)}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                    {c.profile_image ? (
                                                        <Image src={c.profile_image} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <Icon icon="gg:profile" width="18" className="text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{candidateName(c)}</p>
                                                    {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5"><TierPill tier={c.current_tier} /></td>
                                        <td className="px-4 py-2.5 text-sm text-gray-600">{c.phone || "—"}</td>
                                        <td className="px-4 py-2.5 text-right relative">
                                            {/* The row menu is the single-mentee shortcut. Once the
                                                row is ticked it belongs to the batch, so the
                                                shortcut goes away — the footer button acts on it. */}
                                            {!isSelected && (
                                                <button
                                                    aria-label={`Actions for ${candidateName(c)}`}
                                                    onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === id ? null : id); }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width="18" />
                                                </button>
                                            )}
                                            {!isSelected && menuFor === id && (
                                                <div
                                                    ref={menuRef}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-6 top-10 z-20 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => { setMenuFor(null); onMentorOne(c); }}
                                                        disabled={isSubmitting}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 text-left"
                                                    >
                                                        <Icon icon="mdi:account-heart-outline" width="16" className="text-primary" />
                                                        Mentor this agent
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="mdi:account-search-outline" width="26" className="text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">No eligible agents found</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                            {search
                                ? "No candidate matches that search."
                                : "Every agent below your tier is either already in a mentorship or within the re-link cooldown."}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer: paging + batch action */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                        {total > 0 && <span className="text-gray-400"> · {total} eligible</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= totalPages || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => onMentorMany(selectedIds.map((id) => selected[id]))}
                    disabled={selectedCount === 0 || isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                    {isSubmitting ? (
                        <Icon icon="mdi:loading" width="15" className="animate-spin" />
                    ) : (
                        <Icon icon="mdi:account-multiple-plus-outline" width="15" />
                    )}
                    {selectedCount > 1 ? `Mentor ${selectedCount} agents` : "Mentor selected"}
                </button>
            </div>
        </div>
    );
}
