'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTableState } from "@/src/hooks/useTableState";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
    GetWhatsAppConversations,
    WA_STATES,
    WaConversationSummary,
} from "@/src/lib/request-handlers/whatsappMgt";
import { DataTable, Pager, Panel, SearchBox } from "@/src/components/team/ui";
import { NeedsOpsBadge, WaModeBadge, WaStateBadge } from "./badges";
import { contactName, displayNumber, STATE_LABEL, waitTime } from "./format";

const LIMIT = 20;

/** Re-render on a timer so wait times keep counting between refetches. */
export function useNow(intervalMs = 30 * 1000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}

/**
 * The ops inbox. Chats handed to ops always sort first (the API orders them
 * that way on every sort), and the list refetches every 30s.
 *
 * Must render inside a <Suspense> boundary: useTableState reads the URL.
 */
export default function InboxList() {
    const router = useRouter();
    const now = useNow();
    const table = useTableState({ filterKeys: ["state", "mode", "needs_ops"], defaultSort: "last_message" });
    const { state, mode, needs_ops: needsOps } = table.filters;

    const { data, isLoading, isFetching, error } = GetWhatsAppConversations({
        page: table.page,
        limit: LIMIT,
        state: state || undefined,
        mode: mode || undefined,
        handover: needsOps === "1" ? true : undefined,
        search: table.debouncedSearch.trim() || undefined,
        sort_by: table.sort || undefined,
    });

    const select = "border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white";

    return (
        <Panel
            title="WhatsApp inbox"
            subtitle="Every conversation with the Aparte WhatsApp bot. Chats waiting for a person are listed first."
            actions={
                data && data.handover_count > 0 ? (
                    <button
                        onClick={() => table.setFilter("needs_ops", needsOps === "1" ? "" : "1")}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium"
                    >
                        <Icon icon="mdi:account-alert-outline" width={18} />
                        {data.handover_count} waiting for ops
                    </button>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <SearchBox value={table.search} onChange={table.setSearch} placeholder="Search name or number…" />
                <select aria-label="State" value={state} onChange={(e) => table.setFilter("state", e.target.value)} className={select}>
                    <option value="">All states</option>
                    {WA_STATES.map((s) => <option key={s} value={s}>{STATE_LABEL[s]}</option>)}
                </select>
                <select aria-label="Mode" value={mode} onChange={(e) => table.setFilter("mode", e.target.value)} className={select}>
                    <option value="">Guests and agents</option>
                    <option value="GUEST">Guests</option>
                    <option value="AGENT">Agents</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={needsOps === "1"}
                        onChange={(e) => table.setFilter("needs_ops", e.target.checked ? "1" : "")}
                    />
                    Needs ops only
                </label>
                <select aria-label="Sort" value={table.sort} onChange={(e) => table.setSort(e.target.value)} className={select}>
                    <option value="last_message">Latest message first</option>
                    <option value="oldest">Oldest message first</option>
                    <option value="first_message">Newest conversation first</option>
                </select>
                {table.hasActiveFilters && (
                    <button onClick={table.clearFilters} className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                        <Icon icon="lucide:x" width={16} /> Clear
                    </button>
                )}
            </div>

            {error && !data ? (
                <p className="py-10 text-center text-sm text-red-600">{getApiErrorMessage(error, "Couldn't load conversations")}</p>
            ) : (
                <DataTable<WaConversationSummary>
                    rows={data?.items ?? []}
                    rowKey={(r) => r.id}
                    isLoading={isLoading}
                    isFetching={isFetching && !isLoading}
                    onRowClick={(r) => router.push(PAGE_ROUTES.dashboard.whatsapp.conversation(r.id))}
                    empty={{
                        title: table.hasActiveFilters ? "No conversations match" : "No conversations yet",
                        body: table.hasActiveFilters ? "Try clearing the filters." : "Chats with the bot will show up here.",
                    }}
                    columns={[
                        {
                            header: "Contact",
                            render: (r) => (
                                <div className="min-w-[160px]">
                                    <p className="font-medium text-gray-900">{contactName(r.contact)}</p>
                                    <p className="text-xs text-gray-400">{displayNumber(r.contact?.wa_id)}</p>
                                </div>
                            ),
                        },
                        {
                            header: "Status",
                            render: (r) => (
                                <div className="flex flex-wrap gap-1">
                                    {r.state === "HANDED_OVER" && <NeedsOpsBadge />}
                                    <WaModeBadge mode={r.mode} />
                                    {r.state !== "HANDED_OVER" && <WaStateBadge state={r.state} />}
                                </div>
                            ),
                        },
                        {
                            header: "Last message",
                            className: "max-w-[360px]",
                            render: (r) => (
                                <p className="text-gray-600 line-clamp-2 break-words">
                                    {r.last_message_preview || <span className="text-gray-400">—</span>}
                                </p>
                            ),
                        },
                        {
                            header: "Waiting",
                            render: (r) => {
                                const waiting = r.state === "HANDED_OVER";
                                const since = waiting ? (r.handover_at ?? r.last_message_at) : r.last_message_at;
                                return (
                                    <div className="whitespace-nowrap">
                                        <p className={waiting ? "font-semibold text-orange-700" : "text-gray-700"}>{waitTime(since, now)}</p>
                                        <p className="text-xs text-gray-400">
                                            {waiting ? (r.handover_to_name ? `with ${r.handover_to_name}` : "unassigned") : "since last message"}
                                        </p>
                                    </div>
                                );
                            },
                        },
                    ]}
                />
            )}
            <Pager page={table.page} size={LIMIT} total={data?.total ?? 0} onPage={table.setPage} />
        </Panel>
    );
}
