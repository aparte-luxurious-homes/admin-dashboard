"use client";

import {
  AmenityOption,
  AmenityPickerScope,
  outOfScopeHint,
  outOfScopeTag,
} from "./amenitySelection";

/**
 * The amenity chips on the edit screens. Same look as ui/MultipleChoice, plus
 * a tag on a chip that is attached to the listing but belongs to the other
 * kind of listing. See amenitySelection.ts for why those are offered at all:
 * the owner must be able to see one and take it off on purpose, where the
 * old picker hid it and the save then dropped it.
 *
 * Real buttons, not <p>s: these sit inside the edit form, and type="button"
 * is what keeps a click from submitting it.
 */
export default function AmenityPicker({
  options,
  selected = [],
  onChange,
  scope,
}: {
  options: AmenityOption[];
  selected?: string[];
  onChange: (next: string[]) => void;
  scope: AmenityPickerScope;
}) {
  const toggle = (name: string) =>
    onChange(
      selected.includes(name)
        ? selected.filter((item) => item !== name)
        : [...selected, name],
    );

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.name);
        return (
          <button
            type="button"
            key={option.name}
            aria-pressed={isSelected}
            title={option.outOfScope ? outOfScopeHint(scope) : undefined}
            onClick={() => toggle(option.name)}
            className={`w-fit h-12 flex items-center justify-center gap-1.5 p-5 border rounded-lg transition-all cursor-pointer font-medium
              ${
                isSelected
                  ? "bg-primary/90 text-white border-primary/90"
                  : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
              }
              ${option.outOfScope ? "border-dashed" : ""}
            `}
          >
            {option.name}
            {option.outOfScope && (
              <span
                className={`text-[10px] font-normal ${
                  isSelected ? "text-white/80" : "text-zinc-400"
                }`}
              >
                {outOfScopeTag(scope)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
