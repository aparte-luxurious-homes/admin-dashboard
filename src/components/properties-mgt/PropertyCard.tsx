"use client";

import { IProperty } from "./types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { LuEye, LuTrash2 } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";

interface PropertyCardProps {
  property: IProperty;
  onDelete: (property: IProperty) => void;
}

export default function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const router = useRouter();

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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(property);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg"
        >
          <LuTrash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
