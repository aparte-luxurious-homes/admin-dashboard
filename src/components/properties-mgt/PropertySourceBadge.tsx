import { IPropertySource, PropertySourceType } from "./types";

/**
 * Where a property on an agent's list came from, when it isn't theirs.
 *
 * Silver/Gold agents and zone managers see their mentees', referrals' and
 * zone's listings alongside their own. Without a reason on the row, those
 * read as someone else's data leaking in. Renders nothing for the agent's
 * own rows (`source` null) and for callers the API doesn't badge (absent).
 */
const SOURCE_STYLES: Record<
    PropertySourceType,
    { label: string; className: string; explain: (name: string | null) => string }
> = {
    REFERRAL: {
        label: "Referral",
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        explain: (name) => `${name ?? "The owner"} signed up with your referral code`,
    },
    VERIFICATION: {
        label: "To verify",
        className: "bg-sky-50 text-sky-700 border-sky-100",
        explain: () => "You were assigned to verify this property",
    },
    MENTEE: {
        label: "Mentee",
        className: "bg-violet-50 text-violet-700 border-violet-100",
        explain: (name) => `Listed or referred by your mentee${name ? ` ${name}` : ""}`,
    },
    ZONE: {
        label: "Zone",
        className: "bg-amber-50 text-amber-700 border-amber-100",
        explain: (name) => `In ${name ? `the ${name} zone` : "a zone"} you manage`,
    },
    ZONE_AGENT: {
        label: "Zone agent",
        className: "bg-orange-50 text-orange-700 border-orange-100",
        explain: (name) => `Managed by ${name ?? "an agent"}, who works in your zone`,
    },
    NETWORK: {
        label: "Network",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        explain: () => "Visible through your agent network",
    },
};

export default function PropertySourceBadge({ source }: { source?: IPropertySource | null }) {
    if (!source) return null;
    const style = SOURCE_STYLES[source.type] ?? SOURCE_STYLES.NETWORK;
    const name = source.via?.name || null;
    // "Your referral" when the owner has no name on file, so the pill
    // never reads as a bare category with nothing after it.
    const text = name
        ? `${style.label} · ${name}`
        : source.type === "REFERRAL" ? "Your referral" : style.label;

    return (
        <span
            title={style.explain(name)}
            className={`inline-flex max-w-[200px] items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${style.className}`}
        >
            <span className="truncate">{text}</span>
        </span>
    );
}
