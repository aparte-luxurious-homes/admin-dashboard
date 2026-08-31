import { PropertyType, IDiscountPolicy } from '../types';

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
};

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
    long_stay_discount_policy: IDiscountPolicy;
    extension_discount_policy: IDiscountPolicy;
    amenities: string[];
    amenityIds: string[];
    event_types: string[];
};

export function createEmptyUnit(): UnitFormValues {
    return {
        _key: crypto.randomUUID(),
        name: '',
        description: '',
        price_per_night: '',
        caution_fee: '0.00',
        max_guests: 1,
        count: 1,
        is_whole_property: false,
        bedroom_count: 1,
        living_room_count: 0,
        kitchen_count: 0,
        bathroom_count: 1,
        amenityNames: [],
    };
}
