export enum WizardStep {
    PROPERTY_DETAILS = 0,
    UNITS = 1,
    MEDIA_DOCS = 2,
}

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

import { PropertyType } from '../types';

export type PropertyFormValues = {
    name: string;
    address: string;
    property_type: PropertyType;
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
