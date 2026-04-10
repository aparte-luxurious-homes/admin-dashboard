import { FaUsers, FaEnvelope, FaPhone } from "react-icons/fa";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import CollapsibleSection from "../../mobile/CollapsibleSection";
import { NormalizedBooking } from "./utils";

interface BookingOwnerAgentCardProps {
  booking: NormalizedBooking;
}

export default function BookingOwnerAgentCard({ booking }: BookingOwnerAgentCardProps) {
  const owner = booking.unit?.property?.owner;
  const agent = booking.unit?.property?.agent;

  if (!owner && !agent) return null;

  const renderPerson = (
    person: any,
    label: string,
    detailsRoute: (id: any) => string,
  ) => {
    const firstName = person.profile?.firstName || "";
    const lastName = person.profile?.lastName || "";
    const displayName = firstName ? `${firstName} ${lastName}`.trim() : person.email || "N/A";

    return (
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">{label}</h3>
        <div className="space-y-1.5">
          <p className="font-semibold text-zinc-800 text-sm">{displayName}</p>
          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
            <FaEnvelope className="text-[10px]" />
            <span className="truncate">{person.email || "Not provided"}</span>
          </p>
          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
            <FaPhone className="text-[10px]" />
            {person.phone || "Not provided"}
          </p>
          <Link
            href={detailsRoute(person.id)}
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
          >
            View Profile →
          </Link>
        </div>
      </div>
    );
  };

  return (
    <CollapsibleSection title="Owner & Agent" icon="solar:users-group-rounded-bold">
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-zinc-50 border-b border-zinc-200">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-800 flex items-center gap-2">
            <FaUsers />
            Owner & Agent
          </h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
          {owner && (
            <div className="pb-3 sm:pb-0 sm:pr-4">
              {renderPerson(owner, "Owner", PAGE_ROUTES.dashboard.userManagement.owners.details)}
            </div>
          )}
          {agent && (
            <div className="pt-3 sm:pt-0 sm:pl-4">
              {renderPerson(agent, "Agent", PAGE_ROUTES.dashboard.userManagement.agents.details)}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
