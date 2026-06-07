"use client";

import { IProperty } from "./types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { LuEye, LuTrash2, LuBed, LuBath, LuUsers } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { usePermissions } from "@/src/hooks/usePermissions";

interface PropertyCardProps {
  property: IProperty;
  onDelete: (property: IProperty) => void;
}

function formatRange(values: number[]): string {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length === 0) return "";
  const min = Math.min(...nonZero);
  const max = Math.max(...nonZero);
  return min === max ? `${min}` : `${min}–${max}`;
}

export default function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const router = useRouter();
  const { canDeleteProperty } = usePermissions();

  const prices = property?.units?.map((u: any) =>
    parseFloat(String(u.price_per_night || u.pricePerNight || 0))
  ) ?? [];
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const priceLabel = prices.length === 0
    ? "No units"
    : minPrice === maxPrice
      ? `₦${minPrice.toLocaleString()}/night`
      : `₦${minPrice.toLocaleString()} – ₦${maxPrice.toLocaleString()}/night`;

  const bedroomLabel = formatRange(
    (property?.units ?? []).map((u: any) => Number(u.bedroom_count ?? u.bedroomCount) || 0)
  );
  const bathroomLabel = formatRange(
    (property?.units ?? []).map((u: any) => Number(u.bathroom_count ?? u.bathroomCount) || 0)
  );
  const guestValues = (property?.units ?? [])
    .map((u: any) => Number(u.max_guests ?? u.maxGuests) || 0)
    .filter((n: number) => n > 0);
  const maxGuests = guestValues.length ? Math.max(...guestValues) : 0;
  const hasSpecs = !!(bedroomLabel || bathroomLabel || maxGuests);

  const totalReviews = (property as any)?.meta?.total_reviews ?? (property as any)?.total_reviews ?? 0;
  const averageRating = (property as any)?.meta?.average_rating ?? (property as any)?.average_rating ?? 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
      onClick={() => router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(property.id))}
    >
      {/* Top row: name + verification badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
          {property?.name ?? "--/--"}
        </h3>
        <span
          className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            property?.is_verified
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {property?.is_verified ? "Verified" : "Unverified"}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium">
            {property?.property_type ?? property?.propertyType ?? "--"}
          </span>
          <span className="truncate">
            {[property?.city, property?.state].filter(Boolean).join(", ") || "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {property?.units?.length ?? 0} unit{(property?.units?.length ?? 0) !== 1 ? "s" : ""}
          </span>
          <span className="font-medium text-gray-900">{priceLabel}</span>
        </div>
        {hasSpecs && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-600">
            {bedroomLabel && (
              <span className="inline-flex items-center gap-1">
                <LuBed size={12} /> {bedroomLabel} bed
              </span>
            )}
            {bathroomLabel && (
              <span className="inline-flex items-center gap-1">
                <LuBath size={12} /> {bathroomLabel} bath
              </span>
            )}
            {maxGuests > 0 && (
              <span className="inline-flex items-center gap-1">
                <LuUsers size={12} /> up to {maxGuests} guests
              </span>
            )}
          </div>
        )}
        {totalReviews > 0 && (
          <p className="text-[11px] text-gray-500">
            ★ {Number(averageRating).toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
          </p>
        )}
        {(property?.owner?.email || property?.owner?.profile?.firstName) && (
          <p className="text-[11px] text-gray-400 truncate">
            Owner: {property.owner.profile?.firstName ?? property.owner.email}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 border-t border-gray-100 pt-2 -mx-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(property.id));
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <LuEye size={14} /> View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(property.id)}?edit=true`
            );
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <HiOutlinePencilAlt size={14} /> Edit
        </button>
        {canDeleteProperty && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(property);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg"
          >
            <LuTrash2 size={14} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
