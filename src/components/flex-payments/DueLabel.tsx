import { format } from "date-fns";
import { hoursUntil } from "@/src/lib/flexPayments";

/** "Due in 2 days", "Overdue by 5 h", or an em dash when there is no deadline. */
export function relativeDue(dueAt: string | null, now: Date = new Date()): string {
    const h = hoursUntil(dueAt, now);
    if (h === null) return "—";
    const abs = Math.abs(h);
    const span = abs < 1 ? "under an hour" : abs < 48 ? `${Math.round(abs)} h` : `${Math.round(abs / 24)} days`;
    return h >= 0 ? `Due in ${span}` : `Overdue by ${span}`;
}

export default function DueLabel({ dueAt, settled }: { dueAt: string | null; settled?: boolean }) {
    if (!dueAt) return <span className="text-gray-400">—</span>;
    const overdue = (hoursUntil(dueAt) ?? 0) < 0;
    return (
        <span>
            <span className="block text-gray-800">{format(new Date(dueAt), "d MMM yyyy, h:mm a")}</span>
            {!settled && (
                <span className={`block text-xs ${overdue ? "text-red-600" : "text-gray-500"}`}>{relativeDue(dueAt)}</span>
            )}
        </span>
    );
}
