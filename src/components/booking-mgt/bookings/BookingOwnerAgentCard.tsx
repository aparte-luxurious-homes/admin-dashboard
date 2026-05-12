import { FaUsers, FaEnvelope, FaPhone } from "react-icons/fa";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import CollapsibleSection from "../../mobile/CollapsibleSection";
import { NormalizedBooking, BookingPerson } from "./utils";

interface BookingOwnerAgentCardProps {
  booking: NormalizedBooking;
}

export default function BookingOwnerAgentCard({ booking }: BookingOwnerAgentCardProps) {
  const owner = booking.unit?.property?.owner;
  const agent = booking.unit?.property?.agent;
  const bookingReferrer = booking.bookingReferrer;
  const signupReferrer = booking.signupReferrer;
  const booker = booking.booker;

  if (!owner && !agent && !bookingReferrer && !signupReferrer && !booker) return null;

  const sameId = (a: { id?: string | number | null } | null | undefined, b: { id?: string | number | null } | null | undefined) =>
    !!a && !!b && a.id != null && b.id != null && String(a.id) === String(b.id);

  // Hide the referrer rows when they duplicate the property's agent — common
  // case when an agent books on behalf of a guest on a property they're
  // already assigned to.
  const showBookingReferrer = !!bookingReferrer && !sameId(bookingReferrer, agent);
  const showSignupReferrer =
    !!signupReferrer
    && !sameId(signupReferrer, agent)
    && !sameId(signupReferrer, bookingReferrer);
  // Only surface the on-behalf creator when it adds new information:
  //   - the booker isn't the guest themselves (i.e., actually on-behalf), AND
  //   - they aren't already shown as agent / referrer above.
  const showBooker =
    !!booker
    && String(booker.id) !== String(booking.userId)
    && !sameId(booker, agent)
    && !sameId(booker, bookingReferrer);

  const detailsRouteForRole = (role: string | null | undefined): ((id: any) => string) | null => {
    switch ((role || "").toUpperCase()) {
      case "AGENT":
        return PAGE_ROUTES.dashboard.userManagement.agents.details;
      case "OWNER":
        return PAGE_ROUTES.dashboard.userManagement.owners.details;
      case "ADMIN":
      case "SUPER_ADMIN":
      case "OPERATIONS_ADMIN":
      case "SUPPORT_ADMIN":
      case "ANALYST":
        return PAGE_ROUTES.dashboard.userManagement.admins.details;
      case "GUEST":
        return PAGE_ROUTES.dashboard.userManagement.guests.details;
      default:
        return null;
    }
  };

  const renderPerson = (
    person: any,
    label: string,
    detailsRoute: ((id: any) => string) | null,
    sublabel?: string | null,
  ) => {
    const firstName = person.profile?.firstName || "";
    const lastName = person.profile?.lastName || "";
    const displayName = firstName ? `${firstName} ${lastName}`.trim() : person.email || "N/A";
    const referralCode = person.profile?.referralCode || person.referralCode;

    return (
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 flex items-center gap-2">
          <span>{label}</span>
          {sublabel && (
            <span className="text-[10px] font-medium normal-case text-zinc-400">
              {sublabel}
            </span>
          )}
        </h3>
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
          {referralCode && (
            <p className="text-[11px] text-zinc-500">
              Referral code: <span className="font-mono font-semibold text-zinc-700">{referralCode}</span>
            </p>
          )}
          {detailsRoute && (
            <Link
              href={detailsRoute(person.id)}
              className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
            >
              View Profile →
            </Link>
          )}
        </div>
      </div>
    );
  };

  const cells: { person: BookingPerson | NonNullable<typeof owner>; label: string; route: ((id: any) => string) | null; sublabel?: string }[] = [];
  if (owner) cells.push({ person: owner, label: "Owner", route: PAGE_ROUTES.dashboard.userManagement.owners.details });
  if (agent) cells.push({ person: agent, label: "Agent", route: PAGE_ROUTES.dashboard.userManagement.agents.details, sublabel: "Property's assigned agent" });
  if (showBookingReferrer && bookingReferrer) {
    cells.push({
      person: bookingReferrer,
      label: "Booking Referrer",
      route: detailsRouteForRole(bookingReferrer.role),
      sublabel: booking.referralCodeUsed ? `Code: ${booking.referralCodeUsed}` : "Per-booking commission",
    });
  }
  if (showSignupReferrer && signupReferrer) {
    cells.push({
      person: signupReferrer,
      label: "Signup Referrer",
      route: detailsRouteForRole(signupReferrer.role),
      sublabel: "Lifetime referrer of the guest",
    });
  }
  if (showBooker && booker) {
    cells.push({
      person: booker,
      label: "Booked by",
      route: detailsRouteForRole(booker.role),
      sublabel: "Submitted the booking on the guest's behalf",
    });
  }

  return (
    <CollapsibleSection title="Attribution" icon="solar:users-group-rounded-bold">
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-zinc-50 border-b border-zinc-200">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-800 flex items-center gap-2">
            <FaUsers />
            Owner, Agent &amp; Referrers
          </h2>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cells.map((cell, idx) => (
            <div key={idx}>
              {renderPerson(cell.person, cell.label, cell.route, cell.sublabel)}
            </div>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
