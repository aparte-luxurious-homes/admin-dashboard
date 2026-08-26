"use client";

import { useEffect, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import { FaPlus } from "react-icons/fa6";
import { Icon } from "@iconify/react";
import { useFormik } from "formik";
import { GoogleMap, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import CustomDropdown from "@/components/ui/customDropdown";
import AdjustableFilterDropdown from "@/components/ui/AdjustableFilterDropdown";
import CustomCheckbox from "@/components/ui/customCheckbox";
import MultipleChoice from "@/components/ui/MultipleChoice";
import CustomModal from "@/components/ui/CustomModal";
import { IAmenity, PropertyType } from "../types";
import { CreateAmenityForm } from "../all-properties/CreatePropertyView";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import { UserRole } from "@/src/lib/enums";
import { PropertyFormValues } from "./types";
import { validatePropertyName } from "./nameValidator";

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function extractAddressComponents(components: AddressComponent[] = []) {
  const findByType = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name || "";

  // City fallback chain: Nigerian addresses often omit `locality` and use
  // `administrative_area_level_2` or `sublocality_*` instead.
  const city =
    findByType("locality") ||
    findByType("administrative_area_level_2") ||
    findByType("sublocality_level_1") ||
    findByType("sublocality") ||
    findByType("postal_town");

  return {
    street_number: findByType("street_number"),
    street_name: findByType("route"),
    postal_code: findByType("postal_code"),
    city,
    state: findByType("administrative_area_level_1"),
    country: findByType("country"),
  };
}

function applyGeocodeResultToForm(
  formik: any,
  result: any,
  description?: string,
) {
  const parts = extractAddressComponents(result?.address_components || []);
  if (description) {
    formik.setFieldValue("address", description);
  } else if (result?.formatted_address) {
    formik.setFieldValue("address", result.formatted_address);
  }
  formik.setFieldValue("google_place_id", result?.place_id ?? "");
  formik.setFieldValue("geocode_raw", result ?? null);
  formik.setFieldValue("street_number", parts.street_number);
  formik.setFieldValue("street_name", parts.street_name);
  formik.setFieldValue("postal_code", parts.postal_code);
  if (parts.city) formik.setFieldValue("city", parts.city);
  if (parts.state) formik.setFieldValue("state", parts.state);
  // Country is locked to Nigeria — never overwrite from Google.
  // A fresh geocode means the user must re-confirm the pin.
  formik.setFieldValue("pin_confirmed", false);
}

function AddressAutocomplete({
  formik,
  isLoaded,
  setAddressUsage,
  setAddress,
}: {
  formik: any;
  isLoaded: boolean;
  setAddressUsage: (text: string) => void;
  setAddress: (text: string) => void;
}) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "ng" } },
    debounce: 300,
    defaultValue: formik.values.address,
  });

  useEffect(() => {
    if (formik.values.address !== value) {
      setValue(formik.values.address, false);
    }
    setAddressUsage("This address cannot be used for another property");
    setAddress(formik.values.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.address]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    formik.setFieldValue("address", e.target.value);
  };

  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      formik.setFieldValue("latitude", lat);
      formik.setFieldValue("longitude", lng);
      applyGeocodeResultToForm(formik, results[0], description);
    } catch (error) {
      console.error("Error geocoding selection:", error);
    }
  };

  return (
    <div className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400 z-10">
        <SlLocationPin className="text-lg" />
      </div>
      <input
        value={value}
        onChange={handleInput}
        disabled={!isLoaded || !ready}
        placeholder={
          !isLoaded
            ? "Loading Map API..."
            : !ready
              ? "Initializing..."
              : "Search for an address..."
        }
        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
      />
      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
          {(data as any[]).map(
            ({
              place_id,
              description,
            }: {
              place_id: string;
              description: string;
            }) => (
              <li
                key={place_id}
                onClick={() => handleSelect(description)}
                className="px-4 py-3 hover:bg-zinc-50 cursor-pointer text-sm font-medium border-b border-zinc-100 last:border-0"
              >
                {description}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

interface StepPropertyDetailsProps {
  formik: ReturnType<typeof useFormik<PropertyFormValues>>;
  availableAmenities: IAmenity[];
  availableEventTypes?: { id: string; name: string }[];
  userRole?: string;
  isLoaded: boolean;
}

export default function StepPropertyDetails({
  formik,
  availableAmenities,
  availableEventTypes = [],
  userRole,
  isLoaded,
}: StepPropertyDetailsProps) {
  const [isNewOwner, setIsNewOwner] = useState<boolean>(true);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>("");
  const [showAmenityForm, setShowAmenityForm] = useState(false);

  const { data: userList, isLoading: usersLoading } = GetAllUsers(
    1,
    100,
    ownerSearchTerm,
    UserRole.OWNER,
  );

  const isAdmin =
    userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  const isAgent = userRole === UserRole.AGENT;
  const showOwnerSection = isAdmin || isAgent;

  const [addressUsage, setAddressUsage] = useState("");
  const [address, setAddress] = useState("");

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const results = await getGeocode({ location: { lat, lng } });
      if (results[0]) {
        applyGeocodeResultToForm(formik, results[0]);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const nameError = formik.values.name
    ? validatePropertyName(formik.values.name)
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {showAmenityForm && (
        <CustomModal
          title="Create Amenity"
          onClose={() => setShowAmenityForm(false)}
          isOpen={showAmenityForm}
        >
          <CreateAmenityForm show={setShowAmenityForm} />
        </CustomModal>
      )}

      {/* Basic Information */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Icon
            icon="solar:info-circle-bold-duotone"
            className="text-lg text-primary"
          />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Property Name <span className="text-primary">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                <FaRegBuilding />
              </div>
              <input
                id="name"
                type="text"
                placeholder="e.g. Aparte Luxury Suites"
                value={formik.values.name}
                onChange={formik.handleChange}
                className={`w-full bg-zinc-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium ${nameError ? "border-red-300" : "border-zinc-200"}`}
              />
            </div>
            {nameError && (
              <p className="text-[11px] font-semibold text-red-500 ml-1">
                {nameError}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Property Type <span className="text-primary">*</span>
            </label>
            <CustomDropdown
              selected={formik.values.property_type}
              handleSelection={(val) =>
                formik.setFieldValue("property_type", val)
              }
              options={Object.values(PropertyType)}
              formatLabel={(val) => val || "Select property type"}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                maxLength={300}
                rows={3}
                placeholder="Provide a compelling description of this property..."
                value={formik.values.description}
                onChange={formik.handleChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none"
              />
              <div className="absolute bottom-2 right-3 text-[10px] font-bold text-zinc-400">
                {formik.values.description.length}/300
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Assignment */}
      {showOwnerSection && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Icon
                icon="mdi:account-supervisor"
                className="text-lg text-primary"
              />
              Owner Assignment
            </h3>
            <div className="flex items-center gap-1 p-0.5 bg-zinc-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setIsNewOwner(false);
                  formik.setFieldValue("owner_email", "");
                  formik.setFieldValue("owner_name", "");
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${!isNewOwner ? "bg-white shadow-sm text-primary" : "text-zinc-500"}`}
              >
                EXISTING
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewOwner(true);
                  setSelectedOwner(null);
                  formik.setFieldValue("ownerId", 0);
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${isNewOwner ? "bg-white shadow-sm text-primary" : "text-zinc-500"}`}
              >
                NEW OWNER
              </button>
            </div>
          </div>

          {!isNewOwner ? (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Search Existing Owner
              </label>
              <AdjustableFilterDropdown
                placeholder="Search by name or email..."
                options={
                  (
                    userList?.data?.data?.data ??
                    userList?.data?.data?.items ??
                    []
                  )
                    ?.map((u: any) => u.email)
                    .filter(Boolean) ?? []
                }
                handleSelection={(val) => {
                  const users =
                    userList?.data?.data?.data ??
                    userList?.data?.data?.items ??
                    [];
                  const selected = users.find((u: any) => u.email === val);
                  setOwnerSearchTerm(selected?.email || val);
                  setSelectedOwner(selected);
                  formik.setFieldValue("ownerId", selected?.id);
                }}
                searchTerm={ownerSearchTerm}
                setSearchTerm={setOwnerSearchTerm}
                isLoading={usersLoading}
              />
              {selectedOwner && (
                <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Icon icon="mdi:account-check" className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      {selectedOwner.profile?.firstName ?? "Owner"}{" "}
                      {selectedOwner.profile?.lastName ?? ""}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {selectedOwner.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                  Owner Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                    <Icon icon="mdi:account-box-outline" />
                  </div>
                  <input
                    id="owner_name"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={formik.values.owner_name}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                  Owner Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                    <Icon icon="mdi:email-outline" />
                  </div>
                  <input
                    id="owner_email"
                    type="email"
                    placeholder="e.g. jane@example.com"
                    value={formik.values.owner_email}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                  Owner Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                    <Icon icon="mdi:phone-outline" />
                  </div>
                  <input
                    id="owner_phoneNumber"
                    type="email"
                    placeholder="e.g. 090 0000 0000"
                    value={formik.values.owner_phoneNumber}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Icon
            icon="solar:map-point-bold-duotone"
            className="text-lg text-primary"
          />
          Location & Address
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Physical Address <span className="text-primary">*</span>
            </label>
            {isLoaded ? (
              <AddressAutocomplete
                setAddress={setAddress}
                setAddressUsage={setAddressUsage}
                formik={formik}
                isLoaded={isLoaded}
              />
            ) : (
              <div className="relative group w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 z-10">
                  <SlLocationPin className="text-lg" />
                </div>
                <input
                  disabled
                  placeholder="Loading Map API..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none font-medium text-zinc-400 cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {isLoaded && (
            <div className="w-full h-[250px] rounded-xl overflow-hidden border border-zinc-200">
              <GoogleMap
                mapContainerStyle={{ height: "100%", width: "100%" }}
                center={{
                  lat: formik.values.latitude ?? 6.5244,
                  lng: formik.values.longitude ?? 3.3792,
                }}
                zoom={formik.values.latitude != null ? 15 : 12}
                onClick={(e: any) => {
                  if (e.latLng) {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    formik.setFieldValue("latitude", lat);
                    formik.setFieldValue("longitude", lng);
                    reverseGeocode(lat, lng);
                  }
                }}
              >
                {formik.values.latitude != null &&
                  formik.values.longitude != null && (
                    <Marker
                      position={{
                        lat: formik.values.latitude,
                        lng: formik.values.longitude,
                      }}
                      draggable
                      onDragEnd={(e: any) => {
                        if (e.latLng) {
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          formik.setFieldValue("latitude", lat);
                          formik.setFieldValue("longitude", lng);
                          formik.setFieldValue("pin_confirmed", false);
                          reverseGeocode(lat, lng);
                        }
                      }}
                    />
                  )}
              </GoogleMap>
            </div>
          )}

          {isLoaded &&
            formik.values.latitude != null &&
            formik.values.longitude != null && (
              <div
                className={`flex items-start gap-3 p-3 rounded-xl border ${formik.values.pin_confirmed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
              >
                <Icon
                  icon={
                    formik.values.pin_confirmed
                      ? "solar:check-circle-bold"
                      : "solar:map-point-bold-duotone"
                  }
                  className={`text-xl shrink-0 ${formik.values.pin_confirmed ? "text-emerald-500" : "text-amber-500"}`}
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-zinc-700">
                    {formik.values.pin_confirmed
                      ? "Pin location confirmed."
                      : "Drag the map pin to the exact property entrance, then confirm."}
                  </p>
                  {!formik.values.pin_confirmed && (
                    <button
                      type="button"
                      onClick={() =>
                        formik.setFieldValue("pin_confirmed", true)
                      }
                      disabled={!formik.values.google_place_id}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm pin location
                    </button>
                  )}
                </div>
              </div>
            )}

          {address !== "" && (
            <p className="text-red-500 my-2">{addressUsage}</p>
          )}
          {/* Long and Lat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="0.0000"
                value={formik.values.latitude ?? ""}
                onChange={formik.handleChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="0.0000"
                value={formik.values.longitude ?? ""}
                onChange={formik.handleChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Landmark / Nearest Bus Stop (optional)
            </label>
            <input
              id="landmark"
              type="text"
              maxLength={255}
              placeholder="e.g. Opposite Shoprite, next to First Bank"
              value={formik.values.landmark}
              onChange={formik.handleChange}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
            />
          </div>

          {/* State & City — populated by Google Places autocomplete; editable for corrections.
                        Country is locked to Nigeria. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                State <span className="text-primary">*</span>
              </label>
              <input
                id="state"
                type="text"
                placeholder="E.g. Lagos"
                value={formik.values.state}
                onChange={formik.handleChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                City <span className="text-primary">*</span>
              </label>
              <input
                id="city"
                type="text"
                placeholder="E.g. Ikeja"
                value={formik.values.city}
                onChange={formik.handleChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Amenities & Features */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Icon
              icon="solar:star-bold-duotone"
              className="text-lg text-primary"
            />
            Amenities & Features
          </h3>
          {(userRole === UserRole.ADMIN ||
            userRole === UserRole.SUPER_ADMIN) && (
            <button
              type="button"
              onClick={() => setShowAmenityForm(true)}
              className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
            >
              <FaPlus className="text-[8px]" /> ADD CUSTOM
            </button>
          )}
        </div>

        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
          <MultipleChoice
            options={availableAmenities?.map((am) => am.name) ?? []}
            selected={formik.values.amenities}
            onChange={(val) => formik.setFieldValue("amenities", [...val])}
          />
          <div className="pt-4 mt-4 border-t border-zinc-100 space-y-3">
            <CustomCheckbox
              label="Pets are allowed in this property"
              checked={formik.values.is_pet_allowed}
              onChange={(val: boolean) =>
                formik.setFieldValue("is_pet_allowed", val)
              }
            />
            <CustomCheckbox
              label="Parties are allowed in this property"
              checked={formik.values.is_party_allowed}
              onChange={(val: boolean) =>
                formik.setFieldValue("is_party_allowed", val)
              }
            />
          </div>
        </div>
      </div>

      {formik.values.property_type === PropertyType.EVENT_CENTRE && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Icon
                icon="solar:calendar-bold-duotone"
                className="text-lg text-primary"
              />
              Event Types
            </h3>
          </div>
          <p className="text-xs text-zinc-500">
            Select all event types that this venue can accommodate.
          </p>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
            <MultipleChoice
              options={availableEventTypes.map((et) => et.name)}
              selected={formik.values.event_types}
              onChange={(val) => formik.setFieldValue("event_types", [...val])}
            />
          </div>
        </div>
      )}

      {/* Property Rules */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Icon
            icon="solar:document-text-bold-duotone"
            className="text-lg text-primary"
          />
          Property Rules
        </h3>
        <p className="text-xs text-zinc-500">
          Optional. Add any rules or guidelines guests should follow during
          their stay.
        </p>
        <div className="relative">
          <textarea
            id="rules"
            maxLength={1000}
            rows={4}
            placeholder="e.g., No loud music after 10pm. No smoking indoors. Check-out by 12pm..."
            value={formik.values.rules}
            onChange={formik.handleChange}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none text-sm"
          />
          <div className="absolute bottom-2 right-3 text-[10px] font-bold text-zinc-400">
            {formik.values.rules.length}/1000
          </div>
        </div>
      </div>
    </div>
  );
}
