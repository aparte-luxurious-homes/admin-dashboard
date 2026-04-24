import { PropertyType } from '../types';

export enum WizardStep {
    PROPERTY_DETAILS = 0,
    UNITS = 1,
    MEDIA_DOCS = 2,
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

export const REQUIRED_UNIT_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.LIVING_ROOM,
    PropertyMediaCategory.DINING,
    PropertyMediaCategory.KITCHEN,
    PropertyMediaCategory.BEDROOM,
    PropertyMediaCategory.BATHROOM,
    PropertyMediaCategory.TOILET,
];

export const OPTIONAL_UNIT_CATEGORIES: PropertyMediaCategory[] = [
    PropertyMediaCategory.BALCONY,
];

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
    description: string;
    latitude: number | null;
    longitude: number | null;
    ownerId: number;
    owner_name: string;
    owner_email: string;
    is_pet_allowed: boolean;
    is_party_allowed: boolean;
    rules: string;
    amenities: string[];
    amenityIds: number[];
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
