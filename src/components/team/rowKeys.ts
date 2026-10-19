/**
 * React keys for rows that may carry no identity of their own.
 *
 * `/network/peers` deliberately returns names and month-to-date counts only
 * — no ids, emails or values (API `reports.peers`, decided 2026-10-14), so a
 * peer can never be looked up or contacted from here. The old key was
 * name + counts, and two agents called "Tunde Bello" with the same counts
 * (two with none is the common case) collided: React rendered one of them and
 * warned about the other. Prefer an id whenever the row has one, so this does
 * the right thing the day the API adds it; otherwise the position in the list
 * is the key. That is safe for this table — a read-only snapshot, never
 * reordered or edited in place, so a key has nothing to preserve across
 * renders — and would not be for one with per-row state.
 */
export interface KeyedRow {
    id?: string | number | null;
    agent_id?: string | number | null;
    /** Whatever else the row carries (name, counts); the key never reads it. */
    [field: string]: unknown;
}

export function peerRowKey(row: KeyedRow, index: number): string {
    const id = row.agent_id ?? row.id;
    return id != null && id !== "" ? `peer-${id}` : `peer-${index}`;
}
