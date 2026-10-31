'use client'

import { ReactNode, useState } from "react";
import { toast } from "react-hot-toast";
import Loader from "@/src/components/loader";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { UserRole } from "@/src/lib/enums";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import {
    GetAdminTargets,
    GetMyTargets,
    GetTargetHistory,
    GetTargetTree,
    MONEY_MEASURES,
    SetAgentTarget,
    TARGET_MEASURES,
    TargetInput,
    TargetMeasure,
    TargetMeasureKey,
    TargetNode,
} from "@/src/lib/request-handlers/teamMgt";
import { Badge, DataTable, Panel, ngn, shortDate } from "./ui";
import { lagosToday } from "./dates";

/**
 * Monthly team targets (api: services/network/targets.py).
 *
 * An admin sets a target on a team head; it splits equally down the team as
 * it stood on the 1st. Every agent sees their own share, what they achieved
 * and the %; a lead also sees the people below them. Bookings count only when
 * paid through Aparte, in the month the payment was confirmed (WAT), and a
 * listing counts once, when first verified. All the arithmetic is the
 * server's; this file only lays it out.
 */

const thisMonth = () => lagosToday().slice(0, 7);

const SHORT_LABEL: Record<TargetMeasureKey, string> = {
    referred_count: "Referred bookings",
    referred_value: "Referred booking value",
    listed_booking_count: "Bookings on listed properties",
    listed_booking_value: "Booking value on listed properties",
    verified_listings: "Verified listings",
};

const isMoney = (m: TargetMeasureKey) => MONEY_MEASURES.includes(m);
const fmt = (m: TargetMeasureKey, v: number | null | undefined) =>
    v == null ? "—" : isMoney(m) ? ngn(v) : Number(v).toLocaleString("en-NG");

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <label className="text-xs text-gray-600">Month (WAT)
            <input
                type="month"
                className="block border border-gray-200 rounded-lg text-sm px-3 py-2"
                value={value}
                onChange={(e) => e.target.value && onChange(e.target.value)}
            />
        </label>
    );
}

function Progress({ pct }: { pct: number | null }) {
    if (pct == null) return <span className="text-xs text-gray-400">No target set</span>;
    const over = pct >= 100;
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                    className={`h-full rounded-full ${over ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            {/* Not capped: 125% is a result worth seeing. */}
            <span className={`text-xs font-semibold ${over ? "text-emerald-700" : "text-gray-700"}`}>{pct}%</span>
        </div>
    );
}

function MeasureTable({ measures }: { measures: Record<TargetMeasureKey, TargetMeasure> }) {
    return (
        <DataTable
            rows={TARGET_MEASURES.map((m) => ({ key: m, ...measures[m] }))}
            rowKey={(r) => r.key}
            empty={{ title: "" }}
            columns={[
                { header: "Measure", render: (r) => SHORT_LABEL[r.key] },
                { header: "Target", render: (r) => fmt(r.key, r.target) },
                { header: "Achieved", render: (r) => fmt(r.key, r.achieved) },
                { header: "Progress", render: (r) => <Progress pct={r.pct} /> },
            ]}
        />
    );
}

function InfoStrip({ info }: { info: TargetNode["info"] }) {
    return (
        <p className="text-sm text-gray-600 mt-3">
            <span className="font-medium text-gray-900">{info.listed_properties_booked}</span> of{" "}
            <span className="font-medium text-gray-900">{info.lifetime_verified_listings}</span> lifetime verified
            listings were booked this month
            {info.listed_properties_booked_pct != null && <> ({info.listed_properties_booked_pct}%)</>}.
        </p>
    );
}

function Compact({ node }: { node: TargetNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {TARGET_MEASURES.map((m) => (
                <div key={m} className="rounded-lg border border-gray-200 px-3 py-2">
                    <p className="text-[11px] text-gray-500 leading-tight">{SHORT_LABEL[m]}</p>
                    <p className="text-sm font-semibold text-gray-900">
                        {fmt(m, node.measures[m].achieved)}
                        <span className="font-normal text-gray-500"> / {fmt(m, node.measures[m].target)}</span>
                    </p>
                    <Progress pct={node.measures[m].pct} />
                </div>
            ))}
        </div>
    );
}

function MemberCard({ node, depth = 0 }: { node: TargetNode; depth?: number }) {
    const [open, setOpen] = useState(false);
    const kids = node.members ?? [];
    return (
        <div className={`rounded-xl border border-gray-200 p-3 ${depth ? "bg-gray-50" : "bg-white"}`}>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{node.agent.name}</span>
                    <Badge kind="tier" value={node.agent.tier} />
                    {!node.has_share && (
                        <span className="text-xs text-gray-500" title="Joined after the 1st. Their work counts for the team now; their share starts next month.">
                            Joined this month · no share yet
                        </span>
                    )}
                </div>
                {kids.length > 0 && (
                    <button className="text-sm text-primary font-medium" onClick={() => setOpen(!open)}>
                        {open ? "Hide" : `Show ${kids.length} member${kids.length === 1 ? "" : "s"}`}
                    </button>
                )}
            </div>
            <Compact node={node} />
            {open && (
                <div className="mt-3 space-y-2 pl-3 border-l-2 border-gray-200">
                    {kids.map((k) => <MemberCard key={k.agent.id} node={k} depth={depth + 1} />)}
                </div>
            )}
        </div>
    );
}

function TeamBreakdown({ node, ownLabel }: { node: TargetNode; ownLabel: string }) {
    const members = node.members ?? [];
    if (!members.length) return null;
    return (
        <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Team members</h2>
            <p className="text-xs text-gray-500 mb-3">
                Each member's share of the target and what they achieved for this team this month. Shares follow the
                team as it stood on the 1st.
            </p>
            <div className="space-y-2">
                {members.map((m) => <MemberCard key={m.agent.id} node={m} />)}
                {node.own_work && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-3">
                        <p className="font-medium text-gray-900 mb-2">{ownLabel}</p>
                        <Compact node={{ ...node, measures: node.own_work }} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// agent: my targets
// ---------------------------------------------------------------------------

export function MyTargetsView() {
    const [month, setMonth] = useState(thisMonth);
    const { data, isLoading, error } = GetMyTargets(month);
    const me = data?.me;
    return (
        <Panel
            title="My targets"
            subtitle="Your share of your team's monthly target, what you've achieved and the percentage. Bookings count when paid through Aparte (online or wallet), in the month the payment was confirmed. Listings count once, when first verified."
            actions={<MonthPicker value={month} onChange={setMonth} />}
        >
            {error && <p className="text-sm text-red-600 mb-3">{getApiErrorMessage(error, "Couldn't load your targets")}</p>}
            {isLoading || !me ? <div className="flex justify-center py-16"><Loader /></div> : (
                <>
                    {data?.is_lead && (
                        <p className="text-sm text-gray-600 mb-3">
                            As a team lead, your target is your team's: your own work and your members' both count.
                        </p>
                    )}
                    <MeasureTable measures={me.measures} />
                    <InfoStrip info={me.info} />
                    <TeamBreakdown node={me} ownLabel="Your own work" />
                </>
            )}
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// admin: team targets
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b px-5 py-3">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const primaryBtn = "px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50";
const secondaryBtn = "px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

type Agent = { id: string; name: string };

function EditTargetModal({ agent, current, onClose }: {
    agent: Agent; current?: TargetNode["direct_target"]; onClose: () => void;
}) {
    const [values, setValues] = useState<Record<TargetMeasureKey, string>>(() =>
        Object.fromEntries(TARGET_MEASURES.map((m) => [m, current?.[m] == null ? "" : String(current[m])])) as Record<TargetMeasureKey, string>,
    );
    const [applyFrom, setApplyFrom] = useState<TargetInput["apply_from"]>("THIS_MONTH");
    const [note, setNote] = useState("");
    const { data: history } = GetTargetHistory(agent.id);
    const save = SetAgentTarget();

    const submit = () => {
        const body: TargetInput = { apply_from: applyFrom, note: note || undefined };
        for (const m of TARGET_MEASURES) body[m] = values[m] === "" ? null : Number(values[m]);
        save.mutate({ agentId: agent.id, body }, {
            onSuccess: (resp: any) => {
                const warnings: string[] = resp?.data?.data?.warnings ?? [];
                toast.success("Target saved");
                warnings.forEach((w) => toast(w, { icon: "⚠️", duration: 8000 }));
                onClose();
            },
            onError: (e) => { toast.error(getApiErrorMessage(e, "Couldn't save the target")); },
        });
    };

    return (
        <Modal title={`Target for ${agent.name}`} onClose={onClose}>
            <p className="text-sm text-gray-500 mb-4">
                The target repeats every month until you change it. It splits equally among this agent's team. Leave a
                measure empty for no target on it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TARGET_MEASURES.map((m) => (
                    <label key={m} className="text-xs text-gray-600">
                        {SHORT_LABEL[m]}{isMoney(m) ? " (₦)" : ""}
                        <input
                            type="number" min={0} step={isMoney(m) ? "0.01" : "1"} className={input}
                            value={values[m]} onChange={(e) => setValues({ ...values, [m]: e.target.value })}
                        />
                    </label>
                ))}
            </div>
            <fieldset className="mt-4">
                <legend className="text-xs text-gray-600 mb-1">Apply from</legend>
                <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" checked={applyFrom === "THIS_MONTH"} onChange={() => setApplyFrom("THIS_MONTH")} />This month</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={applyFrom === "NEXT_MONTH"} onChange={() => setApplyFrom("NEXT_MONTH")} />From next month</label>
                </div>
            </fieldset>
            <label className="text-xs text-gray-600 block mt-4">Note (optional)
                <input className={input} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2 mt-5">
                <button className={secondaryBtn} onClick={onClose}>Cancel</button>
                <button className={primaryBtn} disabled={save.isPending} onClick={submit}>{save.isPending ? "Saving…" : "Save target"}</button>
            </div>
            {!!history?.length && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">History</h3>
                    <ul className="space-y-1 text-xs text-gray-600">
                        {history.map((h) => (
                            <li key={h.id}>
                                <span className="font-medium text-gray-900">From {h.effective_month}</span>
                                {" · "}
                                {h.cleared ? "Target cleared" : TARGET_MEASURES.filter((m) => h[m] != null).map((m) => `${SHORT_LABEL[m]} ${fmt(m, h[m])}`).join(", ")}
                                {" · "}{h.set_by?.name ?? "—"}, {shortDate(h.created_at)}
                                {h.note && <> · “{h.note}”</>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Modal>
    );
}

function TreeModal({ agent, month, onClose }: { agent: Agent; month: string; onClose: () => void }) {
    const { data, isLoading } = GetTargetTree(agent.id, month);
    const team = data?.team;
    return (
        <Modal title={`${agent.name}'s team, ${month}`} onClose={onClose}>
            {isLoading || !team ? <div className="flex justify-center py-10"><Loader /></div> : (
                <>
                    <MeasureTable measures={team.measures} />
                    <InfoStrip info={team.info} />
                    <TeamBreakdown node={team} ownLabel={`${team.agent.name}'s own work`} />
                </>
            )}
        </Modal>
    );
}

function AgentPicker({ onPick }: { onPick: (a: Agent) => void }) {
    const [search, setSearch] = useState("");
    const { data, isLoading } = GetAllUsers(1, 10, search, UserRole.AGENT);
    const users: any[] = (data as any)?.data?.data?.data ?? [];
    const name = (u: any) =>
        [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(" ") || u.email || "Agent";
    return (
        <div>
            <input className={input} placeholder="Search agents by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="mt-2 max-h-64 overflow-y-auto divide-y">
                {isLoading ? <div className="flex justify-center py-6"><Loader /></div> : users.map((u) => (
                    <button key={u.id} className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50" onClick={() => onPick({ id: u.id, name: name(u) })}>
                        {name(u)} <span className="text-gray-400">{u.email}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function AdminTargetsView() {
    const [month, setMonth] = useState(thisMonth);
    const { data, isLoading, isFetching, error } = GetAdminTargets(month);
    const [editing, setEditing] = useState<{ agent: Agent; current?: TargetNode["direct_target"] } | null>(null);
    const [viewing, setViewing] = useState<Agent | null>(null);
    const [picking, setPicking] = useState(false);
    const rows = data?.items ?? [];

    return (
        <Panel
            title="Team targets"
            subtitle="Set each team's monthly target and track target vs achieved. A team head's target splits equally down their team as it stood on the 1st. Bookings count when paid through Aparte, in the month paid (WAT); listings count once, when first verified."
            actions={<>
                <MonthPicker value={month} onChange={setMonth} />
                <button className={primaryBtn} onClick={() => setPicking(true)}>Set a target</button>
            </>}
        >
            {error && <p className="text-sm text-red-600 mb-3">{getApiErrorMessage(error, "Couldn't load targets")}</p>}
            <DataTable<TargetNode>
                rows={rows}
                rowKey={(r) => r.agent.id}
                isLoading={isLoading}
                isFetching={isFetching}
                onRowClick={(r) => setViewing({ id: r.agent.id, name: r.agent.name })}
                empty={{ title: "No team targets yet", body: "Set a target on a team head, or on an agent with no team." }}
                columns={[
                    { header: "Team head", render: (r) => <div className="flex items-center gap-2"><span className="font-medium text-gray-900">{r.agent.name}</span><Badge kind="tier" value={r.agent.tier} /></div> },
                    { header: "Team", render: (r) => `${r.team_size ?? 0} agent${r.team_size === 1 ? "" : "s"}` },
                    ...TARGET_MEASURES.map((m) => ({
                        header: SHORT_LABEL[m],
                        render: (r: TargetNode) => (
                            <div className="min-w-[120px]">
                                <p className="text-sm">{fmt(m, r.measures[m].achieved)} <span className="text-gray-400">/ {fmt(m, r.measures[m].target)}</span></p>
                                <Progress pct={r.measures[m].pct} />
                            </div>
                        ),
                    })),
                    {
                        header: "",
                        render: (r) => (
                            <button
                                className={secondaryBtn}
                                onClick={(e) => { e.stopPropagation(); setEditing({ agent: { id: r.agent.id, name: r.agent.name }, current: r.direct_target }); }}
                            >
                                Edit target
                            </button>
                        ),
                    },
                ]}
            />
            {!!data?.overridden?.length && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-medium mb-1">Targets not in force this month</p>
                    <p className="mb-2">These agents had a mentor on the 1st, so they receive a share of their team's target instead of their own.</p>
                    <ul className="list-disc pl-5">
                        {data.overridden.map((o) => <li key={o.agent.id}>{o.agent.name} (in {o.inherits_from.name}'s team)</li>)}
                    </ul>
                </div>
            )}
            {picking && (
                <Modal title="Choose an agent" onClose={() => setPicking(false)}>
                    <AgentPicker onPick={(a) => { setPicking(false); setEditing({ agent: a }); }} />
                </Modal>
            )}
            {editing && <EditTargetModal agent={editing.agent} current={editing.current} onClose={() => setEditing(null)} />}
            {viewing && <TreeModal agent={viewing} month={month} onClose={() => setViewing(null)} />}
        </Panel>
    );
}
