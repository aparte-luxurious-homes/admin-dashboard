import { PropertyType, IDiscountPolicy } from '../types';
import { HallForm, emptyHallForm } from '../venue';

export enum WizardStep {
    PROPERTY_DETAILS = 0,
    UNITS = 1,
    DISCOUNTS = 2,
    MEDIA_DOCS = 3,
}

// Mirrors services/properties/models.py::PropertyMediaCategory
export enum PropertyMediaCategory {
    EXTERIOR_FRONT = 'EXTERIOR_FRONT',
    EXTERIOR_COMPOUND = 'EXTERIOR_COMPOUND',
    ENTRANCE = 'ENTRANCE',
    PARKING = 'PARKING',
    COMMON_AREA = 'COMMON_AREA',
    ROOFTOP = 'ROOFTOP',
    STAIRCASE = 'STAIRCASE',
    LIVING_ROOM = 'LIVING_ROOM',
    DINING = 'DINING',
    KITCHEN = 'KITCHEN',
    BEDROOM = 'BEDROOM',
    BATHROOM = 'BATHROOM',
    TOILET = 'TOILET',
    BALCONY = 'BALCONY',
    // Event-centre halls
    HALL_INTERIOR = 'HALL_INTERIOR',
    STAGE = 'STAGE',
    SEATING_LAYOUT = 'SEATING_LAYOUT',
    CHANGING_ROOM = 'CHANGING_ROOM',
    CATERING_AREA = 'CATERING_AREA',
    WALKTHROUGH_VIDEO = 'WALKTHROUGH_VIDEO',
    OTHER = 'OTHER',
}

export const REQUIRED_PROPERTY_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.EXTERIOR_FRONT,
    PropertyMediaCategory.EXTERIOR_COMPOUND,
    PropertyMediaCategory.ENTRANCE,
    PropertyMediaCategory.PARKING,
];

export const OPTIONAL_PROPERTY_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.COMMON_AREA,
    PropertyMediaCategory.ROOFTOP,
    PropertyMediaCategory.STAIRCASE,
];

// Event centres (PRD 4.3): the venue once, then each hall by its interior.
// Mirrors api-v1 services/properties/validators.py, which flags any required
// slot left empty to the verification reviewer.
export const VENUE_REQUIRED_PROPERTY_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.EXTERIOR_FRONT,
    PropertyMediaCategory.ENTRANCE,
    PropertyMediaCategory.PARKING,
];

export const VENUE_OPTIONAL_PROPERTY_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.EXTERIOR_COMPOUND,
];

export const HALL_REQUIRED_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.HALL_INTERIOR,
];

export const HALL_OPTIONAL_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.STAGE,
    PropertyMediaCategory.SEATING_LAYOUT,
    PropertyMediaCategory.CHANGING_ROOM,
    PropertyMediaCategory.TOILET,
    PropertyMediaCategory.CATERING_AREA,
];

// Static fallback when the unit's room counts are unavailable.
// Per-unit lookups should use getRequiredCategoriesForUnit / getOptionalCategoriesForUnit.
export const REQUIRED_UNIT_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.LIVING_ROOM,
    PropertyMediaCategory.KITCHEN,
    PropertyMediaCategory.BEDROOM,
    PropertyMediaCategory.BATHROOM,
];

export const OPTIONAL_UNIT_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.DINING,
    PropertyMediaCategory.TOILET,
    PropertyMediaCategory.BALCONY,
];

/**
 * Required photo categories derived from the unit's room counts.
 * If a unit has 0 living rooms, no LIVING_ROOM bucket is asked for, etc.
 * BEDROOM is always required (a unit with 0 bedrooms is a degenerate listing,
 * but if the user has explicitly set 0 we still skip the bucket).
 */
export function getRequiredCategoriesForUnit(unit: Pick<UnitFormValues,
    'bedroom_count' | 'living_room_count' | 'kitchen_count' | 'bathroom_count'>): PropertyMediaCategory[] {
    const cats: PropertyMediaCategory[] = [];
    if ((unit.living_room_count ?? 0) > 0) cats.push(PropertyMediaCategory.LIVING_ROOM);
    if ((unit.kitchen_count ?? 0) > 0) cats.push(PropertyMediaCategory.KITCHEN);
    if ((unit.bedroom_count ?? 0) > 0) cats.push(PropertyMediaCategory.BEDROOM);
    if ((unit.bathroom_count ?? 0) > 0) cats.push(PropertyMediaCategory.BATHROOM);
    return cats;
}

/** Optional categories aren't tied to room counts. */
export function getOptionalCategoriesForUnit(_unit?: Pick<UnitFormValues,
    'bedroom_count' | 'living_room_count' | 'kitchen_count' | 'bathroom_count'>): PropertyMediaCategory[] {
    return [
        PropertyMediaCategory.DINING,
        PropertyMediaCategory.TOILET,
        PropertyMediaCategory.BALCONY,
    ];
}

/** Hint label suffix showing the unit's room count, e.g. "Bedroom × 3". */
export function getCategoryCountSuffix(unit: Pick<UnitFormValues,
    'bedroom_count' | 'living_room_count' | 'kitchen_count' | 'bathroom_count'>,
    cat: PropertyMediaCategory): number {
    if (cat === PropertyMediaCategory.BEDROOM) return unit.bedroom_count ?? 0;
    if (cat === PropertyMediaCategory.LIVING_ROOM) return unit.living_room_count ?? 0;
    if (cat === PropertyMediaCategory.KITCHEN) return unit.kitchen_count ?? 0;
    if (cat === PropertyMediaCategory.BATHROOM) return unit.bathroom_count ?? 0;
    return 0;
}

export const CATEGORY_LABELS: Record<PropertyMediaCategory, string> = {
    EXTERIOR_FRONT: 'Exterior (front)',
    EXTERIOR_COMPOUND: 'Compound',
    ENTRANCE: 'Entrance',
    PARKING: 'Parking',
    COMMON_AREA: 'Common area',
    ROOFTOP: 'Rooftop',
    STAIRCASE: 'Staircase',
    LIVING_ROOM: 'Living room',
    DINING: 'Dining',
    KITCHEN: 'Kitchen',
    BEDROOM: 'Bedroom',
    BATHROOM: 'Bathroom',
    TOILET: 'Toilet',
    BALCONY: 'Balcony',
    HALL_INTERIOR: 'Hall interior',
    STAGE: 'Stage / podium',
    SEATING_LAYOUT: 'Seating layout',
    CHANGING_ROOM: 'Changing room',
    CATERING_AREA: 'Catering / kitchen area',
    WALKTHROUGH_VIDEO: 'Walkthrough video',
    OTHER: 'Other',
};

export type CategorizedMedia = Partial<Record<PropertyMediaCategory, File[]>>;

export const WIZARD_STEPS = [
    { key: WizardStep.PROPERTY_DETAILS, label: 'Property Details', icon: 'solar:home-2-bold-duotone' },
    { key: WizardStep.UNITS, label: 'Units', icon: 'solar:widget-3-bold-duotone' },
    { key: WizardStep.DISCOUNTS, label: 'Discounts', icon: 'solar:tag-price-bold-duotone' },
    { key: WizardStep.MEDIA_DOCS, label: 'Media & Docs', icon: 'solar:camera-bold-duotone' },
] as const;

/** The steps as an event centre reads them: halls, not units. */
export const wizardSteps = (venue: boolean) =>
    WIZARD_STEPS.map((step) =>
        venue && step.key === WizardStep.UNITS
            ? { ...step, label: 'Halls & Spaces', icon: 'solar:buildings-2-bold-duotone' }
            : step,
    );

/** Category label, worded for a venue where the stay wording would mislead. */
export const categoryLabel = (cat: PropertyMediaCategory, venue: boolean): string =>
    venue && cat === PropertyMediaCategory.EXTERIOR_COMPOUND
        ? 'Compound / outdoor space'
        : venue && cat === PropertyMediaCategory.EXTERIOR_FRONT
            ? 'Front / exterior (cover photo)'
            : CATEGORY_LABELS[cat];

export type UnitFormValues = {
    _key: string;
    name: string;
    description: string;
    price_per_night: string;
    caution_fee: string;
    max_guests: number;
    count: number;
    is_whole_property: boolean;
    bedroom_count: number;
    living_room_count: number;
    kitchen_count: number;
    bathroom_count: number;
    amenityNames: string[];
    // Event centre (PRD 4.2 "Facilities Unit"): what the hall seats, parks
    // and powers. Its rate card and hours come from HallForm.
    seating_capacity: number;
    standing_capacity: number;
    car_park_spaces: number;
    power_supply_provision: string;
    // Not venue-only: a shortlet can charge for cleaning too.
    additional_fees: Array<{ fee_name: string; fee_amount: number; is_mandatory: boolean }>;
    /**
     * Per-unit overrides. `null`/absent means this unit inherits the
     * property's policy — which is why the editor clears to null instead of
     * leaving an inactive policy object behind. An object here pins the unit
     * to its own terms.
     */
    long_stay_discount_policy?: IDiscountPolicy | null;
    extension_discount_policy?: IDiscountPolicy | null;
} & HallForm;

export type PropertyFormValues = {
    name: string;
    address: string;
    street_number: string;
    street_name: string;
    postal_code: string;
    landmark: string;
    google_place_id: string;
    geocode_raw: Record<string, unknown> | null;
    pin_confirmed: boolean;
    property_type: PropertyType | '';
    country: string;
    state: string;
    city: string;
    // Local Government Area (Google's administrative_area_level_2). Optional
    // because older payloads and the public listing wizard omit it — the API
    // resolves it from coordinates when absent.
    lga: string;
    description: string;
    latitude: number | null;
    longitude: number | null;
    // UUID string. Was `number`, which forced the falsy sentinel 0 and is
    // why a selected owner could be dropped without anything noticing.
    ownerId: string;
    owner_name: string;
    owner_email: string;
    owner_phoneNumber: string;
    is_pet_allowed: boolean;
    is_party_allowed: boolean;
    rules: string;
    // Nullable: null means "no policy", which is what the API stores and what
    // DiscountPolicyEditor writes when a policy is switched off.
    long_stay_discount_policy: IDiscountPolicy | null;
    extension_discount_policy: IDiscountPolicy | null;
    amenities: string[];
    amenityIds: string[];
    event_types: string[];
};

export function createEmptyUnit(venue = false): UnitFormValues {
    return {
        _key: crypto.randomUUID(),
        name: '',
        description: '',
        price_per_night: '',
        caution_fee: '0.00',
        max_guests: 1,
        count: 1,
        is_whole_property: false,
        // A hall has no bedrooms; a stay starts with one.
        bedroom_count: venue ? 0 : 1,
        living_room_count: 0,
        kitchen_count: 0,
        bathroom_count: 1,
        amenityNames: [],
        seating_capacity: 0,
        standing_capacity: 0,
        car_park_spaces: 0,
        power_supply_provision: '',
        ...emptyHallForm(),
        additional_fees: [],
        long_stay_discount_policy: null,
        extension_discount_policy: null,
    };
}
