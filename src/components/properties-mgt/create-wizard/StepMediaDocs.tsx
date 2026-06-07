"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import CustomDropzone from "@/components/ui/CustomDropzone";
import CustomDropdown from "@/components/ui/customDropdown";
import { DocumentType } from "../types";
import {
  CATEGORY_LABELS,
  CategorizedMedia,
  OPTIONAL_PROPERTY_CATEGORIES,
  PropertyMediaCategory,
  REQUIRED_PROPERTY_CATEGORIES,
  UnitFormValues,
  getRequiredCategoriesForUnit,
  getOptionalCategoriesForUnit,
  getCategoryCountSuffix,
} from "./types";

interface StepMediaDocsProps {
  propertyMedia: CategorizedMedia;
  setPropertyMedia: Dispatch<SetStateAction<CategorizedMedia>>;
  docFiles: { file: File; type: DocumentType }[];
  setDocFiles: Dispatch<SetStateAction<{ file: File; type: DocumentType }[]>>;
  units: UnitFormValues[];
  unitMediaByCategory: Record<string, CategorizedMedia>;
  setUnitMediaByCategory: Dispatch<
    SetStateAction<Record<string, CategorizedMedia>>
  >;
}

function CategorySlot({
  category,
  label,
  files,
  onChange,
  accept,
  isVideo,
  required,
}: {
  category: PropertyMediaCategory;
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  isVideo?: boolean;
  required?: boolean;
}) {
  const covered = files.length > 0;
  return (
    <div
      className={`border rounded-xl p-3 space-y-2 transition-colors ${covered ? "border-emerald-300 bg-emerald-50/40" : required ? "border-zinc-200 bg-white" : "border-dashed border-zinc-200 bg-zinc-50/50"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            icon={
              covered
                ? "solar:check-circle-bold"
                : isVideo
                  ? "solar:videocamera-record-bold-duotone"
                  : "solar:gallery-add-bold-duotone"
            }
            className={`text-base ${covered ? "text-emerald-500" : "text-zinc-400"}`}
          />
          <span className="text-xs font-bold text-zinc-800">{label}</span>
        </div>
        {required && !covered && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
            Required
          </span>
        )}
        {covered && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
            {files.length} file{files.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <input
        type="file"
        multiple
        accept={accept || "image/*"}
        onChange={(e) => {
          const picked = Array.from(e.target.files || []);
          if (picked.length === 0) return;
          onChange([...files, ...picked]);
          e.target.value = "";
        }}
        className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
        aria-label={`Upload ${label}`}
      />
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-white border border-zinc-100 rounded-lg px-2 py-1"
            >
              <span
                className="text-[10px] text-zinc-600 truncate mr-2"
                title={f.name}
              >
                {f.name}
              </span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-red-500 text-xs hover:text-red-600"
                aria-label={`Remove ${f.name}`}
              >
                <Icon icon="solar:trash-bin-trash-bold" className="text-xs" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryGrid({
  title,
  icon,
  values,
  onChange,
  requiredCats,
  optionalCats,
  hasWalkthrough,
  countSuffix,
}: {
  title: string;
  icon: string;
  values: CategorizedMedia;
  onChange: (next: CategorizedMedia) => void;
  requiredCats: PropertyMediaCategory[];
  optionalCats: PropertyMediaCategory[];
  hasWalkthrough?: boolean;
  /** Optional per-category multiplier for the label, e.g. 3 → "Bedroom × 3". */
  countSuffix?: (cat: PropertyMediaCategory) => number;
}) {
  const [showOptional, setShowOptional] = useState(false);
  const setCategory = (cat: PropertyMediaCategory, files: File[]) => {
    onChange({ ...values, [cat]: files });
  };
  const labelFor = (cat: PropertyMediaCategory) => {
    const base = CATEGORY_LABELS[cat];
    const n = countSuffix?.(cat) ?? 0;
    return n > 1 ? `${base} × ${n}` : base;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Icon icon={icon} className="text-lg text-primary" />
          {title}
        </h3>
        {optionalCats.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            {showOptional ? "Hide" : "Show"} optional slots
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requiredCats.map((cat) => (
          <CategorySlot
            key={cat}
            category={cat}
            label={labelFor(cat)}
            files={values[cat] ?? []}
            onChange={(files) => setCategory(cat, files)}
            required
          />
        ))}
      </div>

      {hasWalkthrough && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon
              icon="solar:videocamera-record-bold-duotone"
              className="text-base text-primary"
            />
            <span>
              <span className="font-bold text-zinc-700">Walkthrough video</span>{" "}
              (strongly encouraged — listings with videos get approved faster
              and convert better)
            </span>
          </div>
          <CategorySlot
            category={PropertyMediaCategory.WALKTHROUGH_VIDEO}
            label="Walkthrough video"
            files={values[PropertyMediaCategory.WALKTHROUGH_VIDEO] ?? []}
            onChange={(files) =>
              setCategory(PropertyMediaCategory.WALKTHROUGH_VIDEO, files)
            }
            accept="video/*"
            isVideo
          />
        </div>
      )}

      {showOptional && optionalCats.length > 0 && (
        <div className="pt-3 border-t border-zinc-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 ml-1">
            Optional
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {optionalCats.map((cat) => (
              <CategorySlot
                key={cat}
                category={cat}
                label={labelFor(cat)}
                files={values[cat] ?? []}
                onChange={(files) => setCategory(cat, files)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StepMediaDocs({
  propertyMedia,
  setPropertyMedia,
  docFiles,
  setDocFiles,
  units,
  unitMediaByCategory,
  setUnitMediaByCategory,
}: StepMediaDocsProps) {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    DocumentType.UTILITY_BILL,
  );

  // First whole-property unit (if any) drives the expanded property gallery.
  // Wizard already prevents multiple whole-property units, so taking the first is safe.
  const wholePropertyUnit = units.find((u) => u.is_whole_property);

  // Property gallery categories. When a whole-property unit exists, its interior
  // categories fold into the property's gallery (so the user has somewhere to put
  // bedroom/living-room/etc. photos). Deduped against the existing property cats.
  const propertyGalleryRequired = useMemo<PropertyMediaCategory[]>(() => {
    const base = [...REQUIRED_PROPERTY_CATEGORIES];
    if (wholePropertyUnit) {
      for (const cat of getRequiredCategoriesForUnit(wholePropertyUnit)) {
        if (!base.includes(cat)) base.push(cat);
      }
    }
    return base;
  }, [wholePropertyUnit]);

  const propertyGalleryOptional = useMemo<PropertyMediaCategory[]>(() => {
    const base = [...OPTIONAL_PROPERTY_CATEGORIES];
    if (wholePropertyUnit) {
      for (const cat of getOptionalCategoriesForUnit(wholePropertyUnit)) {
        if (!base.includes(cat)) base.push(cat);
      }
    }
    return base;
  }, [wholePropertyUnit]);

  // Aggregate coverage across the property + every unit.
  // Per-unit required categories are derived from each unit's room counts.
  // Whole-property units don't carry their own media — coverage comes entirely from the
  // (now-expanded) property gallery.
  const coverage = useMemo(() => {
    const unitRequirements = units.map((u) =>
      u.is_whole_property ? [] : getRequiredCategoriesForUnit(u),
    );
    const total =
      propertyGalleryRequired.length +
      unitRequirements.reduce((sum, cats) => sum + cats.length, 0);
    let covered = 0;
    for (const cat of propertyGalleryRequired) {
      if ((propertyMedia[cat] ?? []).length > 0) covered += 1;
    }
    units.forEach((u, idx) => {
      const bucket = unitMediaByCategory[u._key] ?? {};
      for (const cat of unitRequirements[idx]) {
        if ((bucket[cat] ?? []).length > 0) covered += 1;
      }
    });
    return {
      covered,
      total,
      percent: total === 0 ? 0 : Math.round((covered / total) * 100),
    };
  }, [propertyMedia, units, unitMediaByCategory, propertyGalleryRequired]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Coverage checklist */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Icon
              icon="solar:checklist-minimalistic-bold-duotone"
              className="text-lg text-primary"
            />
            Coverage checklist
          </h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${coverage.covered === coverage.total ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
          >
            {coverage.covered} / {coverage.total} covered
          </span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${coverage.covered === coverage.total ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${coverage.percent}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-500">
          Guests trust listings that show every room. Missing slots are flagged
          for admin review \u2014 listings can still be created, but coverage
          gaps slow down verification.
        </p>
      </div>

      {/* Property-level media.
                When any unit is marked whole-property, the property gallery doubles as
                that unit's media. Fold its required interior categories (Living Room,
                Kitchen, Bedroom, Bathroom — driven by the unit's room counts) into the
                property gallery's required slots, and its optionals (Dining, Toilet,
                Balcony) into the property optionals. Otherwise the property gallery
                stays exterior-only. */}
      <CategoryGrid
        title="Property gallery"
        icon="solar:home-2-bold-duotone"
        values={propertyMedia}
        onChange={setPropertyMedia}
        requiredCats={propertyGalleryRequired}
        optionalCats={propertyGalleryOptional}
        countSuffix={(cat) =>
          wholePropertyUnit ? getCategoryCountSuffix(wholePropertyUnit, cat) : 0
        }
        hasWalkthrough
      />

      {/* Per-unit media \u2014 required categories are derived from the unit's room counts.
                A unit with 0 living rooms doesn't get asked for a Living Room photo, etc.
                Whole-property units skip this entirely; the property gallery above doubles as their media. */}
      {units.length > 0 && (
        <div className="space-y-6">
          {units.map((unit) =>
            unit.is_whole_property ? (
              <div
                key={unit._key}
                className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-4 text-xs text-zinc-500 leading-relaxed"
              >
                <span className="font-bold text-zinc-700">
                  {unit.name || "Unnamed unit"}
                </span>{" "}
                is the whole property \u2014 upload its bedroom, living room,
                kitchen, and bathroom photos in the{" "}
                <span className="font-bold text-zinc-700">
                  Property gallery
                </span>{" "}
                above (interior slots have been added based on this unit&apos;s
                room counts).
              </div>
            ) : (
              <CategoryGrid
                key={unit._key}
                title={`${unit.name || "Unnamed unit"} \u2014 photos`}
                icon="solar:buildings-bold-duotone"
                values={unitMediaByCategory[unit._key] ?? {}}
                onChange={(next) =>
                  setUnitMediaByCategory((prev) => ({
                    ...prev,
                    [unit._key]: next,
                  }))
                }
                requiredCats={getRequiredCategoriesForUnit(unit)}
                optionalCats={getOptionalCategoriesForUnit(unit)}
                countSuffix={(cat) => getCategoryCountSuffix(unit, cat)}
                hasWalkthrough
              />
            ),
          )}
        </div>
      )}

      {/* Ownership Documents */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Icon
            icon="solar:file-text-bold-duotone"
            className="text-xl text-primary"
          />
          Ownership documents
        </h3>
        <p className="text-xs text-zinc-500">
          Upload proof of ownership documents (PDF, JPG, PNG). These will be
          reviewed during verification.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Document Type
            </label>
            <CustomDropdown
              selected={selectedDocType}
              options={Object.values(DocumentType)}
              handleSelection={(val) => setSelectedDocType(val as DocumentType)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-2 block">
              Select file
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setDocFiles((prev) => [
                    ...prev,
                    { file, type: selectedDocType },
                  ]);
                  e.target.value = "";
                }
              }}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
            />
          </div>

          {docFiles.length > 0 && (
            <div className="space-y-2">
              {docFiles.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      icon="solar:file-text-bold-duotone"
                      className="text-lg text-primary flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-800 truncate">
                        {doc.file.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {doc.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDocFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Icon
                      icon="solar:trash-bin-trash-bold"
                      className="text-sm"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
