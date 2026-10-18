"use client";

import { Icon } from "@iconify/react";
import { UnitFormValues } from "./types";
import UnitCard from "./UnitCard";
import { venueCopy } from "../venue";

interface StepUnitsProps {
  units: UnitFormValues[];
  onAddUnit: () => void;
  onEditUnit: (index: number) => void;
  onDeleteUnit: (index: number) => void;
  onDiscontinueListing: () => void;
  /** Event centres list halls and spaces rather than units. */
  isVenue?: boolean;
}

const STAY_TIPS = [
  'Use descriptive names like "Deluxe Ocean View Suite" instead of "Unit 1"',
  "Set competitive pricing by researching similar properties in your area",
  "Add caution fees for high-value units to protect against damages",
  "Accurately list room counts and amenities to set the right expectations",
];

const VENUE_TIPS = [
  'Name each space the way guests know it, e.g. "Main Banquet Hall" or "Garden"',
  "Offer every way the hall is really hired: by the day, half day or hour",
  "Set opening hours and the gap you need to clean up between events",
  "Give honest seated and standing capacities; guests filter on them",
];

export default function StepUnits({
  units,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  onDiscontinueListing,
  isVenue = false,
}: StepUnitsProps) {
  const copy = venueCopy(isVenue);
  // Once any unit is marked "whole property", the listing represents the entire property
  // as a single bookable entity — adding a second unit makes no sense.
  const hasWholePropertyUnit = units.some((u) => u.is_whole_property);
  const addDisabled = hasWholePropertyUnit;
  const addDisabledHint = isVenue
    ? "This listing is hired as a whole venue; remove or untoggle that to add a hall."
    : "This listing has a whole-property unit; remove or untoggle it to add another unit.";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start w-full justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Icon
                icon="solar:widget-3-bold-duotone"
                className="text-xl text-primary"
              />
              {isVenue ? "Halls & Spaces" : "Property Units"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {isVenue
                ? "Add each hall or space guests can hire, with its rates, hours and capacity. You can add more after creation."
                : "Add rentable units to your property. You can add units now or after creation."}
            </p>
          </div>

          <button
            onClick={onDiscontinueListing}
            className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-primary/10"
          >
            <p className="text-xs text-zinc-500">Discontinue Listing</p>
            <Icon
              icon="solar:trash-bin-trash-outline"
              className="text-xl text-primary"
            />
          </button>
        </div>

        {units.length > 0 && (
          <button
            type="button"
            onClick={onAddUnit}
            disabled={addDisabled}
            title={addDisabled ? addDisabledHint : undefined}
            className="h-9 px-6 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            <Icon icon="solar:add-circle-bold" className="text-sm" />
            Add {copy.Unit}
          </button>
        )}
      </div>

      {/* Empty State */}
      {units.length === 0 && (
        <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <Icon
              icon="solar:buildings-bold-duotone"
              className="text-3xl text-zinc-400"
            />
          </div>
          <h4 className="text-sm font-bold text-zinc-700 mb-1">
            No {copy.units} added yet
          </h4>
          <p className="text-xs text-zinc-500 mb-6 max-w-sm">
            {isVenue
              ? "Halls are the spaces guests hire for their events: a main hall, a VIP lounge, a garden. Add at least one to start receiving bookings."
              : "Units represent the individual bookable spaces within your property. Add at least one unit to start receiving bookings."}
          </p>
          <button
            type="button"
            onClick={onAddUnit}
            className="h-10 px-6 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Icon icon="solar:add-circle-bold" className="text-sm" />
            Add Your First {copy.Unit}
          </button>
        </div>
      )}

      {/* Units Grid */}
      {units.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit, index) => (
            <UnitCard
              key={unit._key}
              unit={unit}
              index={index}
              isVenue={isVenue}
              onEdit={() => onEditUnit(index)}
              onDelete={() => onDeleteUnit(index)}
            />
          ))}

          {/* Add Another Card — hidden when a whole-property unit exists */}
          {!addDisabled && (
            <button
              type="button"
              onClick={onAddUnit}
              className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group min-h-[120px]"
            >
              <Icon
                icon="solar:add-circle-bold-duotone"
                className="text-2xl text-zinc-400 group-hover:text-primary"
              />
              <span className="text-xs font-semibold text-zinc-500 group-hover:text-primary">
                Add Another {copy.Unit}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Tips Card */}
      <div className="bg-zinc-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -mr-24 -mt-24" />
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 relative z-10">
          <Icon
            icon="solar:lightbulb-bolt-bold-duotone"
            className="text-lg text-primary"
          />
          Tips for Great Listings
        </h4>
        <ul className="space-y-2 relative z-10">
          {(isVenue ? VENUE_TIPS : STAY_TIPS).map((tip) => (
            <li
              key={tip}
              className="text-xs text-zinc-400 flex items-start gap-2"
            >
              <Icon
                icon="solar:check-circle-bold"
                className="text-primary text-sm mt-0.5 flex-shrink-0"
              />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
