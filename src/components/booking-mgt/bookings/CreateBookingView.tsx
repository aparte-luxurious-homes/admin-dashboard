"use client";

import { PriceTagIcon, UnitIcon, UsersIcon } from "../../icons";
import {
  formatDate,
  formatDateToYYYYMMDD,
  formatMoney,
  getDayDifference,
} from "@/src/lib/utils";
import { useFormik } from "formik";
import Image from "next/image";
import {
  GetAllProperties,
  GetSingleProperty,
} from "@/src/lib/request-handlers/propertyMgt";
import { GetUnitAvailability } from "@/src/lib/request-handlers/unitMgt";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  IProperty,
  IPropertyUnit,
} from "../../properties-mgt/types";
import { IUser } from "@/src/lib/types";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import { IoLocationOutline } from "react-icons/io5";
import { IoMdReturnLeft } from "react-icons/io";
import BookingAvailabilityCalendar from "./BookingAvailabilityCalendar";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { addYears } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreateBooking,
  GuestLookup,
} from "@/src/lib/request-handlers/bookingMgt";
import Spinner from "../../ui/Spinner";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import toast from "react-hot-toast";
import { useMediaQuery } from "@mui/material";
import { UploadPaymentProof } from "@/src/lib/request-handlers/bookingMgt";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { MdOutlinePayments } from "react-icons/md";
import { Icon } from "@iconify/react";

export default function CreateBookingView() {
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Agents must use the payment-link flow — they cannot self-attest to
  // payment or pick offline methods. Backend rejects regardless; we hide the
  // controls so the UI doesn't offer choices that 403.
  const isAgent = user?.role === UserRole.AGENT;

  // State
  const [guestSearchInput, setGuestSearchInput] = useState<string>("");
  const [guestSearchTerm, setGuestSearchTerm] = useState<string>("");
  const [propertySearchTerm, setPropertySearchTerm] = useState<string>("");
  const [unitSearchTerm, setUnitSearchTerm] = useState<string>("");
  const [propPage, setPropPage] = useState<number>(1);
  const propSize = 12;

  // Duplicate detection state for New Guest form
  const [newGuestLookupTerm, setNewGuestLookupTerm] = useState<string>("");
  const [duplicateGuestMatch, setDuplicateGuestMatch] = useState<any | null>(null);
  const [duplicateDismissed, setDuplicateDismissed] = useState<boolean>(false);

  // Queries — booking-on-behalf needs the full public catalog, not the
  // OWNER/AGENT scope-to-self view, so opt out of server-side auto-scoping.
  const { data: propertyList, isLoading: propertiesLoading } = GetAllProperties(
    propPage,
    propSize,
    propertySearchTerm,
    undefined,
    undefined,
    null,
    true,
  );
  const { data: guestLookupResult, isLoading: guestLookupLoading } =
    GuestLookup(guestSearchTerm);
  const { data: newGuestDuplicateResult, isLoading: newGuestLookupLoading } =
    GuestLookup(newGuestLookupTerm);
  const { mutate, isPending } = CreateBooking();
  const { mutate: uploadProof, isPending: isUploading } = UploadPaymentProof();

  // Local Data State
  const [selectionMode, setSelectionMode] = useState<boolean>(true);
  const [properties, setProperties] = useState<IProperty[]>([]);

  // Selection State
  const [selectedProperty, setSeletedProperty] = useState<
    IProperty | any | null
  >(null);
  const [selectedUnit, setSeletedUnit] = useState<IPropertyUnit | null>(null);
  const [selectedUser, setSeletedUser] = useState<IUser | null>(null);
  const [isNewGuest, setIsNewGuest] = useState<boolean>(false);

  // Fetch full property details to get units
  const { data: singlePropertyData, isLoading: isLoadingPropertyDetails } =
    GetSingleProperty(selectedProperty?.id);
  const fullPropertyDetails = singlePropertyData?.data?.data;

  // Fetch live availability for selected unit (accounts for active bookings occupancy)
  const { data: liveAvailabilityData, isLoading: isLoadingAvailability } =
    GetUnitAvailability(
      selectedProperty?.id || "",
      selectedUnit?.id || "",
      undefined,
      undefined,
      !!selectedProperty?.id && !!selectedUnit?.id,
    );

  const formik = useFormik({
    initialValues: {
      user_id: 0,
      unit_id: 0,
      start_date: null,
      end_date: null,
      guests_count: 1,
      unit_count: "",
      total_price: 0,
      // Agents can only use the online/gateway flow.
      payment_method: isAgent ? "online" : "cash",
      payment_proof_url: "",
      payment_notes: "",
      mark_as_paid: false,
      // Default the payment-link dispatch ON for agents — they're booking on
      // behalf of a guest who can't otherwise discover the checkout URL. Backend
      // also generates the link regardless; this just controls email + SMS
      // notification.
      send_payment_link: isAgent,
      referral_code: "",
      // Onboarding fields
      guest_first_name: "",
      guest_last_name: "",
      guest_email: "",
      guest_phone: "",
    },
    onSubmit: async (values) => {
      if (!selectedProperty) {
        toast.error("Please select a property");
        return;
      }

      if (!selectedUnit) {
        toast.error("Please select a unit");
        return;
      }

      if (!values.start_date) {
        toast.error("Please select a check-in date");
        return;
      }

      if (!values.end_date) {
        toast.error("Please select a check-out date");
        return;
      }

      if (!isNewGuest && !selectedUser) {
        toast.error("Please select a guest");
        return;
      }

      if (isNewGuest && !values.guest_email) {
        toast.error("Guest email is required for new guests");
        return;
      }

      if (isNewGuest && !values.guest_first_name) {
        toast.error("Guest first name is required for new guests");
        return;
      }

      if (isNewGuest && !values.guest_last_name) {
        toast.error("Guest last name is required for new guests");
        return;
      }

      // Validation: proof is mandatory for bank transfer if marking as paid
      if (
        values.mark_as_paid &&
        values.payment_method === "bank_transfer" &&
        !values.payment_proof_url
      ) {
        toast.error("Proof of payment is mandatory for bank transfers");
        return;
      }

      const payload = {
        ...values,
        start_date: formatDateToYYYYMMDD(values.start_date!),
        end_date: formatDateToYYYYMMDD(values.end_date!),
        // Ensure user_id is null if we are creating a new guest
        user_id: isNewGuest ? null : values.user_id,
      };

      // Don't send empty referral_code — omit the key entirely
      if (!payload.referral_code) delete (payload as any).referral_code;

      mutate(
        {
          payload: payload as any,
        },
        {
          onSuccess: (values) => {
            toast.success("Booking created successfully", {
              duration: 6000,
              style: {
                maxWidth: "500px",
                width: "max-content",
              },
            });
            const data = values?.data?.data;
            if (!data) return;
            // If a payment link was generated, hand it off to the booking
            // details page via sessionStorage so the detail view can render
            // the share/WhatsApp card on first load. Keyed by booking UUID
            // so it's only shown for *this* booking and clears after first
            // read (so a refresh doesn't show stale prompts).
            if (data.payment_link) {
              const guestEmail = isNewGuest
                ? (formik.values.guest_email || null)
                : (selectedUser?.email || null);
              const guestPhone = isNewGuest
                ? (formik.values.guest_phone || null)
                : (selectedUser?.phone || null);
              const propName = selectedProperty?.name ?? "your booking";
              const waMessage = encodeURIComponent(
                `Hi! Your Aparté booking ${data.booking_id} at ${propName} is ready. Pay here: ${data.payment_link}`,
              );
              const waNumber = (guestPhone || "").replace(/\D/g, "");
              try {
                sessionStorage.setItem(
                  `aparte:freshPaymentLink:${data.id}`,
                  JSON.stringify({
                    url: data.payment_link,
                    emailSent: !!data.payment_link_email_sent,
                    smsSent: !!data.payment_link_sms_sent,
                    bookingId: data.booking_id,
                    guestEmail,
                    guestPhone,
                    whatsappHref: waNumber
                      ? `https://wa.me/${waNumber}?text=${waMessage}`
                      : `https://wa.me/?text=${waMessage}`,
                  }),
                );
              } catch {
                // sessionStorage unavailable (private mode etc.) — falling
                // through still navigates to the detail page. The agent can
                // resend the link from there.
              }
            }
            router.push(
              PAGE_ROUTES.dashboard.bookingManagement.bookings.details(data.id),
            );
          },
          onError: (error: any) => {
            const detail = error?.response?.data?.detail;
            const message =
              (typeof detail === "string" ? detail : detail?.message) ||
              error?.response?.data?.message ||
              "Something went wrong";
            toast.error(message, {
              duration: 6000,
              style: {
                maxWidth: "500px",
                width: "max-content",
              },
            });
          },
        },
      );
    },
  });

  const handlePropertySelection = (name: string) => {
    const filteredProperties = properties?.filter((el) => {
      if (el?.name === name) return el;
    });
    const selected = filteredProperties[0];
    setSeletedProperty(selected);
    setPropertySearchTerm(name);
    setSeletedUnit(null);
    setUnitSearchTerm("");
    formik.setFieldValue("unit_id", 0);
  };

  const handleUnitSelection = (name: string) => {
    // Use full details to find the unit
    const unit = fullPropertyDetails?.units?.find(
      (u: IPropertyUnit) => u.name === name,
    );
    if (unit) {
      setSeletedUnit(unit);
      formik.setFieldValue("unit_id", unit.id);
      formik.setFieldValue("unit_count", 1);
    }
  };

  // Effect to inspect full details
  // useEffect(() => {
  //     if (fullPropertyDetails) {
  //         console.log('DEBUG: Full Property Details:', fullPropertyDetails);
  //     }
  // }, [fullPropertyDetails]);

  // Effect to sync properties list
  useEffect(() => {
    const fromItems =
      (propertyList as any)?.data?.data?.items ??
      (propertyList as any)?.data?.items;
    const fromData = (propertyList as any)?.data?.data?.data?.data ?? [];
    const next = Array.isArray(fromItems)
      ? fromItems
      : Array.isArray(fromData)
        ? fromData
        : [];
    setProperties(next as IProperty[]);
  }, [propertyList]);

  // Derived: guest search results list
  const guestResults: any[] = guestLookupResult?.data?.data ?? [];

  const handleGuestSelect = useCallback((guest: any) => {
    setSeletedUser({
      id: guest.id,
      email: guest.email,
      phone: guest.phone,
      profile: {
        firstName: guest.first_name,
        lastName: guest.last_name,
        first_name: guest.first_name,
        last_name: guest.last_name,
      },
    } as any);
    formik.setFieldValue("user_id", guest.id);
    setGuestSearchInput("");
    setGuestSearchTerm("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchToNewGuest = useCallback(() => {
    setIsNewGuest(true);
    const input = guestSearchInput.trim();
    if (input.includes("@")) {
      formik.setFieldValue("guest_email", input);
    } else {
      formik.setFieldValue("guest_phone", input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestSearchInput]);

  // Resolve duplicate detection: when the lookup returns results for the new guest's email/phone
  useEffect(() => {
    if (!newGuestLookupTerm) {
      setDuplicateGuestMatch(null);
      return;
    }
    const results: any[] = newGuestDuplicateResult?.data?.data ?? [];
    if (results.length > 0) {
      setDuplicateGuestMatch(results[0]);
      setDuplicateDismissed(false);
    } else {
      setDuplicateGuestMatch(null);
    }
  }, [newGuestDuplicateResult, newGuestLookupTerm]);

  // Helper: trigger lookup from new guest email/phone field
  const handleNewGuestFieldChange = useCallback(
    (field: "guest_email" | "guest_phone", value: string) => {
      formik.setFieldValue(field, value);
      setDuplicateDismissed(false);
      const trimmed = value.trim();
      const isEmail = field === "guest_email";
      const isValidEmail = isEmail && trimmed.includes("@") && trimmed.length >= 5;
      const isValidPhone = !isEmail && trimmed.replace(/\D/g, "").length >= 7;
      if (isValidEmail || isValidPhone) {
        setNewGuestLookupTerm(trimmed);
      } else {
        setNewGuestLookupTerm("");
        setDuplicateGuestMatch(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle admin choosing to use the detected duplicate as the booking guest
  const handleUseDuplicateGuest = useCallback((guest: any) => {
    handleGuestSelect(guest);
    setIsNewGuest(false);
    setDuplicateGuestMatch(null);
    setDuplicateDismissed(false);
    setNewGuestLookupTerm("");
    formik.setFieldValue("guest_first_name", "");
    formik.setFieldValue("guest_last_name", "");
    formik.setFieldValue("guest_email", "");
    formik.setFieldValue("guest_phone", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGuestSelect]);

  const { values, setFieldValue } = formik;

  // Effect to calculate price
  useEffect(() => {
    // Only calculate if we have both dates and a selected unit
    if (values.start_date && values.end_date && selectedUnit) {
      const days = getDayDifference(
        values.start_date as any,
        values.end_date as any,
      );

      // Ensure days is a positive number
      if (days > 0) {
        // Robust access to price and caution fee
        const pricePerNight = Number(
          selectedUnit?.pricePerNight ?? selectedUnit?.price_per_night ?? 0,
        );
        const cautionFee = Number(
          selectedUnit?.cautionFee ?? selectedUnit?.caution_fee ?? 0,
        );

        const firstPrice = days * (values.unit_count || 1) * pricePerNight;
        const grandPrice = firstPrice + cautionFee;

        // Only update if the price has changed to avoid unnecessary re-renders
        if (grandPrice !== values.total_price) {
          setFieldValue("total_price", grandPrice);
        }
      }
    } else {
      // Reset total price if dates are missing
      setFieldValue("total_price", 0);
    }
  }, [
    values.start_date,
    values.end_date,
    values.unit_count,
    selectedUnit,
    setFieldValue,
    values.total_price, // Add this to compare
  ]);

  // Auto-populate referral code with agent's own code when a guest is selected
  useEffect(() => {
    const isAgent = user?.role === UserRole.AGENT;
    const guestSelected =
      (values.user_id && Number(values.user_id) > 0) || !!values.guest_email;
    if (isAgent && guestSelected && !values.referral_code) {
      const agentCode = user?.profile?.referral_code;
      if (agentCode) {
        setFieldValue("referral_code", agentCode.toUpperCase());
      }
    }
  }, [user, values.user_id, values.guest_email, values.referral_code, setFieldValue]);

  // Memoize blocked dates from live availability (accounts for active bookings occupancy)
  const blockedDates = useMemo(() => {
    const availability = liveAvailabilityData?.data?.data;
    if (!availability) return [];

    const requestedUnits = Number(formik.values.unit_count || 1);

    return availability
      .filter((el: any) => {
        const isBlackout = el?.is_blackout ?? false;
        // count is remaining capacity after active bookings
        const remaining = Number(el?.count ?? 0);
        return isBlackout || remaining < requestedUnits;
      })
      .map((el: any) => ({ date: el?.date }));
  }, [liveAvailabilityData, formik.values.unit_count]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    uploadProof(
      { payload: formData },
      {
        onSuccess: (data: any) => {
          const url = data?.data?.data?.url;
          if (url) {
            formik.setFieldValue("payment_proof_url", url);
            toast.success("Payment proof uploaded successfully");
          }
        },
        onError: (error: any) => {
          console.error("Upload Error - Full object:", error);
          console.error("Upload Error - Response:", error?.response);
          console.error("Upload Error - Response Data:", error?.response?.data);

          let errorDetail = "Failed to upload payment proof";

          try {
            if (error?.response?.data?.detail) {
              errorDetail = error.response.data.detail;
            } else if (error?.response?.data?.message) {
              errorDetail = error.response.data.message;
            } else if (error?.message) {
              errorDetail = error.message;
            }
          } catch (e) {
            console.error("Error parsing error details:", e);
          }

          console.error("Upload Error Detail:", errorDetail);
          toast.error(errorDetail);
        },
      },
    );
  };

  // const [units,setUnits] = useState(formik.values.unit_count);
  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>)=> {
    const val = e.target.value;
    const max = selectedUnit?.count ?? 1;

    if (val === "") {
      formik.setFieldValue("unit_count", "");
      return;
    }
    if (Number(val )< 1) {
      formik.setFieldValue("unit_count", 1);
    } else if (Number(val )> max) {
      toast.error(`Only ${max} units available`);
      formik.setFieldValue("unit_count", max);
    } else {
      formik.setFieldValue("unit_count", val);
    }
  }

  return (
    <section className="bg-zinc-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Create New Booking
          </h1>
          {(selectedProperty ||
            selectedUnit ||
            selectedUser ||
            formik.dirty) && (
            <div
              onClick={() => {
                setSeletedProperty(null);
                setSeletedUnit(null);
                setSeletedUser(null);
                formik.resetForm();
                setSelectionMode(true);
                setIsNewGuest(false);
                setDuplicateGuestMatch(null);
                setDuplicateDismissed(false);
                setNewGuestLookupTerm("");
              }}
              className="flex gap-2 items-center cursor-pointer text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <IoMdReturnLeft />
              <span className="text-sm font-medium">Reset Form</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: FORM INPUTS */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Property Details Section */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                <span className="bg-primary/10 text-primary p-1.5 rounded-lg">
                  <UnitIcon className="w-5 h-5" color="currentColor" />
                </span>
                Property & Unit
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Select Property
                  </label>
                  <AdjustableFilterDropdown
                    placeholder="Search for a property..."
                    options={
                      properties
                        ?.map((prop: any) => prop.name)
                        .filter(Boolean) ?? []
                    }
                    handleSelection={(val) => handlePropertySelection(val)}
                    searchTerm={propertySearchTerm}
                    setSearchTerm={setPropertySearchTerm}
                    isLoading={propertiesLoading}
                  />
                  {selectedProperty && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                      {selectedProperty.images?.[0] ? (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedProperty.images[0]}
                            alt={selectedProperty.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-zinc-200 rounded-md flex items-center justify-center text-zinc-400">
                          <UnitIcon />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-zinc-900 line-clamp-1">
                          {selectedProperty.name}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <IoLocationOutline />{" "}
                          {selectedProperty.address ?? "No address"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Select Unit
                  </label>
                  <AdjustableFilterDropdown
                    placeholder="Search for a unit..."
                    // Use fullPropertyDetails here
                    options={
                      fullPropertyDetails?.units
                        ?.map((el: IPropertyUnit) => el?.name)
                        .filter(Boolean) ?? []
                    }
                    searchTerm={unitSearchTerm}
                    setSearchTerm={setUnitSearchTerm}
                    handleSelection={(val) => handleUnitSelection(val)}
                    isLoading={isLoadingPropertyDetails}
                    disabled={!selectedProperty}
                  />
                  {selectedUnit && (
                    <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 border border-teal-100">
                        <UnitIcon className="w-5 h-5" color="currentColor" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">
                          {selectedUnit.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Max Guests:{" "}
                          <span className="font-medium text-zinc-700">
                            {selectedUnit.maxGuests ??
                              selectedUnit.max_guests ??
                              "-"}
                          </span>{" "}
                          • Price:{" "}
                          <span className="font-medium text-primary">
                            {formatMoney(
                              selectedUnit.pricePerNight ??
                                selectedUnit.price_per_night ??
                                0,
                            )}
                            /night
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Guest Details Section */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                  <UsersIcon className="w-5 h-5" color="currentColor" />
                </span>
                Guest & Stay
              </h2>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 p-1 bg-zinc-100 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewGuest(false);
                      setDuplicateGuestMatch(null);
                      setDuplicateDismissed(false);
                      setNewGuestLookupTerm("");
                    }}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${!isNewGuest ? "bg-white shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    Existing Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewGuest(true);
                      setDuplicateGuestMatch(null);
                      setDuplicateDismissed(false);
                      setNewGuestLookupTerm("");
                    }}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${isNewGuest ? "bg-white shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    New Guest Onboarding
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!isNewGuest ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        Find Guest
                      </label>
                      {!selectedUser ? (
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Search by name, email or phone..."
                            value={guestSearchInput}
                            onChange={(e) => {
                              setGuestSearchInput(e.target.value);
                              // Debounce: trigger search after typing pauses
                              const val = e.target.value.trim();
                              if (val.length >= 2) {
                                setGuestSearchTerm(val);
                              } else {
                                setGuestSearchTerm("");
                              }
                            }}
                          />
                          {guestLookupLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Spinner />
                            </div>
                          )}
                          {/* Results dropdown */}
                          {guestSearchTerm &&
                            !guestLookupLoading &&
                            guestResults.length > 0 && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {guestResults.map((guest: any) => (
                                  <button
                                    key={guest.id}
                                    type="button"
                                    onClick={() => handleGuestSelect(guest)}
                                    className="w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 transition-colors"
                                  >
                                    <p className="text-sm font-medium text-zinc-900">
                                      {[guest.first_name, guest.last_name]
                                        .filter(Boolean)
                                        .join(" ") || "Guest"}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      {[guest.email, guest.phone]
                                        .filter(Boolean)
                                        .join(" \u00b7 ")}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          {/* No results */}
                          {guestSearchTerm &&
                            !guestLookupLoading &&
                            guestResults.length === 0 && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-4">
                                <p className="text-sm text-zinc-500">
                                  No guests found.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleSwitchToNewGuest}
                                  className="mt-1 text-sm font-medium text-primary hover:text-primary/80 underline"
                                >
                                  Create as new guest instead
                                </button>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-500 font-medium border border-zinc-200">
                            {selectedUser.profile?.firstName?.[0] ?? "G"}
                            {selectedUser.profile?.lastName?.[0] ?? ""}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {selectedUser.profile?.firstName ?? "Guest"}{" "}
                              {selectedUser.profile?.lastName ?? ""}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {selectedUser.email}
                            </p>
                            {selectedUser.phone && (
                              <p className="text-xs text-zinc-400">
                                {selectedUser.phone}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSeletedUser(null);
                              formik.setFieldValue("user_id", 0);
                              setGuestSearchInput("");
                              setGuestSearchTerm("");
                            }}
                            className="ml-auto text-xs font-medium text-red-500 hover:text-red-600"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="col-span-1 space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">
                            First Name
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. John"
                            {...formik.getFieldProps("guest_first_name")}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">
                            Last Name
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. Doe"
                            {...formik.getFieldProps("guest_last_name")}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">
                            Email Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              className={`w-full h-11 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-colors ${duplicateGuestMatch && !duplicateDismissed ? "border-amber-400 bg-amber-50" : "border-zinc-300"}`}
                              placeholder="guest@example.com"
                              value={formik.values.guest_email}
                              onChange={(e) =>
                                handleNewGuestFieldChange("guest_email", e.target.value)
                              }
                            />
                            {newGuestLookupLoading && formik.values.guest_email && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Spinner />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">
                            Phone Number
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              className={`w-full h-11 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-colors ${duplicateGuestMatch && !duplicateDismissed ? "border-amber-400 bg-amber-50" : "border-zinc-300"}`}
                              placeholder="+234..."
                              value={formik.values.guest_phone}
                              onChange={(e) =>
                                handleNewGuestFieldChange("guest_phone", e.target.value)
                              }
                            />
                            {newGuestLookupLoading && formik.values.guest_phone && !formik.values.guest_email && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Spinner />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Duplicate guest warning banner */}
                      {duplicateGuestMatch && !duplicateDismissed && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm border border-amber-200">
                              !
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-amber-800">
                                Guest already exists in the system
                              </p>
                              <p className="text-xs text-amber-700 mt-0.5">
                                A guest record matching this email or phone was found:
                              </p>
                              <div className="mt-2 p-2.5 bg-white border border-amber-200 rounded-md">
                                <p className="text-sm font-medium text-zinc-900">
                                  {[duplicateGuestMatch.first_name, duplicateGuestMatch.last_name]
                                    .filter(Boolean)
                                    .join(" ") || "Guest"}
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {[duplicateGuestMatch.email, duplicateGuestMatch.phone]
                                    .filter(Boolean)
                                    .join(" \u00b7 ")}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleUseDuplicateGuest(duplicateGuestMatch)}
                              className="flex-1 h-9 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Use Existing Guest Profile
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">
                          Guests
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            disabled={!selectedUnit}
                            max={
                              selectedUnit?.maxGuests ??
                              selectedUnit?.max_guests ??
                              10
                            }
                            className="w-full h-14 pl-4 pr-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                            value={formik.values.guests_count}
                            onChange={(e) => {
                              const val = e.target.value;
                              const max =
                                selectedUnit?.maxGuests ??
                                selectedUnit?.max_guests ??
                                10;
                              if (Number(val) <= max) {
                                formik.setFieldValue("guests_count", val);
                              } else {
                                toast.error(
                                  `Max guests for this unit is ${max}`,
                                );
                                formik.setFieldValue("guests_count", max);
                              }
                            }}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                            People
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">
                          Units
                        </label>
                        <div className="relative">
                          <input
                           type="text"
                           inputMode="numeric"
                           pattern="[0-9]*"
                            min="1"
                            disabled={!selectedUnit}
                            placeholder="0"
                            max={selectedUnit?.count ?? 1}
                            className="w-full h-14 pl-4 pr-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                            value={formik.values.unit_count}
                            onChange={(e) => handleUnitChange(e)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                            Qty
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Stay Duration
                  {isLoadingAvailability && selectedUnit && (
                    <span className="ml-2 text-xs text-zinc-400 font-normal">
                      Loading availability...
                    </span>
                  )}
                </label>
                <BookingAvailabilityCalendar
                  checkInDate={formik.values.start_date}
                  checkOutDate={formik.values.end_date}
                  onCheckInDateSelect={(date) =>
                    formik.setFieldValue("start_date", date)
                  }
                  onCheckOutDateSelect={(date) =>
                    formik.setFieldValue("end_date", date)
                  }
                  isMobileView={isMobile}
                  maxDate={addYears(new Date(), 1)}
                  blockedDates={blockedDates}
                />
                <p className="text-xs text-gray-500 mt-2">
                  * Bookings are limited to 1 year in advance.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BOOKING SUMMARY (STICKY) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-4">
                Booking Summary
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Guest</span>
                  <span className="text-zinc-900 font-medium text-right w-1/2 truncate">
                    {isNewGuest
                      ? formik.values.guest_first_name ||
                        formik.values.guest_email ||
                        "New Guest"
                      : selectedUser?.profile?.firstName
                        ? `${selectedUser.profile.firstName} ${selectedUser.profile.lastName || ""}`
                        : selectedUser?.email || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Property</span>
                  <span className="text-zinc-900 font-medium text-right w-1/2 truncate">
                    {selectedProperty?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Unit Type</span>
                  <span className="text-zinc-900 font-medium">
                    {selectedUnit?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Dates</span>
                  <div className="text-right">
                    {formik.values.start_date && formik.values.end_date ? (
                      <>
                        <span className="block text-zinc-900 font-medium">
                          {formatDate(formik.values.start_date as any)}
                        </span>
                        <span className="block text-zinc-400 text-xs">
                          to {formatDate(formik.values.end_date as any)}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-900 font-medium">
                    {formik.values.start_date && formik.values.end_date
                      ? `${getDayDifference(formik.values.start_date as any, formik.values.end_date as any)} Nights`
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-zinc-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">
                    Rate (x{formik.values.unit_count || 1} units)
                  </span>
                  <span className="font-medium text-zinc-900">
                    {selectedUnit
                      ? formatMoney(
                          Number(
                            selectedUnit.pricePerNight ??
                              selectedUnit.price_per_night ??
                              0,
                          ) * (formik.values.unit_count || 1),
                        )
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Caution Fee</span>
                  <span className="font-medium text-zinc-900">
                    {selectedUnit
                      ? formatMoney(
                          Number(
                            selectedUnit.cautionFee ??
                              selectedUnit.caution_fee ??
                              0,
                          ),
                        )
                      : "-"}
                  </span>
                </div>
                <div className="border-t border-zinc-200 mt-2 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-zinc-900">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatMoney(formik.values.total_price)}
                  </span>
                </div>
              </div>

              {/* Referral Code */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Referral Code
                  <span className="ml-1 text-zinc-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full h-10 px-3 pr-8 border border-zinc-300 rounded-lg text-sm font-mono bg-white
                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all
                               uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                    placeholder="e.g. YOURCODE123"
                    value={formik.values.referral_code}
                    maxLength={12}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "referral_code",
                        e.target.value.toUpperCase().trim(),
                      )
                    }
                  />
                  {formik.values.referral_code && (
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue("referral_code", "")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      aria-label="Clear referral code"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-snug">
                  Applying this code will attribute this booking to the referrer.
                </p>
              </div>

              {/* Payment Handling Section */}
              <div className="border-t border-zinc-100 pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MdOutlinePayments className="text-primary text-lg" />
                  <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                    Payment Information
                  </h4>
                </div>

                <div className="space-y-3">
                  {!isAgent && (
                    <div
                      className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors"
                      onClick={() => {
                        const next = !formik.values.mark_as_paid;
                        formik.setFieldValue("mark_as_paid", next);
                        if (next) formik.setFieldValue("send_payment_link", false);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary rounded focus:ring-primary border-zinc-300"
                        checked={formik.values.mark_as_paid}
                        onChange={() => {}} // Handled by div click
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        Mark as Paid
                      </span>
                    </div>
                  )}

                  {/* Send payment link — for agents this is locked ON because
                      they have no other way to collect payment from the guest. */}
                  {isAgent ? (
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-teal-50 border-teal-200">
                      <Icon icon="mdi:email-send-outline" className="mt-0.5 text-teal-700 text-lg" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-teal-900 block">
                          Payment link will be sent to guest
                        </span>
                        <span className="text-xs text-teal-700 block mt-0.5">
                          We'll email + SMS the guest a checkout URL when you confirm. You also get a copyable link to share on WhatsApp.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        formik.values.mark_as_paid
                          ? "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
                          : "bg-zinc-50 border-zinc-200 cursor-pointer hover:bg-zinc-100"
                      }`}
                      onClick={() => {
                        if (formik.values.mark_as_paid) return;
                        formik.setFieldValue(
                          "send_payment_link",
                          !formik.values.send_payment_link,
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 text-primary rounded focus:ring-primary border-zinc-300"
                        checked={formik.values.send_payment_link}
                        disabled={formik.values.mark_as_paid}
                        onChange={() => {}}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-zinc-700 block">
                          Send payment link to guest
                        </span>
                        <span className="text-xs text-zinc-500 block mt-0.5">
                          Emails and SMSes the guest a checkout URL. You also get a copyable link to share on WhatsApp.
                        </span>
                      </div>
                    </div>
                  )}

                  {formik.values.mark_as_paid && !isAgent && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">
                          Payment Method
                        </label>
                        <select
                          className="w-full h-11 px-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          value={formik.values.payment_method}
                          onChange={(e) =>
                            formik.setFieldValue(
                              "payment_method",
                              e.target.value,
                            )
                          }
                        >
                          <option value="cash">Cash</option>
                          <option value="pos">POS</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="online">Online / Other</option>
                        </select>
                      </div>

                      {(formik.values.payment_method === "bank_transfer" ||
                        formik.values.payment_method === "pos") && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">
                            Proof of Payment{" "}
                            {formik.values.payment_method ===
                              "bank_transfer" && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              id="proof-upload"
                              className="hidden"
                              accept="image/*,application/pdf"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                            <label
                              htmlFor="proof-upload"
                              className={`flex items-center justify-center gap-2 w-full h-11 border-2 border-dashed ${formik.values.payment_proof_url ? "border-primary bg-primary/5 text-primary" : "border-zinc-300 text-zinc-500"} rounded-lg cursor-pointer hover:border-primary hover:text-primary transition-all text-sm font-medium`}
                            >
                              {isUploading ? (
                                <Spinner />
                              ) : (
                                <>
                                  <HiOutlineCloudUpload className="text-lg" />
                                  {formik.values.payment_proof_url
                                    ? "Receipt Uploaded"
                                    : "Upload Receipt"}
                                </>
                              )}
                            </label>
                            {formik.values.payment_proof_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  formik.setFieldValue("payment_proof_url", "")
                                }
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">
                          Payment Notes
                        </label>
                        <textarea
                          className="w-full p-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                          placeholder="Enter any notes about this payment..."
                          rows={2}
                          value={formik.values.payment_notes}
                          onChange={(e) =>
                            formik.setFieldValue(
                              "payment_notes",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => formik.handleSubmit()}
                disabled={
                  !formik.isValid ||
                  !formik.dirty ||
                  isPending ||
                  !selectedProperty ||
                  !selectedUnit ||
                  (!isNewGuest && !selectedUser) ||
                  (isNewGuest && !formik.values.guest_email) ||
                  !formik.values.start_date ||
                  isUploading ||
                  (isNewGuest && !!duplicateGuestMatch && !duplicateDismissed)
                }
                className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all mt-6 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Spinner />
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <PriceTagIcon color="white" />
                  </>
                )}
              </button>
              {isNewGuest && !!duplicateGuestMatch && !duplicateDismissed ? (
                <p className="text-xs text-center text-amber-600 mt-2 font-medium">
                  Resolve the duplicate guest before proceeding
                </p>
              ) : (!selectedProperty ||
                !selectedUnit ||
                (!isNewGuest && !selectedUser) ||
                (isNewGuest && !formik.values.guest_email) ||
                !formik.values.start_date) ? (
                <p className="text-xs text-center text-zinc-400 mt-2">
                  Complete all fields to proceed
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
