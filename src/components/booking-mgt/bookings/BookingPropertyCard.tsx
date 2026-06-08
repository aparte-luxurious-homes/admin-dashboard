import { IoLocationOutline } from "react-icons/io5";
import { FaHome, FaBed, FaUsers } from "react-icons/fa";
import { NormalizedBooking, getStatusColors } from "./utils";

interface BookingPropertyCardProps {
  booking: NormalizedBooking;
}

export default function BookingPropertyCard({ booking }: BookingPropertyCardProps) {
  const property = booking.property;
  const unit = booking.unit;
  const colors = getStatusColors(booking.status);

  if (!property && !unit) return null;

  const propertyName = property?.name || "Property Name Not Available";
  const address = property?.address || "Address not available";
  const city = property?.city;
  const state = property?.state;
  const propertyType =
    (property as any)?.propertyType ||
    (property as any)?.property_type ||
    "N/A";
  const isVerified =
    (property as any)?.isVerified ??
    (property as any)?.is_verified ??
    false;

  const bedroomCount = (unit as any)?.bedroom_count || unit?.bedroomCount || 0;
  const maxGuests = (unit as any)?.max_guests || unit?.maxGuests || 0;
  const livingRoomCount = (unit as any)?.living_room_count || unit?.livingRoomCount || 0;
  const bathroomCount = (unit as any)?.bathroom_count || unit?.bathroomCount || 0;
  const kitchenCount = (unit as any)?.kitchen_count || unit?.kitchenCount || 0;
  const unitVerified = unit?.isVerified || (unit as any)?.is_verified;

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}>
        <h2 className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}>
          <FaHome className="text-sm sm:text-base" />
          Property & Unit
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-800 mb-1">
              {propertyName}
            </h3>
            <div className="flex items-start gap-1.5 text-zinc-600 mb-3">
              <IoLocationOutline className="text-sm sm:text-base mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm">
                {address}
                {city && `, ${city}`}
                {state && `, ${state}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Type:</span>
                <span className="font-medium text-zinc-700">{propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Verified:</span>
                <span className={`font-medium ${isVerified ? "text-green-600" : "text-red-600"}`}>
                  {isVerified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:border-l lg:border-zinc-200 lg:pl-5">
            <h4 className="text-sm sm:text-base font-semibold text-zinc-800 mb-2">
              Unit: {unit?.name || "Unit Name Not Available"}
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <FaBed className="text-zinc-400 text-xs" />
                <span className="text-zinc-600">{bedroomCount} Bed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaUsers className="text-zinc-400 text-xs" />
                <span className="text-zinc-600">Max {maxGuests}</span>
              </div>
              <div className="text-zinc-600">{livingRoomCount} Living</div>
              <div className="text-zinc-600">{bathroomCount} Bath</div>
              <div className="text-zinc-600">{kitchenCount} Kitchen</div>
              <div className={`font-medium ${unitVerified ? "text-green-600" : "text-red-600"}`}>
                {unitVerified ? "Verified" : "Not Verified"}
              </div>
            </div>
            {unit?.description && (
              <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                {unit.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
