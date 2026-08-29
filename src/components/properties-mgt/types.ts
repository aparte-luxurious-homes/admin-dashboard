import { IUser } from "@/src/lib/types"
import { IBooking } from "../booking-mgt/types"


export type VerificationBageProps = {
    status: PropertyVerificationStatus | string;
    textColour?: string;
    backgroundColour?: string;
    classNames?: string;
}

export enum PropertyVerificationStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    VR = 'VR',
}

export enum AssignableType {
    PROPERTY = 'PROPERTY',
    UNIT = 'UNIT',
}

export enum PropertyType {
    DUPLEX = 'DUPLEX',
    BUNGALOW = 'BUNGALOW',
    VILLA = 'VILLA',
    APARTMENT = 'APARTMENT',
    HOTEL = 'HOTEL',
    EVENT_CENTRE = 'EVENT_CENTRE',
    OTHERS = 'OTHERS',
}

export enum BookingMode {
    INSTANT = 'INSTANT',
    REQUEST_TO_BOOK = 'REQUEST_TO_BOOK',
}

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

export interface IDiscountTier {
    min_nights: number;
    value: number | string;
}

export interface IDiscountPolicy {
    is_active: boolean;
    discount_type: DiscountType;
    tiers: IDiscountTier[];
}

export interface IAmenity {
    id: string
    name: string
    createdAt?: string
    updatedAt?: string
}



export interface IPropertyVerification {
    id: string
    propertyId: string
    property_id?: string
    agentId: string
    agent_id?: string
    status: PropertyVerificationStatus
    feedback: string
    evidence_urls?: string[]
    verificationDate?: string
    verification_date?: string
    createdAt: string
    created_at?: string
    agent: IUser
    property: IProperty
    /** Set when the previous VERIFIED decision was overturned and the
        agent's reward was debited. Drives the "Reward reversed" pill in
        the sticky decision bar. */
    rewardReversedAt?: string | null
    reward_reversed_at?: string | null
    rewardTxId?: string | null
    reward_tx_id?: string | null
}

export interface IAmenityAssignment {
    id: string
    amenityId: string
    assignableId: string
    assignableType: AssignableType
    createdAt: string
    amenity: IAmenity
}

export interface IAssignAmenity {
    amenity_ids: string[]
}

export interface IPropertyReview {
    id: string
    unitId: string
    userId: string
    rating: number
    review?: string
    comment?: string
    photo_urls?: string[]
    createdAt: string
}

export interface IPropertyMedia {
    id: string
    mediaUrl?: string
    media_url?: string
    mediaType: MediaType
    media_type?: MediaType
    isFeatured?: boolean
    is_featured?: boolean
    assignableId: string
    assignableType: AssignableType
    uploadedAt: string
}

export interface IPropertyUnit {
    id: string
    propertyId: string
    property_id?: string
    name: string
    description?: string
    pricePerNight: string
    price_per_night?: string
    cautionFee: string
    caution_fee?: string
    maxGuests: number
    max_guests?: number
    count: number
    isWholeProperty: boolean
    is_whole_property?: boolean
    bedroomCount: number
    bedroom_count?: number
    livingRoomCount: number
    living_room_count?: number
    kitchenCount: number
    kitchen_count?: number
    bathroomCount: number
    bathroom_count?: number
    seatingCapacity?: number
    seating_capacity?: number
    standingCapacity?: number
    standing_capacity?: number
    carParkSpaces?: number
    car_park_spaces?: number
    powerSupplyProvision?: string
    power_supply_provision?: string
    additionalFees?: Array<{
        fee_name: string
        fee_amount: number
        is_mandatory: boolean
    }>
    additional_fees?: Array<{
        fee_name: string
        fee_amount: number
        is_mandatory: boolean
    }>
    eventPricePerDay?: string
    event_price_per_day?: string
    eventPricePerHour?: string
    event_price_per_hour?: string
    eventPricePerHalfDay?: string
    event_price_per_half_day?: string
    isVerified: boolean
    is_verified?: boolean
    createdAt: string
    created_at?: string
    updatedAt: string
    updated_at?: string
    property?: IProperty
    media: IPropertyMedia[]
    reviews: IPropertyReview[]
    amenities: IAmenity[]
    availability: IAvailability[]
    bookings: IBooking[]
}


export interface IProperty {
    [x: string]: any
    id: string
    ownerId: string
    owner_id?: string
    bookingMode?: BookingMode
    booking_mode?: BookingMode
    assignedAgent?: string
    assigned_agent?: string
    zone_id?: string
    name: string
    description?: string
    address: string
    propertyType: PropertyType
    property_type?: PropertyType
    city: string
    state: string
    country: string
    latitude?: number
    longitude?: number
    kycId?: string
    kyc_id?: string
    isVerified: boolean
    is_verified?: boolean
    isPetAllowed: boolean
    is_pet_allowed?: boolean
    isPartyAllowed: boolean
    is_party_allowed?: boolean
    rules?: string
    isFeatured: boolean
    is_featured?: boolean
    
    // Discount Policies
    long_stay_discount_policy?: IDiscountPolicy
    extension_discount_policy?: IDiscountPolicy
    proposed_long_stay_discount_policy?: IDiscountPolicy
    proposed_extension_discount_policy?: IDiscountPolicy
    
    createdAt: string
    created_at?: string
    updatedAt: string
    updated_at?: string
    owner: IUser
    agent: IUser
    units: IPropertyUnit[]
    verifications: IPropertyVerification[]
    media: IPropertyMedia[]
    amenities: IAmenity[]
    documents: IPropertyDocument[]
    eventTypes?: any[]
    event_types?: any[]
}

export enum DocumentType {
    // INTERNATIONAL_PASSPORT = 'INTERNATIONAL_PASSPORT',
    // DRIVERS_LICENSE = 'DRIVERS_LICENSE',
    UTILITY_BILL = 'UTILITY_BILL',
    POWER_BILL = 'POWER_BILL',
    TENANCY_AGREEMENT = 'TENANCY_AGREEMENT',
    TITLE_DEED = 'TITLE_DEED',
    CERTIFICATE_OF_OCCUPANCY = 'CERTIFICATE_OF_OCCUPANCY',
    EVENT_PERMIT = 'EVENT_PERMIT',
    INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
    OTHER_SUPPORTING_DOCUMENT = 'OTHER_SUPPORTING_DOCUMENT',
}

export interface IPropertyDocument {
    id: string
    property_id: string
    document_type: DocumentType
    document_url: string
    status: PropertyVerificationStatus
    rejection_reason?: string
    created_at: string
    updated_at: string
}

export interface IPropertyDocumentCreate {
    document_type: DocumentType
    document_url: string
}

export interface IUpdatePropertyVerification {
    status: PropertyVerificationStatus,
    feedback: string,
    skip_kyc_check?: boolean,
    skip_document_check?: boolean,
    evidence_urls?: string[],
}

export interface ICreateProperty {
    name: string
    description: string
    address: string
    street_number?: string
    street_name?: string
    postal_code?: string
    landmark?: string
    google_place_id: string
    geocode_raw?: Record<string, unknown>
    property_type: PropertyType
    city: string
    state: string
    country: string
    latitude: number
    longitude: number
    amenities: string[]
    is_pet_allowed: boolean
    is_party_allowed: boolean
    rules?: string
    owner_email?: string
    owner_name?: string
    owner_phone?: string
    owner_id?: string
    zone_id?: string
    booking_mode?: BookingMode
    event_types?: string[]
}

export interface IAssignProperty {
    agent_id: string
}

export interface IUpdateProperty {
    name: string,
    description: string,
    address: string,
    street_number?: string,
    street_name?: string,
    postal_code?: string,
    landmark?: string,
    google_place_id?: string,
    geocode_raw?: Record<string, unknown>,
    property_type: PropertyType,
    city: string,
    state: string,
    country: string,
    latitude: number,
    longitude: number,
    // kyc_id?: string,
    ownerId: string,
    amenities?: string[],
    // assignedAgent?: IUser,
    is_pet_allowed: boolean,
    is_party_allowed: boolean,
    rules?: string,
    owner_email?: string,
    owner_name?: string,
    owner_phone?: string,
    zone_id?: string,
    booking_mode?: BookingMode,
    event_types?: string[]
}

export interface IUpdatePropertyUnit {
    name?: string,
    description?: string,
    price_per_night?: string,
    caution_fee?: string,
    max_guests?: number,
    count?: number,
    is_whole_property?: boolean,
    bedroom_count?: number,
    living_room_count?: number,
    kitchen_count?: number,
    bathroom_count?: number,
    amenities?: string[],
    seating_capacity?: number,
    standing_capacity?: number,
    car_park_spaces?: number,
    power_supply_provision?: string,
    event_price_per_day?: string,
    event_price_per_hour?: string,
    event_price_per_half_day?: string,
    additional_fees?: Array<{
        fee_name: string,
        fee_amount: number,
        is_mandatory: boolean
    }>,
}

export interface ICreatePropertyUnit {
    name: string,
    description: string,
    price_per_night: string,
    max_guests: number,
    count: number,
    is_whole_property: boolean,
    bedroom_count: number,
    living_room_count: number,
    kitchen_count: number,
    bathroom_count: number,
    caution_fee: string,
    amenities: string[],
    seating_capacity?: number,
    standing_capacity?: number,
    car_park_spaces?: number,
    power_supply_provision?: string,
    event_price_per_day?: string,
    event_price_per_hour?: string,
    event_price_per_half_day?: string,
    additional_fees?: Array<{
        fee_name: string,
        fee_amount: number,
        is_mandatory: boolean
    }>,
}

export interface IUploadPropertyMedia {
    media_file: File
    media_type: MediaType
    is_featured: boolean
}

export interface IAvailability {
    id: string
    unit_id: string
    date: string
    count: number
    is_blackout: boolean
    pricing?: number | null
    created_at?: string
    updated_at?: string
}

export interface ICreateAvailability {
    date: string
    count: number
    is_blackout: boolean
    pricing?: number
}

export interface ICreateAvailabilityPayload {
    dates: ICreateAvailability[]
}