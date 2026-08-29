'use client'

import Image from "next/image";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import BreadCrumb from "@/src/components/breadcrumb";
import Loader from "@/src/components/loader";
import { formatDate, formatPoints } from "@/src/lib/utils";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { GetNetworkAgentProfile } from "@/src/lib/request-handlers/networkMgt";

const TIER_STYLE: Record<string, string> = {
    GOLD: "bg-yellow-50 text-yellow-700 border-yellow-300",
    SILVER: "bg-slate-100 text-slate-700 border-slate-300",
    BRONZE: "bg-orange-50 text-orange-700 border-orange-200",
};

const ZONE_ROLE_LABEL: Record<string, string> = {
    AREA_MANAGER: "Area Manager",
    REGIONAL_LEAD: "Regional Lead",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-900 break-words">
                {value === null || value === undefined || value === "" ? "—" : value}
            </p>
        </div>
    );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
            {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
        </div>
    );
}

/**
 * A zone member's profile, as seen by their Area Manager / Regional Lead.
 *
 * Modelled on the admin user detail, minus every control: no edit drawer, no
 * wallet actions, no KYC review, no tier override, no magic-OTP toggle. That is
 * not only a UI decision — the endpoint behind this returns no identity
 * documents, KYC state, wallet or payout data at all, because agents do not
 * hold `users.read`. There is nothing here to act on and nothing sensitive to
 * leak if the markup is inspected.
 *
 * A 403 means the agent sits outside the caller's zone tree; it is rendered as
 * a plain "not in your network" state rather than an error, because reaching it
 * usually means a stale link rather than a fault.
 */
export default function ZoneMemberProfile({
    backLink,
    backLabel,
}: {
    /**
     * Where the breadcrumb returns to. Defaults to the zone roster, but the same
     * view is reached from a mentorship mapping now, and sending a mentor back to
     * a roster they may not even have is wrong.
     */
    backLink?: string;
    backLabel?: string;
} = {}) {
    const params = useParams();
    const id = params?.id as string | undefined;
    const { data: agent, isLoading, isError, error } = GetNetworkAgentProfile(id);

    const status = (error as any)?.response?.status;
    const fullName =
        [agent?.first_name, agent?.last_name].filter(Boolean).join(" ") ||
        agent?.email ||
        "Unnamed agent";
    const tier = agent?.current_tier?.toUpperCase();

    return (
        <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Agent Profile"
                link_one={backLink ?? PAGE_ROUTES.dashboard.network.zoneMembers.base}
                link_one_name={backLabel ?? "Zone Members"}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader />
                </div>
            ) : isError || !agent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Icon
                        icon={status === 403 ? "mdi:lock-outline" : "mdi:account-off-outline"}
                        width="44"
                        className="text-gray-300 mb-3"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {status === 403 ? "Not in your network" : "Agent not found"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        {status === 403
                            ? "This agent is not in your network, so their profile is not available to you."
                            : "This agent may have been removed."}
                    </p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="mt-4 bg-gray-50/60 border border-gray-100 rounded-2xl p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                                {agent.profile_image ? (
                                    <Image
                                        src={agent.profile_image}
                                        alt={fullName}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-500">
                                        {fullName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-semibold text-gray-900 truncate">
                                        {fullName}
                                    </h1>
                                    {tier && (
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                TIER_STYLE[tier] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                            }`}
                                        >
                                            {tier.charAt(0) + tier.slice(1).toLowerCase()}
                                        </span>
                                    )}
                                    {agent.zone_roles?.map((r) => (
                                        <span
                                            key={r}
                                            className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                            {ZONE_ROLE_LABEL[r] ?? r}
                                        </span>
                                    ))}
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                            agent.is_active
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                    >
                                        {agent.is_active ? "Active" : "Inactive"}
                                    </span>
                                    {agent.average_rating && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                            <Icon icon="mdi:star" width="13" />
                                            {agent.average_rating}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1 truncate">{agent.email}</p>
                                {agent.bio && (
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                                        {agent.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="mt-6">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3">Network standing</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Stat
                                label="Points"
                                value={formatPoints(agent.points_30d)}
                                hint="Last 30 days"
                            />
                            <Stat label="Mentees" value={agent.mentee_count ?? 0} />
                            <Stat label="Listings" value={agent.properties_listed ?? 0} />
                            <Stat
                                label="Verified"
                                value={agent.properties_verified ?? 0}
                                hint="Of their listings"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="mt-6">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3">Details</h2>
                        <div className="border border-gray-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <Field label="Phone" value={agent.phone} />
                            <Field label="Street address" value={agent.address} />
                            <Field label="City" value={agent.city} />
                            <Field label="State" value={agent.state} />
                            <Field label="Country" value={agent.country} />
                            <Field
                                label="Gender"
                                value={
                                    agent.gender
                                        ? agent.gender.charAt(0) + agent.gender.slice(1).toLowerCase()
                                        : null
                                }
                            />
                            <Field
                                label="Date of birth"
                                value={agent.dob ? formatDate(agent.dob) : null}
                            />
                            <Field
                                label="Joined"
                                value={agent.joined_at ? formatDate(agent.joined_at) : null}
                            />
                            <Field label="Mentor" value={agent.mentor} />
                            <Field label="Referral code" value={agent.referral_code} />
                            <Field
                                label="Catalog handle"
                                value={agent.handle ? `@${agent.handle}` : null}
                            />
                            <Field
                                label="Account verified"
                                value={agent.is_verified ? "Yes" : "No"}
                            />
                        </div>
                    </div>

                    <p className="mt-6 text-xs text-gray-400 flex items-center gap-1.5">
                        <Icon icon="mdi:information-outline" width="14" />
                        Read-only. Identity documents (NIN, BVN), KYC status and wallet
                        details are not included — those are available to administrators
                        only.
                    </p>
                </>
            )}
        </div>
    );
}
