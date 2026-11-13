'use client'

import { ReactNode, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import Loader from "@/src/components/loader";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
    CreateTeamMediaRequest,
    CreateTeamRequest,
    GetTeamBooking,
    GetTeamProperty,
    TeamRequestInput,
} from "@/src/lib/request-handlers/teamMgt";
import { Badge, Panel, Stat, ngn, shortDate } from "./ui";
import { describeRequest } from "./requestText";

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block mb-3">
            <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
            {children}
        </label>
    );
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <Field label="Note for the admin (optional)">
            <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={1000} rows={2} className={input} />
        </Field>
    );
}

/** Files a request and closes; shows the server's reason on refusal. */
function useSubmit(onDone: () => void) {
    const create = CreateTeamRequest();
    const submit = (body: TeamRequestInput) =>
        create.mutate(body, {
            onSuccess: () => {
                toast.success("Sent to an admin for approval");
                onDone();
            },
            onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't send this request")),
        });
    return { submit, pending: create.isPending };
}

/** Only fields the team lead actually changed are sent. */
function changed(original: Record<string, any>, edited: Record<string, any>) {
    const out: Record<string, any> = {};
    Object.entries(edited).forEach(([k, v]) => {
        if (v !== original[k]) out[k] = v;
    });
    return out;
}

function PendingList({ items }: { items: any[] }) {
    if (!items?.length) return null;
    return (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">Waiting for admin approval</p>
            <ul className="text-sm text-amber-800 list-disc pl-5">
                {items.map((r) => <li key={r.id}>{describeRequest(r)} · {shortDate(r.created_at)}</li>)}
            </ul>
        </div>
    );
}

// ---------------------------------------------------------------------------
// property
// ---------------------------------------------------------------------------

function EditPropertyModal({ property, onClose }: { property: any; onClose: () => void }) {
    const original = {
        name: property.name ?? "",
        description: property.description ?? "",
        rules: property.rules ?? "",
        booking_mode: property.booking_mode ?? "INSTANT",
        is_pet_allowed: Boolean(property.is_pet_allowed),
        is_party_allowed: Boolean(property.is_party_allowed),
    };
    const [form, setForm] = useState(original);
    const [note, setNote] = useState("");
    const { submit, pending } = useSubmit(onClose);
    const diff = changed(original, form);
    return (
        <Modal title="Request property changes" onClose={onClose}>
            <Field label="Name"><input className={input} value={form.name} maxLength={255} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Description"><textarea className={input} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="House rules"><textarea className={input} rows={3} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></Field>
            <Field label="Booking mode">
                <select className={input} value={form.booking_mode} onChange={(e) => setForm({ ...form, booking_mode: e.target.value })}>
                    <option value="INSTANT">Instant booking</option>
                    <option value="REQUEST_TO_BOOK">Request to book</option>
                </select>
            </Field>
            <div className="flex gap-6 mb-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_pet_allowed} onChange={(e) => setForm({ ...form, is_pet_allowed: e.target.checked })} /> Pets allowed</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_party_allowed} onChange={(e) => setForm({ ...form, is_party_allowed: e.target.checked })} /> Parties allowed</label>
            </div>
            <NoteField value={note} onChange={setNote} />
            <button
                className={primaryBtn}
                disabled={pending || !Object.keys(diff).length}
                onClick={() => submit({ target_type: "PROPERTY", property_id: property.id, payload: diff, note })}
            >
                Send for approval
            </button>
        </Modal>
    );
}

function EditUnitModal({ property, unit, onClose }: { property: any; unit: any; onClose: () => void }) {
    const original = {
        name: unit.name ?? "",
        price_per_night: Number(unit.price_per_night ?? 0),
        caution_fee: Number(unit.caution_fee ?? 0),
        max_guests: Number(unit.max_guests ?? 1),
    };
    const [form, setForm] = useState(original);
    const [note, setNote] = useState("");
    const { submit, pending } = useSubmit(onClose);
    const diff = changed(original, form);
    const num = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value === "" ? 0 : Number(e.target.value) });
    return (
        <Modal title={`Request changes to ${unit.name}`} onClose={onClose}>
            <Field label="Unit name"><input className={input} value={form.name} maxLength={255} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Price per night (₦)"><input type="number" min={1} className={input} value={form.price_per_night} onChange={num("price_per_night")} /></Field>
            <Field label="Caution fee (₦)"><input type="number" min={0} className={input} value={form.caution_fee} onChange={num("caution_fee")} /></Field>
            <Field label="Max guests"><input type="number" min={1} className={input} value={form.max_guests} onChange={num("max_guests")} /></Field>
            <NoteField value={note} onChange={setNote} />
            <button
                className={primaryBtn}
                disabled={pending || !Object.keys(diff).length}
                onClick={() => submit({ target_type: "UNIT", property_id: property.id, target_id: unit.id, payload: diff, note })}
            >
                Send for approval
            </button>
        </Modal>
    );
}

function AvailabilityModal({ property, onClose }: { property: any; onClose: () => void }) {
    const units: any[] = property.units ?? [];
    const [unitId, setUnitId] = useState(units[0]?.id ?? "");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [blackout, setBlackout] = useState(true);
    const [price, setPrice] = useState("");
    const [note, setNote] = useState("");
    const { submit, pending } = useSubmit(onClose);

    const dates = (() => {
        if (!from || !to || to < from) return [];
        const out: string[] = [];
        const d = new Date(`${from}T00:00:00Z`);
        const end = new Date(`${to}T00:00:00Z`);
        while (d <= end && out.length <= 366) {
            out.push(d.toISOString().slice(0, 10));
            d.setUTCDate(d.getUTCDate() + 1);
        }
        return out;
    })();

    return (
        <Modal title="Request an availability change" onClose={onClose}>
            <Field label="Unit">
                <select className={input} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="From"><input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
                <Field label="To"><input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={blackout} onChange={(e) => setBlackout(e.target.checked)} /> Close these nights
            </label>
            <Field label="Custom price per night (₦, optional)">
                <input type="number" min={1} className={input} value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <NoteField value={note} onChange={setNote} />
            <p className="text-xs text-gray-500 mb-3">{dates.length} night(s) selected.</p>
            <button
                className={primaryBtn}
                disabled={pending || !unitId || !dates.length || dates.length > 366}
                onClick={() => submit({
                    target_type: "AVAILABILITY", property_id: property.id, target_id: unitId, note,
                    payload: { dates: dates.map((date) => ({ date, is_blackout: blackout, ...(price ? { pricing: Number(price) } : {}) })) },
                })}
            >
                Send for approval
            </button>
        </Modal>
    );
}

function AddMediaModal({ property, onClose }: { property: any; onClose: () => void }) {
    const units: any[] = property.units ?? [];
    const [unitId, setUnitId] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const upload = CreateTeamMediaRequest();
    return (
        <Modal title="Request a new photo or video" onClose={onClose}>
            <Field label="Where it goes">
                <select className={input} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                    <option value="">The property gallery</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </Field>
            <Field label="File (photo up to 10MB, video up to 50MB)">
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            <NoteField value={note} onChange={setNote} />
            <button
                className={primaryBtn}
                disabled={upload.isPending || !file}
                onClick={() => file && upload.mutate(
                    { propertyId: property.id, unitId: unitId || undefined, file, note },
                    {
                        onSuccess: () => { toast.success("Sent to an admin for approval"); onClose(); },
                        onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't upload this file")),
                    },
                )}
            >
                {upload.isPending ? "Uploading…" : "Send for approval"}
            </button>
        </Modal>
    );
}

export function TeamPropertyDetailView({ id }: { id: string }) {
    const { data, isLoading, error } = GetTeamProperty(id);
    const [modal, setModal] = useState<null | "edit" | "availability" | "media" | { unit: any }>(null);
    const removeMedia = useSubmit(() => undefined);

    if (isLoading) return <div className="flex items-center justify-center py-24"><Loader /></div>;
    if (error || !data) {
        return <Panel title="Property"><p className="text-sm text-gray-500">{getApiErrorMessage(error, "This property is not in your team.")}</p></Panel>;
    }
    const p = data;
    const address = [p.street_number, p.street_name, p.address, p.city, p.state].filter(Boolean).join(", ");
    return (
        <Panel
            title={p.name}
            subtitle={address}
            actions={
                <>
                    <button className={secondaryBtn} onClick={() => setModal("edit")}>Request edit</button>
                    <button className={secondaryBtn} onClick={() => setModal("availability")}>Request availability change</button>
                    <button className={secondaryBtn} onClick={() => setModal("media")}>Request new photo</button>
                </>
            }
        >
            <PendingList items={p.pending_requests} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <Stat label="Owner" value={p.owner ? <span>{p.owner.name}<br /><span className="text-xs font-normal text-gray-500">{p.owner.email}</span></span> : "—"} />
                <Stat label="Agent" value={p.agent?.name ?? "—"} />
                <Stat label="Verified" value={p.is_verified ? "Yes" : "No"} />
                <Stat label="Booking mode" value={p.booking_mode === "REQUEST_TO_BOOK" ? "Request to book" : "Instant"} />
            </div>
            {p.description && <p className="text-sm text-gray-700 mb-5 whitespace-pre-line">{p.description}</p>}

            <h2 className="text-sm font-semibold text-gray-900 mb-2">Units</h2>
            <div className="divide-y border rounded-lg mb-5">
                {(p.units ?? []).map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{ngn(u.price_per_night)} / night · caution {ngn(u.caution_fee)} · up to {u.max_guests} guests</p>
                        </div>
                        <button className={secondaryBtn} onClick={() => setModal({ unit: u })}>Request edit</button>
                    </div>
                ))}
            </div>

            <h2 className="text-sm font-semibold text-gray-900 mb-2">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(p.media ?? []).map((m: any) => (
                    <div key={m.id} className="relative rounded-lg overflow-hidden border">
                        {m.media_type === "VIDEO"
                            ? <video src={m.media_url} className="w-full h-28 object-cover" />
                            // eslint-disable-next-line @next/next/no-img-element
                            : <img src={m.media_url} alt="" className="w-full h-28 object-cover" />}
                        <button
                            className="absolute bottom-1 right-1 rounded bg-white/90 px-2 py-0.5 text-[11px] text-red-600"
                            disabled={removeMedia.pending}
                            onClick={() => removeMedia.submit({ target_type: "MEDIA_DELETE", property_id: p.id, target_id: m.id })}
                        >
                            Request removal
                        </button>
                    </div>
                ))}
            </div>

            {modal === "edit" && <EditPropertyModal property={p} onClose={() => setModal(null)} />}
            {modal === "availability" && <AvailabilityModal property={p} onClose={() => setModal(null)} />}
            {modal === "media" && <AddMediaModal property={p} onClose={() => setModal(null)} />}
            {modal && typeof modal === "object" && <EditUnitModal property={p} unit={modal.unit} onClose={() => setModal(null)} />}
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// booking
// ---------------------------------------------------------------------------

const ACTIONS_BY_STATUS: Record<string, { action: string; label: string; needsReason?: boolean }[]> = {
    APPROVAL_PENDING: [
        { action: "APPROVE_REQUEST", label: "Request approval of this booking" },
        { action: "REJECT_REQUEST", label: "Request rejection", needsReason: true },
    ],
    PENDING: [{ action: "CANCEL", label: "Request cancellation", needsReason: true }],
    PENDING_PAYMENT: [{ action: "CANCEL", label: "Request cancellation", needsReason: true }],
    CONFIRMED: [
        { action: "CHECK_IN", label: "Request check-in" },
        { action: "CANCEL", label: "Request cancellation", needsReason: true },
    ],
    CHECKED_IN: [{ action: "CHECK_OUT", label: "Request check-out" }],
};

export function TeamBookingDetailView({ id }: { id: string }) {
    const { data, isLoading, error } = GetTeamBooking(id);
    const [reasonFor, setReasonFor] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const { submit, pending } = useSubmit(() => { setReasonFor(null); setReason(""); });

    if (isLoading) return <div className="flex items-center justify-center py-24"><Loader /></div>;
    if (error || !data) {
        return <Panel title="Booking"><p className="text-sm text-gray-500">{getApiErrorMessage(error, "This booking is not in your team.")}</p></Panel>;
    }
    const b = data;
    const actions = b.is_team_property ? (ACTIONS_BY_STATUS[b.status] ?? []) : [];
    const file = (action: string, why?: string) =>
        submit({ target_type: "BOOKING_ACTION", target_id: b.id, action, payload: why ? { reason: why } : {} });

    return (
        <Panel
            title={b.booking_id}
            subtitle={`${b.property?.name} · ${b.unit?.name}`}
            actions={actions.map((a) => (
                <button
                    key={a.action}
                    className={secondaryBtn}
                    disabled={pending}
                    onClick={() => (a.needsReason ? setReasonFor(a.action) : file(a.action))}
                >
                    {a.label}
                </button>
            ))}
        >
            <PendingList items={b.pending_requests} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Stat label="Guest" value={b.guest_name} />
                <Stat label="Status" value={<Badge value={b.status} />} />
                <Stat label="Dates" value={`${shortDate(b.start_date)} – ${shortDate(b.end_date)}`} />
                <Stat label="Guests" value={b.guests_count} />
                <Stat label="Total" value={ngn(b.total_price)} />
                <Stat label="Caution" value={ngn(b.caution_fee)} />
                <Stat label="Listing agent" value={b.listing_agent?.name ?? "—"} />
                <Stat label="Referred by" value={b.referrer?.name ?? "—"} />
            </div>
            {!b.is_team_property && (
                <p className="text-xs text-gray-500">This booking is here because your mentee referred it. Actions belong to the property&apos;s own agent.</p>
            )}
            <Link href={PAGE_ROUTES.dashboard.team.propertyDetails(b.property?.id)} className="text-sm text-primary hover:underline">
                Open property
            </Link>

            {reasonFor && (
                <Modal title="Reason" onClose={() => setReasonFor(null)}>
                    <Field label="Why? This is shared with the admin.">
                        <textarea className={input} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                    </Field>
                    <button className={primaryBtn} disabled={pending || reason.trim().length < 3} onClick={() => file(reasonFor, reason.trim())}>
                        Send for approval
                    </button>
                </Modal>
            )}
        </Panel>
    );
}
