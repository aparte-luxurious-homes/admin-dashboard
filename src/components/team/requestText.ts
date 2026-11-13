/** Plain-language labels for a team change request. */

const FIELD_LABELS: Record<string, string> = {
    name: "Name",
    description: "Description",
    rules: "House rules",
    booking_mode: "Booking mode",
    is_pet_allowed: "Pets allowed",
    is_party_allowed: "Parties allowed",
    price_per_night: "Price per night",
    caution_fee: "Caution fee",
    max_guests: "Max guests",
    count: "Number of units",
    address: "Address",
    amenities: "Amenities",
};

export const fieldLabel = (key: string) =>
    FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const ACTIONS: Record<string, string> = {
    CHECK_IN: "Check in a booking",
    CHECK_OUT: "Check out a booking",
    APPROVE_REQUEST: "Approve a booking request",
    REJECT_REQUEST: "Reject a booking request",
    CANCEL: "Cancel a booking",
};

export function describeRequest(r: {
    target_type: string; action: string; payload?: Record<string, any>; property_name?: string;
}): string {
    const on = r.property_name ? ` on ${r.property_name}` : "";
    switch (r.target_type) {
        case "PROPERTY":
            return `Edit property: ${Object.keys(r.payload ?? {}).map(fieldLabel).join(", ")}${on}`;
        case "UNIT":
            return `Edit unit: ${Object.keys(r.payload ?? {}).map(fieldLabel).join(", ")}${on}`;
        case "AVAILABILITY":
            return `Change availability for ${(r.payload?.dates ?? []).length} date(s)${on}`;
        case "MEDIA_ADD":
            return `Add a ${r.payload?.media_type === "VIDEO" ? "video" : "photo"}${on}`;
        case "MEDIA_DELETE":
            return `Remove a photo or video${on}`;
        case "BOOKING_ACTION":
            return `${ACTIONS[r.action] ?? "Booking action"}${on}`;
        default:
            return r.target_type;
    }
}

export function displayValue(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}
