"use client";

import { useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { IAmenity, ICreatePropertyUnit, IProperty, MediaType } from "../types";
import MultipleChoice from "@/components/ui/MultipleChoice";
import { FaArrowLeftLong, FaPlus, FaMinus } from "react-icons/fa6";
import CustomDropzone from "@/components/ui/CustomDropzone";
import { useFormik } from "formik";
import { useAuth } from "@/src/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import {
  GetAmenities,
  GetSingleProperty,
} from "@/src/lib/request-handlers/propertyMgt";
import { fixedAmenities } from "@/src/data/amenities";
import CustomModal from "@/components/ui/CustomModal";
import {
  CreatePropertyUnit,
  UploadPropertyUnitMedia,
} from "@/src/lib/request-handlers/unitMgt";
import { CreateAmenityForm } from "../all-properties/CreatePropertyView";
import { IoBedOutline } from "react-icons/io5";
import { TbCurrencyNaira, TbToolsKitchen } from "react-icons/tb";
import { PiBathtub } from "react-icons/pi";
import { LuSofa, LuUsers } from "react-icons/lu";
import { UserRole } from "@/src/lib/enums";
import { formatMoney } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import Link from "next/link";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import CustomCheckbox from "@/components/ui/customCheckbox";

// Define the type for form values
type FormValues = {
  name: string;
  description: string;
  price_per_night: string;
  max_guests: number;
  count: number;
  is_whole_property: boolean;
  bedroom_count: number;
  living_room_count: number;
  kitchen_count: number;
  bathroom_count: number;
  caution_fee: string;
  amenities: never[];
  amenityNames: never[];
};

// Define the type for configuration fields
type ConfigField = {
  id: keyof Pick<
    FormValues,
    | "bedroom_count"
    | "kitchen_count"
    | "bathroom_count"
    | "living_room_count"
    | "max_guests"
  >;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

// Clean Number Input Component
const NumberInput = ({
  field,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  field: ConfigField;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      setDisplayValue("");
      return;
    }

    const cleanedValue =
      rawValue.replace(/^0+/, "").replace(/[^\d]/g, "") || "0";

    if (cleanedValue) {
      const numValue = parseInt(cleanedValue, 10);

      if (!isNaN(numValue)) {
        const clampedValue = Math.min(Math.max(numValue, min), max);
        setDisplayValue(clampedValue.toString());
        onChange(clampedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseInt(displayValue, 10) || 0;
    const clampedValue = Math.min(Math.max(numValue, min), max);
    setDisplayValue(clampedValue.toString());
    onChange(clampedValue);
  };

  const increment = () => {
    const newValue = Math.min((parseInt(displayValue, 10) || 0) + 1, max);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max((parseInt(displayValue, 10) || 0) - 1, min);
    setDisplayValue(newValue.toString());
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
          isFocused ? "text-primary" : "text-zinc-400"
        }`}
      >
        <field.icon className="text-base" />
      </div>

      <input
        id={field.id}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className={`w-full bg-zinc-50 border rounded-lg pl-9 pr-16 py-2.5 outline-none transition-all font-semibold text-zinc-900 text-sm ${
          isFocused
            ? "border-primary ring-1 ring-primary/20"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      />

      {/* Compact increment/decrement buttons */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1">
        <button
          type="button"
          onClick={decrement}
          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
        >
          <FaMinus className="text-[8px]" />
        </button>
        <button
          type="button"
          onClick={increment}
          className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          <FaPlus className="text-[8px]" />
        </button>
      </div>
    </div>
  );
};

// Compact Count Input Component
const CountInput = ({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      setDisplayValue("");
      return;
    }

    const cleanedValue =
      rawValue.replace(/^0+/, "").replace(/[^\d]/g, "") || "0";

    if (cleanedValue) {
      const numValue = parseInt(cleanedValue, 10);

      if (!isNaN(numValue)) {
        const clampedValue = Math.min(Math.max(numValue, min), max);
        setDisplayValue(clampedValue.toString());
        onChange(clampedValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseInt(displayValue, 10) || 0;
    const clampedValue = Math.min(Math.max(numValue, min), max);
    setDisplayValue(clampedValue.toString());
    onChange(clampedValue);
  };

  return (
    <input
      id="count"
      type="text"
      inputMode="numeric"
      pattern="\d*"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={`w-full bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none transition-all font-semibold text-zinc-900 text-center text-sm ${
        isFocused
          ? "border-primary ring-1 ring-primary/20"
          : "border-zinc-200 hover:border-zinc-300"
      }`}
    />
  );
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  label,
  value,
  suffix = "",
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
}) => (
  <div className="bg-zinc-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-zinc-200 hover:border-primary/30 transition-colors">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
        <Icon className="text-sm sm:text-base text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  </div>
);

export default function CreateUnitView({
  propertyId,
}: {
  propertyId: string | number;
}) {
  const { user } = useAuth();
  const { mutate, isPending } = CreatePropertyUnit();
  const { data: fetchedAmenites } = GetAmenities();
  const { mutate: uploadMedia } = UploadPropertyUnitMedia();
  const { data: propertyData, isLoading } = GetSingleProperty(propertyId);

  const [availableAmenities, setAvailableAmenities] =
    useState<IAmenity[]>(fixedAmenities);
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const uploadRef = useRef<{ url: string; file: File }[]>([]);
  const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false);
  const [loadedProperty, setLoadedProperty] = useState<IProperty>();
  const router = useRouter();

  // Define max values per field based on business rules
  const maxValues = {
    bedroom_count: 20,
    kitchen_count: 5,
    bathroom_count: 15,
    living_room_count: 10,
    max_guests: 50,
    count: 100,
  };

  const sortAmenities = (amenities: IAmenity[], newAmeities: string[]) => {
    const sortedAmenities = [];
    let prevAmenityNames = amenities.map((a) => a.name);
    for (const amenity of newAmeities) {
      if (prevAmenityNames.includes(amenity)) {
        const pos = prevAmenityNames.indexOf(amenity);
        sortedAmenities.push(amenities[pos].id);
      }
    }
    return sortedAmenities;
  };

  useEffect(() => {
    setAvailableAmenities(fetchedAmenites?.data?.data);
  }, [fetchedAmenites]);

  useEffect(() => {
    setLoadedProperty(propertyData?.data?.data);
  }, [propertyData]);

  const formik = useFormik<FormValues>({
    initialValues: {
      name: "",
      description: "",
      price_per_night: "",
      max_guests: 0,
      count: 0,
      is_whole_property: false,
      bedroom_count: 0,
      living_room_count: 0,
      kitchen_count: 0,
      bathroom_count: 0,
      caution_fee: "0.00",
      amenities: [],
      amenityNames: [],
    },

    onSubmit: (values) => {
      const sortedAmenities = sortAmenities(
        availableAmenities,
        values.amenityNames,
      );

      const payload: ICreatePropertyUnit[] = [
        {
          ...values,
          amenities: sortedAmenities,
          price_per_night: String(values.price_per_night),
          caution_fee: String(values.caution_fee),
        },
      ];

      mutate(
        {
          propertyId: String(propertyId),
          payload,
        },
        {
          onSuccess: (response) => {
            const unitId = response?.data?.data[0]?.id;
            const formData = new FormData();

            if (unitId) {
              if (uploadedMedia.length > 0) {
                uploadedMedia?.forEach((file) => {
                  formData.append("media_file", file);
                });

                formData.append("media_type", MediaType.IMAGE);
                formData.append("is_featured", "true");

                uploadMedia(
                  {
                    propertyId: String(propertyId),
                    unitId,
                    payload: formData,
                  },
                  {
                    onError: (error: any) =>
                      toast.error(
                        error?.response?.data?.detail ||
                          error?.response?.data?.message ||
                          "Media upload failed",
                      ),
                  },
                );
              }

              toast.success("Property unit created successfully");
              router.push(
                PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(
                  propertyId,
                  unitId,
                ),
              );
            }
          },
          onError: (error: any) => {
            console.error("Error creating property unit:", error);
            toast.error(
              error?.response?.data?.message ||
                "Failed to create property unit. Please try again later.",
            );
          },
        },
      );
    },
  });

  const configFields: ConfigField[] = [
    {
      id: "bedroom_count",
      label: "Bedrooms",
      icon: IoBedOutline,
      description: "No. of bedrooms",
    },
    {
      id: "kitchen_count",
      label: "Kitchens",
      icon: TbToolsKitchen,
      description: "No. of kitchens",
    },
    {
      id: "bathroom_count",
      label: "Bathrooms",
      icon: PiBathtub,
      description: "No. of bathrooms",
    },
    {
      id: "living_room_count",
      label: "Living Rooms",
      icon: LuSofa,
      description: "No. of living rooms",
    },
    {
      id: "max_guests",
      label: "Max Guests",
      icon: LuUsers,
      description: "Max occupancy",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(
                  propertyId,
                )}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <FaArrowLeftLong className="text-[10px]" />
                <span>Back to {loadedProperty?.name || "Property"}</span>
              </Link>
              <div className="h-4 w-px bg-zinc-200" />
              <h1 className="text-sm font-semibold text-zinc-900">
                Create New Unit
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-500">
                Step 1 of 2
              </span>
              <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <StatCard
            icon={IoBedOutline}
            label="Bedrooms"
            value={formik.values.bedroom_count}
          />
          <StatCard
            icon={TbToolsKitchen}
            label="Kitchens"
            value={formik.values.kitchen_count}
          />
          <StatCard
            icon={PiBathtub}
            label="Bathrooms"
            value={formik.values.bathroom_count}
          />
          <StatCard
            icon={LuSofa}
            label="Living Rooms"
            value={formik.values.living_room_count}
          />
          <StatCard
            icon={LuUsers}
            label="Guests"
            value={formik.values.max_guests}
            suffix=""
          />
        </div>
      </div>
      {showAmenityForm && (
        <CustomModal
          title="Create Custom Amenity"
          onClose={() => setShowAmenityForm(false)}
          isOpen={showAmenityForm}
        >
          <CreateAmenityForm show={setShowAmenityForm} />
        </CustomModal>
      )}

      <form
        id="create-unit-form"
        className="max-w-7xl mx-auto px-4 pb-6"
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit();
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Form Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Basic Information */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon
                    icon="solar:info-circle-bold-duotone"
                    className="text-base text-primary"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Basic Information
                  </h3>
                  <p className="text-[10px] text-zinc-500">Essential details</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="name"
                    className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                  >
                    Unit Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <FaRegBuilding className="text-sm" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g., Luxury Suite"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                  >
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      maxLength={300}
                      rows={3}
                      placeholder="Brief description..."
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-[8px] font-medium bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                      {formik.values.description.length}/300
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Configuration */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon
                    icon="solar:widget-3-bold-duotone"
                    className="text-base text-primary"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Unit Configuration
                  </h3>
                  <p className="text-[10px] text-zinc-500">Layout & capacity</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {configFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label
                      htmlFor={field.id}
                      className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                    >
                      {field.label}
                    </label>
                    <NumberInput
                      field={field}
                      value={formik.values[field.id]}
                      onChange={(newValue) =>
                        formik.setFieldValue(field.id, newValue)
                      }
                      min={0}
                      max={maxValues[field.id]}
                    />
                    <p className="text-[7px] text-zinc-400 ml-1">
                      {field.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-3 mt-1 border-t border-zinc-100 flex items-center justify-between">
                <CustomCheckbox
                  label="This unit represents the whole property"
                  checked={formik.values.is_whole_property}
                  onChange={(val: boolean) =>
                    formik.setFieldValue("is_whole_property", val)
                  }
                />
                <div className="w-1/5">
                  <label
                    htmlFor="count"
                    className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                  >
                    Units
                  </label>
                  <CountInput
                    value={formik.values.count}
                    onChange={(newValue) =>
                      formik.setFieldValue("count", newValue)
                    }
                    min={0}
                    max={maxValues.count}
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Icon
                      icon="solar:star-bold-duotone"
                      className="text-base text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Amenities
                    </h3>
                    <p className="text-[10px] text-zinc-500">Select features</p>
                  </div>
                </div>

                {user?.role === UserRole.ADMIN && (
                  <button
                    type="button"
                    onClick={() => setShowAmenityForm(true)}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-medium rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1"
                  >
                    <FaPlus className="text-[8px]" />
                    ADD CUSTOM
                  </button>
                )}
              </div>

              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
                <MultipleChoice
                  options={availableAmenities?.map((el) => el.name)}
                  selected={formik.values.amenityNames}
                  onChange={(val) =>
                    formik.setFieldValue("amenityNames", [...val])
                  }
                />
              </div>
            </div>

            {/* Media */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon
                    icon="solar:camera-bold-duotone"
                    className="text-base text-primary"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Gallery & Media
                  </h3>
                  <p className="text-[10px] text-zinc-500">Upload photos</p>
                </div>
              </div>

              <div className="w-full">
                <CustomDropzone
                  onDrop={setUploadedMedia}
                  multiple
                  previewsRef={uploadRef}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Pricing Card */}
            <div className="bg-zinc-900 rounded-xl p-4 text-white border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Icon
                    icon="solar:tag-bold-duotone"
                    className="text-base text-primary"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Pricing</h3>
                  <p className="text-[10px] text-zinc-400">Set your rates</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="price_per_night"
                    className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                  >
                    Price Per Night
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <TbCurrencyNaira className="text-base text-zinc-500" />
                    </div>
                    <input
                      id="price_per_night"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formik.values.price_per_night}
                      onChange={(e) =>
                        formik.setFieldValue("price_per_night", e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 focus:bg-white/10 focus:border-primary/50 outline-none transition-all font-semibold text-base text-white placeholder:text-zinc-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="caution_fee"
                    className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1"
                  >
                    Caution Fee
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <TbCurrencyNaira className="text-base text-zinc-500" />
                    </div>
                    <input
                      id="caution_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formik.values.caution_fee}
                      onChange={(e) =>
                        formik.setFieldValue(
                          "caution_fee",
                          String(e.target.value),
                        )
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 focus:bg-white/10 focus:border-primary/50 outline-none transition-all font-semibold text-base text-white placeholder:text-zinc-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider mb-2 text-center">
                    Total Package
                  </p>
                  <div className="flex items-center justify-center gap-1 bg-white/5 rounded-lg py-3">
                    <TbCurrencyNaira className="text-xl text-primary" />
                    <span className="text-2xl font-bold tracking-tight">
                      {formatMoney(
                        Number(formik.values.price_per_night) +
                          Number(formik.values.caution_fee),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white border border-zinc-200 rounded-xl p-3 space-y-2">
              <button
                form="create-unit-form"
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <Spinner />
                ) : (
                  <>
                    <Icon icon="solar:check-read-bold" className="text-sm" />
                    CREATE UNIT
                  </>
                )}
              </button>

              <Link
                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(
                  propertyId,
                )}
              >
                <div className="w-full h-9 border border-zinc-200 text-zinc-600 text-[10px] font-medium rounded-lg hover:bg-zinc-50 transition-all uppercase tracking-wider flex items-center justify-center">
                  Cancel
                </div>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
