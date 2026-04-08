"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { FaMapLocationDot, FaPlus, FaArrowLeftLong } from "react-icons/fa6";
import { TrashIcon } from "../../icons";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../../ui/customDropdown";
import {
  DocumentType, IAmenity,
  IProperty,
  IPropertyDocument, IPropertyMedia,
  IUpdateProperty,
  MediaType,
  PropertyType,
  PropertyVerificationStatus,
} from "../types";
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import CustomCheckbox from "../../ui/customCheckbox";
import MultipleChoice from "../../ui/MultipleChoice";
import { ALL_COUNTRIES } from "@/src/data/countries";
import { IoCloudUploadOutline } from "react-icons/io5";
import Image from "next/image";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { useDispatch } from "react-redux";
import CustomDropzone from "../../ui/CustomDropzone";
import { useFormik } from "formik";
import {
  DeleteProperty,
  FeatureProperty,
  UpdateProperty,
  UpdateBookingMode,
  UploadPropertyMedia,
  DeletePropertyMedia, UploadPropertyDocument, GetPropertyDocuments,
} from "@/src/lib/request-handlers/propertyMgt";
import { CreatePropertyUnit, UpdatePropertyUnit, DeletePropertyUnit, UploadPropertyUnitMedia } from "@/src/lib/request-handlers/unitMgt";
import { BookingMode } from "../types";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import Spinner from "../../ui/Spinner";
import { CreateAmenityForm } from "./CreatePropertyView";
import CustomModal from "../../ui/CustomModal";
import { useRouter, useSearchParams } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import UnitDrawer from "../create-wizard/UnitDrawer";
import { UnitFormValues, createEmptyUnit } from "../create-wizard/types";
import UnitCard from "../create-wizard/UnitCard";
import axios from "axios";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries: any = ["places"];

// ─────────────────────────────────────────────────────────────────────────────
// ADDRESS AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
function AddressAutocomplete({
  formik,
  isLoaded,
}: {
  formik: any;
  isLoaded: boolean;
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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    formik.setFieldValue("address", e.target.value);
  };

  const handleSelect = async (description: string) => {
    setValue(description, false);
    formik.setFieldValue("address", description);
    clearSuggestions();
    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      formik.setFieldValue("latitude", lat);
      formik.setFieldValue("longitude", lng);
      results[0].address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes("locality"))
          formik.setFieldValue("city", component.long_name);
        else if (types.includes("administrative_area_level_1"))
          formik.setFieldValue("state", component.long_name);
        else if (types.includes("country"))
          formik.setFieldValue("country", component.long_name);
      });
    } catch (error) {
      console.error("Error geocoding selection:", error);
    }
  };

    return (
        <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400 z-10">
                <SlLocationPin className="text-base sm:text-lg" />
            </div>
            <input
                value={value}
                onChange={handleInput}
                disabled={!isLoaded}
                placeholder={isLoaded ? "Search for an address..." : "Loading Map API..."}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            />
            {status === "OK" && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-lg sm:rounded-xl mt-1 shadow-lg max-h-48 sm:max-h-60 overflow-auto text-sm">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-zinc-50 cursor-pointer text-xs sm:text-sm font-medium border-b border-zinc-100 last:border-0"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function FormCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 mt-4 bg-white border border-zinc-100 rounded-2xl p-5 sm:p-6 md:p-7 space-y-5 shadow-sm">
      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
        <Icon icon={icon} className="text-base text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block ml-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditPropertyView({
  handleEditMode,
  propertyData,
  availableAmenities,
}: {
  handleEditMode: Dispatch<SetStateAction<boolean>>;
  propertyData: IProperty;
  availableAmenities: IAmenity[];
}) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { mutate, isPending } = UpdateProperty();
  const { mutate: deleteMutation, isPending: deleteIsPending } =
    DeleteProperty();
  const {
    mutate: uploadMedia,
    data: uploadData,
    isPending: uploadedMediaPending,
  } = UploadPropertyMedia();
  const { mutate: featureProperty } = FeatureProperty();
  const { mutate: updateBookingMode } = UpdateBookingMode();
  const { mutate: deleteMedia, isPending: deleteMediaPending } =
    DeletePropertyMedia();

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [media, setMedia] = useState<IPropertyMedia[]>(
    propertyData?.media ?? [],
  );
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const uploadRef = useRef<{ url: string; file: File }[]>([]);
  const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false);

    // Document upload state
    const { mutate: uploadDoc, isPending: docUploadPending } = UploadPropertyDocument();
    const { data: docsData, refetch: refetchDocs } = GetPropertyDocuments(propertyData.id);
    const [documents, setDocuments] = useState<IPropertyDocument[]>([]);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.UTILITY_BILL);

  // Unit management state
  const { mutate: createUnit, isPending: isCreatingUnit } = CreatePropertyUnit();
  const { mutate: updateUnit } = UpdatePropertyUnit();
  const { mutate: deleteUnit } = DeletePropertyUnit();
  const { mutate: uploadUnitMedia } = UploadPropertyUnitMedia();
  const [unitDrawerOpen, setUnitDrawerOpen] = useState(false);
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const [existingUnits, setExistingUnits] = useState<UnitFormValues[]>(
    (propertyData?.units ?? []).map((u) => ({
      _key: String(u.id),
      name: u.name ?? '',
      description: u.description ?? '',
      price_per_night: String(u.price_per_night ?? u.pricePerNight ?? ''),
      caution_fee: String(u.caution_fee ?? u.cautionFee ?? '0'),
      max_guests: u.max_guests ?? u.maxGuests ?? 1,
      count: u.count ?? 1,
      is_whole_property: u.is_whole_property ?? u.isWholeProperty ?? false,
      bedroom_count: u.bedroom_count ?? u.bedroomCount ?? 0,
      living_room_count: u.living_room_count ?? u.livingRoomCount ?? 0,
      kitchen_count: u.kitchen_count ?? u.kitchenCount ?? 0,
      bathroom_count: u.bathroom_count ?? u.bathroomCount ?? 0,
      amenityNames: (u.amenities ?? []).map((a: any) => a.name ?? a),
    }))
  );

  useEffect(() => {
    setExistingUnits(
      (propertyData?.units ?? []).map((u) => ({
        _key: String(u.id),
        name: u.name ?? '',
        description: u.description ?? '',
        price_per_night: String(u.price_per_night ?? u.pricePerNight ?? ''),
        caution_fee: String(u.caution_fee ?? u.cautionFee ?? '0'),
        max_guests: u.max_guests ?? u.maxGuests ?? 1,
        count: u.count ?? 1,
        is_whole_property: u.is_whole_property ?? u.isWholeProperty ?? false,
        bedroom_count: u.bedroom_count ?? u.bedroomCount ?? 0,
        living_room_count: u.living_room_count ?? u.livingRoomCount ?? 0,
        kitchen_count: u.kitchen_count ?? u.kitchenCount ?? 0,
        bathroom_count: u.bathroom_count ?? u.bathroomCount ?? 0,
        amenityNames: (u.amenities ?? []).map((a: any) => a.name ?? a),
      }))
    );
  }, [propertyData]);

  const handleSaveUnit = (unit: UnitFormValues) => {
    const unitAmenityIds = sortAmenities(availableAmenities ?? [], unit.amenityNames);
    const unitPayload = {
      name: unit.name,
      description: unit.description,
      price_per_night: String(unit.price_per_night),
      caution_fee: String(unit.caution_fee),
      max_guests: unit.max_guests,
      count: unit.count,
      is_whole_property: unit.is_whole_property,
      bedroom_count: unit.bedroom_count,
      living_room_count: unit.living_room_count,
      kitchen_count: unit.kitchen_count,
      bathroom_count: unit.bathroom_count,
      amenities: unitAmenityIds,
    };

    if (editingUnitIndex !== null) {
      const existingId = existingUnits[editingUnitIndex]._key;
      const isExistingUnit = propertyData?.units?.some((u) => String(u.id) === existingId);

      if (isExistingUnit) {
        updateUnit(
          { propertyId: propertyData.id, unitId: existingId, payload: unitPayload },
          {
            onSuccess: () => {
              setExistingUnits(prev => prev.map((u, i) => i === editingUnitIndex ? { ...unit, _key: existingId } : u));
              toast.success('Unit updated');
            },
            onError: () => toast.error('Failed to update unit'),
          },
        );
      } else {
        setExistingUnits(prev => prev.map((u, i) => i === editingUnitIndex ? { ...unit, _key: u._key } : u));
      }
    } else {
      createUnit(
        { propertyId: String(propertyData.id), payload: [unitPayload] },
        {
          onSuccess: (response) => {
            const created = response?.data?.data?.[0];
            if (created) {
              setExistingUnits(prev => [...prev, { ...unit, _key: String(created.id) }]);
            }
            toast.success('Unit added');
          },
          onError: () => toast.error('Failed to create unit'),
        },
      );
    }
    setUnitDrawerOpen(false);
    setEditingUnitIndex(null);
  };

  const handleDeleteUnit = (index: number) => {
    const unit = existingUnits[index];
    const isExistingUnit = propertyData?.units?.some((u) => String(u.id) === unit._key);

    if (isExistingUnit) {
      dispatch(
        showAlert({
          title: 'Delete Unit',
          description: `Are you sure you want to delete "${unit.name || 'this unit'}"? This action cannot be undone.`,
          onConfirm: () => {
            deleteUnit(
              { propertyId: propertyData.id, unitId: unit._key },
              {
                onSuccess: () => {
                  setExistingUnits(prev => prev.filter((_, i) => i !== index));
                  toast.success('Unit deleted');
                },
                onError: () => toast.error('Failed to delete unit'),
              },
            );
          },
        }),
      );
    } else {
      setExistingUnits(prev => prev.filter((_, i) => i !== index));
    }
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) console.error("Google Maps load error:", loadError);

  const sortAmenities = (amenities: IAmenity[], newAmenities: string[]) => {
    const sortedAmenities: any[] = [];
    const prevAmenityNames = amenities.map((a) => a.name);
    for (const amenity of newAmenities) {
      if (prevAmenityNames.includes(amenity)) {
        const pos = prevAmenityNames.indexOf(amenity);
        sortedAmenities.push(amenities[pos].id);
      }
    }
    return sortedAmenities;
  };

  const formik = useFormik({
    initialValues: {
      name: propertyData?.name ?? "",
      address: propertyData?.address ?? "",
      type: propertyData?.propertyType ?? PropertyType.DUPLEX,
      country: propertyData?.country ?? "Nigeria",
      state: propertyData?.state ?? "Lagos",
      city: propertyData?.city ?? "Ikeja",
      description: propertyData?.description ?? "",
      latitude: propertyData?.latitude ?? 0,
      longitude: propertyData?.longitude ?? 0,
      ownerId: propertyData?.ownerId ?? 0,
      units: String(propertyData?.units?.length) ?? "0",
      isVerified: propertyData?.isVerified ?? false,
      isFeatured: propertyData?.isFeatured ?? false,
      petsAllowed: propertyData?.isPetAllowed ?? false,
      partyAllowed: propertyData?.isPartyAllowed ?? propertyData?.is_party_allowed ?? false,
      rules: propertyData?.rules ?? '',
      bookingMode: (propertyData?.bookingMode ??
        propertyData?.booking_mode ??
        BookingMode.INSTANT) as BookingMode,
      amenities: propertyData?.amenities.map((el) => el.id),
      amenityNames: propertyData?.amenities.map((el) => el.name),
    },
    onSubmit: (values: any) => {
      const sortedAmenities = sortAmenities(
        availableAmenities,
        values.amenityNames,
      );
      if (values.isFeatured !== propertyData.isFeatured)
        featureProperty({ propertyId: propertyData.id });
      const currentBookingMode =
        propertyData.bookingMode ??
        propertyData.booking_mode ??
        BookingMode.INSTANT;
      if (values.bookingMode !== currentBookingMode)
        updateBookingMode({
          propertyId: propertyData.id,
          booking_mode: values.bookingMode,
        });

      const updatePayload: IUpdateProperty = {
        ...values,
        amenities: sortedAmenities,
        property_type: values.type,
        is_pet_allowed: values.petsAllowed,
        is_party_allowed: values.partyAllowed,
        rules: values.rules || undefined,
      };

      mutate(
        { propertyId: propertyData.id, payload: updatePayload },
        {
          onSuccess: () => {
            if (uploadedMedia.length > 0) {
              const formData = new FormData();
              uploadedMedia.forEach((file) =>
                formData.append("media_file", file),
              );
              formData.append("media_type", MediaType.IMAGE);
              formData.append("is_featured", "true");
              uploadMedia(
                { propertyId: propertyData.id, payload: formData },
                {
                  onSuccess: () => {
                    toast.success("Property updated with new images", {
                      duration: 6000,
                      style: { maxWidth: "500px", width: "max-content" },
                    });
                    removeParam("edit");
                    handleEditMode(false);
                  },
                  onError: (error: any) => {
                    toast.error(error?.response?.data?.detail || "Property updated but media upload failed", {
                      duration: 6000,
                      style: { maxWidth: "500px", width: "max-content" },
                    });
                    removeParam("edit");
                    handleEditMode(false);
                  },
                },
              );
            } else {
              toast.success("Property update successful", {
                duration: 6000,
                style: { maxWidth: "500px", width: "max-content" },
              });
              removeParam("edit");
              handleEditMode(false);
            }
          },
          onError: () =>
            toast.error("Something went wrong, please try again", {
              duration: 6000,
              style: { maxWidth: "500px", width: "max-content" },
            }),
        },
      );
    },
  });

  const handleGeocode = async () => {
    const { address, city, state, country } = formik.values;
    if (!address) {
      toast.error("Please enter a physical address first");
      return;
    }
    const fullAddress = `${address}, ${city}, ${state}, ${country}`;
    const toastId = toast.loading("Fetching coordinates...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        { params: { address: fullAddress, key: apiKey } },
      );
      if (response.data.status === "OK" && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        formik.setFieldValue("latitude", lat);
        formik.setFieldValue("longitude", lng);
        toast.success(`Coordinates found: ${lat}, ${lng}`, { id: toastId });
      } else {
        toast.error("Coordinates not found. Please enter manually.", {
          id: toastId,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch coordinates.", { id: toastId });
    }
  };

  const removeParam = (param: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const newQueryString = params.toString();
    router.push(newQueryString ? `?${newQueryString}` : pathname, {
      scroll: false,
    });
  };

  const handleDeleteImage = (id: string) => {
    dispatch(
      showAlert({
        title: "Delete image?",
        description: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: () => {
          deleteMedia(
            { propertyId: propertyData.id, mediaId: id },
            {
              onSuccess: () => toast.success("Image deleted successfully"),
              onError: (error: any) =>
                toast.error(
                  error?.response?.data?.detail || "Failed to delete image",
                ),
            },
          );
        },
      }),
    );
  };

  const handleDelete = () => {
    dispatch(
      showAlert({
        title: "Delete property?",
        description:
          "This action cannot be undone. This will permanently delete this property.",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: () => {
          deleteMutation(
            { propertyId: propertyData.id },
            {
              onSuccess: (response) => {
                removeParam("edit");
                toast.success(response?.data?.message, {
                  duration: 6000,
                  style: { maxWidth: "500px", width: "max-content" },
                });
                if (response.status === 204)
                  router.push(
                    PAGE_ROUTES.dashboard.propertyManagement.allProperties.base,
                  );
              },
            },
          );
        },
      }),
    );
  };

  useEffect(() => {
    if (uploadData?.data) {
      // Response shape: { data: { message, data: [{id, media_url, ...}, ...] }, status }
      const newMedia = uploadData.data?.data ?? uploadData.data;
      const mediaArray = Array.isArray(newMedia) ? newMedia : [newMedia];
      setMedia((prev) => [...prev, ...mediaArray]);
      if (uploadData.status === 201) {
        setUploadedMedia([]);
        uploadRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
        uploadRef.current = [];
      }
    }
  }, [uploadData]);

  const isInstant = formik.values.bookingMode === BookingMode.INSTANT;
  const isRequest = formik.values.bookingMode === BookingMode.REQUEST_TO_BOOK;

    useEffect(() => {
        const docs = docsData?.data?.data?.data ?? docsData?.data?.data ?? [];
        if (Array.isArray(docs)) setDocuments(docs);
    }, [docsData]);

  return (
    <div className="relative">
      {/* Unit Drawer */}
      <UnitDrawer
        isOpen={unitDrawerOpen}
        onClose={() => { setUnitDrawerOpen(false); setEditingUnitIndex(null); }}
        onSave={handleSaveUnit}
        editingUnit={editingUnitIndex !== null ? existingUnits[editingUnitIndex] : null}
        availableAmenities={availableAmenities ?? []}
        showAmenityForm={() => setShowAmenityForm(true)}
        userRole={user?.role}
      />

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
        <div>
          <button
            onClick={() => {
              removeParam("edit");
              handleEditMode(false);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/70 transition-colors mb-2"
          >
            <FaArrowLeftLong className="text-[10px]" />
            Back to details
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
            Edit property
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{propertyData.name}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteIsPending}
          title="Delete Property"
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100 flex-shrink-0"
        >
          {deleteIsPending ? (
            <Spinner />
          ) : (
            <>
              <Icon
                icon="solar:trash-bin-trash-bold-duotone"
                className="text-base"
              />{" "}
              Delete
            </>
          )}
        </button>
      </div>

      {/* Amenity Modal */}
      {showAmenityForm && (
        <CustomModal
          title="Create Amenity"
          onClose={() => setShowAmenityForm(false)}
          isOpen={showAmenityForm}
        >
          <CreateAmenityForm show={setShowAmenityForm} />
        </CustomModal>
      )}

      {/* ── Form ── */}
      <form
        id="edit-property-form"
        className=""
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit();
        }}
      >
        <div className="">
          {/* Basic Information */}
          <FormCard
            icon="solar:info-circle-bold-duotone"
            title="Basic Information"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field label="Property Name">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
                    <FaRegBuilding className="text-sm" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Sunset Villa"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium placeholder:text-zinc-400"
                  />
                </div>
              </Field>

              <Field label="Property Type">
                <CustomDropdown
                  selected={formik.values.type}
                  handleSelection={(val) => formik.setFieldValue("type", val)}
                  options={Object.values(PropertyType)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <div className="relative">
                    <textarea
                      id="description"
                      maxLength={300}
                      rows={4}
                      placeholder="Describe this property in a few sentences..."
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none placeholder:text-zinc-400 leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-zinc-400 bg-white px-1.5 py-0.5 rounded-md border border-zinc-100">
                      {formik.values.description.length}/300
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          </FormCard>

          {/* Location */}
          <FormCard
            icon="solar:map-point-bold-duotone"
            title="Location & Address"
          >
            <div className="space-y-5 mb-4 mt-4">
              <Field label="Physical Address">
                <AddressAutocomplete formik={formik} isLoaded={isLoaded} />
              </Field>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2 mb-4 mt-3">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Icon
                    icon="solar:lightbulb-bold-duotone"
                    className="text-sm"
                  />
                  Tips
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Search for an address to auto-fill coordinates.",
                    "Drag the map pin to refine location.",
                    "Add high-quality images to attract more guests.",
                  ].map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[11px] text-amber-700 leading-relaxed"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Map */}
              {isLoaded && (
                <div className="w-full h-52 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-zinc-200">
                  <GoogleMap
                    mapContainerStyle={{ height: "100%", width: "100%" }}
                    center={{
                      lat: formik.values.latitude || 6.5244,
                      lng: formik.values.longitude || 3.3792,
                    }}
                    zoom={formik.values.latitude ? 15 : 12}
                    onClick={(e: any) => {
                      if (e.latLng) {
                        formik.setFieldValue("latitude", e.latLng.lat());
                        formik.setFieldValue("longitude", e.latLng.lng());
                      }
                    }}
                  >
                    {formik.values.latitude && formik.values.longitude && (
                      <Marker
                        position={{
                          lat: formik.values.latitude,
                          lng: formik.values.longitude,
                        }}
                        draggable={true}
                        onDragEnd={(e: any) => {
                          if (e.latLng) {
                            formik.setFieldValue("latitude", e.latLng.lat());
                            formik.setFieldValue("longitude", e.latLng.lng());
                          }
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
              )}

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="0.0000"
                    value={formik.values.latitude}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="0.0000"
                    value={formik.values.longitude}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                  />
                </Field>
              </div>

              {/* Country / State / City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Country">
                  <CustomFilterDropdown
                    placeholder={formik.values.country}
                    options={Object.keys(ALL_COUNTRIES)}
                    handleSelection={(val) =>
                      formik.setFieldValue("country", val)
                    }
                    selected={formik.values.country}
                  />
                </Field>
                <Field label="State">
                  <CustomFilterDropdown
                    placeholder="Select state"
                    options={Object.keys(
                      ALL_COUNTRIES[formik.values.country] || {},
                    )}
                    handleSelection={(val) =>
                      formik.setFieldValue("state", val)
                    }
                    selected={
                      Object.keys(
                        ALL_COUNTRIES[formik.values.country] || {},
                      )?.includes(formik.values.state)
                        ? formik.values.state
                        : ""
                    }
                  />
                </Field>
                <Field label="City">
                  <CustomFilterDropdown
                    placeholder="Select city"
                    options={
                      ALL_COUNTRIES[formik.values.country]?.[
                        formik.values.state
                      ] || []
                    }
                    handleSelection={(val) => formik.setFieldValue("city", val)}
                    selected={
                      ALL_COUNTRIES[formik.values.country]?.[
                        formik.values.state
                      ]?.includes(formik.values.city)
                        ? formik.values.city
                        : ""
                    }
                  />
                </Field>
              </div>
            </div>
          </FormCard>

          {/* Amenities & Features */}
          <FormCard icon="solar:star-bold-duotone" title="Amenities & Features">
            <div className="space-y-5">
              {user?.role === UserRole.ADMIN && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAmenityForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <FaPlus className="text-[9px]" /> Add Amenity
                  </button>
                </div>
              )}

              <MultipleChoice
                options={availableAmenities?.map((am) => am.name) || []}
                selected={formik.values.amenityNames}
                onChange={(val) =>
                  formik.setFieldValue("amenityNames", [...val])
                }
              />

              {/* Flags */}
              <div className="pt-4 border-t border-zinc-50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  Flags
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <CustomCheckbox
                    label="Pets allowed"
                    checked={formik.values.petsAllowed}
                    onChange={(val) => formik.setFieldValue("petsAllowed", val)}
                  />
                  <CustomCheckbox
                    label="Parties allowed"
                    checked={formik.values.partyAllowed}
                    onChange={(val) => formik.setFieldValue("partyAllowed", val)}
                  />
                  {user?.role === UserRole.ADMIN && (
                    <CustomCheckbox
                      label="Featured"
                      checked={formik.values.isFeatured}
                      onChange={(val) =>
                        formik.setFieldValue("isFeatured", val)
                      }
                    />
                  )}
                  {user?.role === UserRole.ADMIN &&
                    propertyData?.verifications?.[0]?.status ===
                      PropertyVerificationStatus.VERIFIED && (
                      <CustomCheckbox
                        label="Verified"
                        checked={formik.values.isVerified}
                        onChange={(val) =>
                          formik.setFieldValue("isVerified", val)
                        }
                      />
                    )}
                </div>
              </div>

              {/* Property Rules */}
              <div className="pt-4 border-t border-zinc-50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Icon icon="solar:document-text-bold-duotone" className="text-sm text-primary" />
                  Property Rules
                </p>
                <div className="relative">
                  <textarea
                    id="rules"
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g., No loud music after 10pm. No smoking indoors..."
                    value={formik.values.rules}
                    onChange={formik.handleChange}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none text-sm"
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] font-bold text-zinc-400">
                    {formik.values.rules?.length || 0}/1000
                  </div>
                </div>
              </div>

              {/* Booking Mode */}
              <div className="pt-4 border-t border-zinc-50">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Icon
                    icon="solar:calendar-mark-bold-duotone"
                    className="text-sm text-primary"
                  />
                  Booking Mode
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      formik.setFieldValue("bookingMode", BookingMode.INSTANT)
                    }
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                                            ${isInstant ? "border-primary bg-primary/5" : "border-zinc-100 bg-white hover:border-zinc-200"}`}
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${isInstant ? "bg-primary/15" : "bg-zinc-100"}`}
                    >
                      <Icon
                        icon="solar:bolt-bold-duotone"
                        className={`text-base ${isInstant ? "text-primary" : "text-zinc-400"}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${isInstant ? "text-primary" : "text-zinc-700"}`}
                      >
                        Instant Book
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Guests book immediately, no approval needed.
                      </p>
                    </div>
                    {isInstant && (
                      <Icon
                        icon="solar:check-circle-bold-duotone"
                        className="text-primary text-base shrink-0 ml-auto mt-0.5"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      formik.setFieldValue(
                        "bookingMode",
                        BookingMode.REQUEST_TO_BOOK,
                      )
                    }
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                                            ${isRequest ? "border-violet-400 bg-violet-50" : "border-zinc-100 bg-white hover:border-zinc-200"}`}
                  >
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${isRequest ? "bg-violet-100" : "bg-zinc-100"}`}
                    >
                      <Icon
                        icon="solar:hand-shake-bold-duotone"
                        className={`text-base ${isRequest ? "text-violet-600" : "text-zinc-400"}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${isRequest ? "text-violet-700" : "text-zinc-700"}`}
                      >
                        Request to Book
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        You review and approve each request.
                      </p>
                    </div>
                    {isRequest && (
                      <Icon
                        icon="solar:check-circle-bold-duotone"
                        className="text-violet-600 text-base shrink-0 ml-auto mt-0.5"
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </FormCard>

          {/* Media */}
          <FormCard icon="solar:camera-bold-duotone" title="Property Gallery">
            <div className="space-y-4">
              {media.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100"
                    >
                      {(item.media_type || item.mediaType) === 'VIDEO' ? (
                        <video
                          src={item.media_url || item.mediaUrl || ""}
                          muted
                          preload="metadata"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Image
                          src={item.media_url || item.mediaUrl || "/png/placeholder.png"}
                          alt="Property media"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"
                      >
                        <Icon
                          icon="solar:trash-bin-trash-bold"
                          className="text-xs"
                        />
                      </button>
                      {item.isFeatured && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-[9px] font-bold text-white rounded-md shadow-sm uppercase tracking-wider">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <CustomDropzone
                onDrop={setUploadedMedia}
                multiple
                previewsRef={uploadRef}
              />

              {uploadedMedia.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const formData = new FormData();
                    uploadedMedia.forEach((file) =>
                      formData.append("media_file", file),
                    );
                    formData.append("media_type", MediaType.IMAGE);
                    formData.append("is_featured", "true");
                    uploadMedia(
                      { propertyId: propertyData.id, payload: formData },
                      {
                        onSuccess: () =>
                          toast.success("Media uploaded successfully", {
                            duration: 6000,
                            style: { maxWidth: "500px", width: "max-content" },
                          }),
                        onError: (error: any) =>
                          toast.error(
                            error?.response?.data?.detail || error?.response?.data?.message || "Upload failed",
                            {
                              duration: 6000,
                              style: {
                                maxWidth: "500px",
                                width: "max-content",
                              },
                            },
                          ),
                      },
                    );
                  }}
                  disabled={uploadedMediaPending}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {uploadedMediaPending ? (
                    <Spinner color="white" />
                  ) : (
                    <>
                      <Icon
                        icon="solar:upload-bold-duotone"
                        className="text-base"
                      />
                      Upload {uploadedMedia.length} image
                      {uploadedMedia.length > 1 ? "s" : ""}
                    </>
                  )}
                </button>
              )}
            </div>
          </FormCard>

                    {/* Documents Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                            <Icon icon="solar:file-text-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Ownership Documents
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500">Upload proof of ownership documents (PDF, JPG, PNG). These will be reviewed during verification.</p>

                        {/* Existing Documents */}
                        {documents.length > 0 && (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50 rounded-lg sm:rounded-xl border border-zinc-100 group">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <Icon icon="solar:file-text-bold-duotone" className="text-base sm:text-lg text-primary flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-zinc-800 truncate">{(doc.document_type as string)?.replace(/_/g, ' ')}</p>
                                                <p className="text-[8px] sm:text-[10px] text-zinc-400 capitalize">{doc.status?.toLowerCase()}</p>
                                            </div>
                                        </div>
                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 flex-shrink-0">
                                            <Icon icon="solar:eye-bold-duotone" className="text-sm sm:text-base" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload New Document */}
                        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-zinc-100">
                            <div className="space-y-1.5">
                                <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Document Type</label>
                                <CustomDropdown
                                    selected={selectedDocType}
                                    options={Object.values(DocumentType)}
                                    handleSelection={(val) => setSelectedDocType(val as DocumentType)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1.5 block">Select File</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('document_file', file);
                                            formData.append('document_type', selectedDocType);
                                            uploadDoc({
                                                propertyId: propertyData.id,
                                                payload: formData
                                            }, {
                                                onSuccess: () => {
                                                    toast.success('Document uploaded successfully');
                                                    refetchDocs();
                                                },
                                                onError: (err: any) => {
                                                    toast.error(err?.response?.data?.detail || 'Document upload failed');
                                                }
                                            });
                                            e.target.value = '';
                                        }
                                    }}
                                    disabled={docUploadPending}
                                    className="w-full text-xs sm:text-sm file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg sm:file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer disabled:opacity-50"
                                />
                                {docUploadPending && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                                        <Spinner /> Uploading document...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

          {/* Units Management Section */}
          <FormCard icon="solar:home-2-bold-duotone" title="Units">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Manage the rentable units for this property.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnitIndex(null);
                    setUnitDrawerOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  <FaPlus className="text-[9px]" />
                  Add Unit
                </button>
              </div>

              {existingUnits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {existingUnits.map((unit, index) => (
                    <UnitCard
                      key={unit._key}
                      unit={unit}
                      index={index}
                      onEdit={() => {
                        setEditingUnitIndex(index);
                        setUnitDrawerOpen(true);
                      }}
                      onDelete={() => handleDeleteUnit(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-zinc-200 rounded-xl py-8 flex flex-col items-center text-center">
                  <Icon icon="solar:box-minimalistic-bold-duotone" className="text-3xl text-zinc-300 mb-2" />
                  <p className="text-xs text-zinc-400">No units yet. Add units to make this property bookable.</p>
                </div>
              )}
            </div>
          </FormCard>
        </div>

        <div className="">
          {/* <div className="bg-zinc-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 relative z-10">Property Owner</p>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icon icon="solar:user-bold-duotone" className="text-lg text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                    {propertyData.owner?.profile?.firstName} {propertyData.owner?.profile?.lastName}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">{propertyData.owner?.email ?? 'Owner'}</p>
                            </div>
                        </div>
                    </div> */}

          {/* Save / Cancel */}
          <div className="bg-white border mb-3 border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <button
              form="edit-property-form"
              type="submit"
              disabled={isPending || uploadedMediaPending}
              className="w-full h-11 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary/20"
            >
              {isPending ? (
                <Spinner />
              ) : (
                <>
                  <Icon icon="solar:check-read-bold" className="text-base" />{" "}
                  Save changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                removeParam("edit");
                handleEditMode(false);
              }}
              className="w-full h-10 border border-zinc-200 text-zinc-500 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* ── Mobile sticky bottom action bar (hidden on lg+) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-4 py-3 flex items-center gap-3 shadow-xl">
        <button
          type="button"
          onClick={() => {
            removeParam("edit");
            handleEditMode(false);
          }}
          className="h-11 px-5 border border-zinc-200 text-zinc-500 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider flex-shrink-0"
        >
          Cancel
        </button>
        <button
          form="edit-property-form"
          type="submit"
          disabled={isPending || uploadedMediaPending}
          className="flex-1 h-11 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary/20"
        >
          {isPending ? (
            <Spinner />
          ) : (
            <>
              <Icon icon="solar:check-read-bold" className="text-base" /> Save
              changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
