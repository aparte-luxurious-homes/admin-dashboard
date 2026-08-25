'use client'

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react/dist/iconify.js";
import { LuX } from "react-icons/lu";
import {
    GetNetworkAgents,
    networkAgentName,
    type NetworkAgentOption,
} from "@/src/lib/request-handlers/networkMgt";

const RELATION_LABEL: Record<NetworkAgentOption["relation"], string> = {
    self: "You",
    mentee: "Mentee",
    zone: "Zone",
};

const RELATION_STYLE: Record<NetworkAgentOption["relation"], string> = {
    self: "bg-primary/10 text-primary border-primary/20",
    mentee: "bg-emerald-50 text-emerald-700 border-emerald-200",
    zone: "bg-purple-50 text-purple-700 border-purple-200",
};

/**
 * "Whose rows" picker for the agent-facing network tables.
 *
 * Source is GET /network/agents, so the options are exactly the caller's
 * `VisibilityScope` — themselves, their mentees, and every agent holding a
 * property inside a zone tree they manage. A selection therefore can never 403
 * against `agent_id` on /network/history or /network/mentorship.
 *
 * Search runs server-side (debounced). Filtering a first page client-side would
 * hide everyone past it, which matters here: a Regional Lead's zone can hold
 * hundreds of agents.
 *
 * Render it only when the caller is a mentor or a zone manager — for anyone
 * else the endpoint returns one row (themselves) and the control is noise.
 */
export default function NetworkAgentFilter({
    value,
    onChange,
    enabled = true,
    placeholder = "Filter by agent…",
    className = "",
}: {
    value: string;
    /**
     * `label` is the agent's display name, passed alongside the id so a caller
     * can caption a flow with it ("choose mentees for Ada") without refetching
     * the list this component already holds. Optional second argument: existing
     * callers that only take the id keep working unchanged.
     */
    onChange: (agentId: string, label?: string) => void;
    enabled?: boolean;
    placeholder?: string;
    className?: string;
}) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [open, setOpen] = useState(false);
    const comboRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (comboRef.current && !comboRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    // Only query while the dropdown is open — a combobox the caller never opens
    // shouldn't hit the API, and once a selection is made `search` holds that
    // agent's name, so a background refetch would just echo it back.
    const { data, isLoading } = GetNetworkAgents({
        search: debouncedSearch || undefined,
        enabled: enabled && open,
    });

    const options = data?.items ?? [];

    const clear = () => { onChange("", ""); setSearch(""); };

    if (!enabled) return null;

    return (
        <div ref={comboRef} className={`relative ${className}`}>
            <div className={`flex items-center border rounded-lg bg-white overflow-hidden transition-all ${value ? "border-primary" : "border-gray-300"} focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                <Icon icon="mdi:magnify" width="16" className="ml-3 text-gray-400 shrink-0" />
                <input
                    type="text"
                    value={search}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                        if (!e.target.value && value) onChange("", "");
                    }}
                    className="px-2 py-2 text-sm text-gray-700 bg-transparent outline-none w-52"
                />
                {value && (
                    <button
                        type="button"
                        aria-label="Clear agent filter"
                        onMouseDown={(e) => { e.preventDefault(); clear(); }}
                        className="pr-3 text-gray-400 hover:text-gray-600"
                    >
                        <LuX size={14} />
                    </button>
                )}
            </div>

            {open && !value && (
                <ul className="absolute z-50 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {isLoading && (
                        <li className="px-4 py-3 text-sm text-gray-400 italic">Loading agents…</li>
                    )}
                    {!isLoading && options.length === 0 && (
                        <li className="px-4 py-3 text-sm text-gray-400 italic">
                            {debouncedSearch ? "No agent matches that search" : "No agents in your network"}
                        </li>
                    )}
                    {!isLoading && options.map((agent) => (
                        <li
                            key={agent.agent_id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(agent.agent_id, networkAgentName(agent));
                                setSearch(networkAgentName(agent));
                                setOpen(false);
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                        >
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                {agent.profile_image ? (
                                    <Image src={agent.profile_image} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <Icon icon="gg:profile" width="16" className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{networkAgentName(agent)}</p>
                                {agent.email && <p className="text-xs text-gray-400 truncate">{agent.email}</p>}
                            </div>
                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RELATION_STYLE[agent.relation] ?? RELATION_STYLE.zone}`}>
                                {RELATION_LABEL[agent.relation] ?? agent.relation}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
