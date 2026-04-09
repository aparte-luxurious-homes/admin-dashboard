import { FaUser, FaEnvelope, FaPhone } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import Image from "next/image";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import CollapsibleSection from "../../mobile/CollapsibleSection";
import { NormalizedBooking, getStatusColors } from "./utils";

interface BookingGuestCardProps {
  booking: NormalizedBooking;
}

export default function BookingGuestCard({ booking }: BookingGuestCardProps) {
  const { user } = booking;
  const colors = getStatusColors(booking.status);

  if (!user) return null;

  const firstName = user.profile?.firstName || (user as any)?.firstName || "N/A";
  const lastName = user.profile?.lastName || (user as any)?.lastName || "";
  const profileImage = user.profile?.profileImage;

  return (
    <CollapsibleSection title="Guest Information" icon="solar:user-bold" colorClass={colors.bg}>
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}>
          <h2 className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}>
            <FaUser />
            Guest
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={`${firstName} ${lastName}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover w-16 h-16 sm:w-20 sm:h-20"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-200 rounded-lg flex items-center justify-center">
                  <FaUser className="text-2xl sm:text-3xl text-zinc-400" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-800">
                  {firstName} {lastName}
                </h3>
                <p className="text-xs text-zinc-500">ID: {user.id}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <FaEnvelope className="text-zinc-400 text-xs" />
                  <span className="text-zinc-700 truncate">{user.email || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaPhone className="text-zinc-400 text-xs" />
                  <span className="text-zinc-700">{user.phone || "Not provided"}</span>
                </div>
                {user.profile?.city && (
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <IoLocationOutline className="text-zinc-400 text-xs" />
                    <span className="text-zinc-700 text-xs">
                      {user.profile.city}
                      {user.profile.state && `, ${user.profile.state}`}
                    </span>
                  </div>
                )}
              </div>
              <Link
                href={PAGE_ROUTES.dashboard.userManagement.guests.details(user.id)}
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
              >
                View Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
