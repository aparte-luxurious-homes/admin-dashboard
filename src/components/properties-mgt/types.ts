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
    OTHERS = 'OTHERS',
}

export interface IAmenity {
    id: number
    name: string
    createdAt?: string
    updatedAt?: string
}



export interface IPropertyVerification {
    id: number
    propertyId: number
    property_id?: number
    agentId: number
    agent_id?: number
    status: PropertyVerificationStatus
    feedback: string
    verificationDate?: string
    verification_date?: string
    createdAt: string
    created_at?: string
    agent: IUser
    property: IProperty
}

export interface IAmenityAssignment {
    id: number
    amenityId: number
    assignableId: number
    assignableType: AssignableType
    createdAt: string
    amenity: IAmenity
}

export interface IAssignAmenity {
    amenity_ids: number[]
}

export interface IPropertyReview {
    id: number
    unitId: number
    userId: number
    rating: number
    review?: string
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
    assignableId: number
    assignableType: AssignableType
    uploadedAt: string
}

export interface IPropertyUnit {
    id: number
    propertyId: number
    property_id?: number
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
    id: number
    ownerId: number
    owner_id?: number
    assignedAgent?: number
    assigned_agent?: number
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
    kycId?: number
    kyc_id?: number
    isVerified: boolean
    is_verified?: boolean
    isPetAllowed: boolean
    is_pet_allowed?: boolean
    isFeatured: boolean
    is_featured?: boolean
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
}

export enum DocumentType {
    PROOF_OF_OWNERSHIP = 'PROOF_OF_OWNERSHIP',
    GOVERNMENT_ID = 'GOVERNMENT_ID',
    UTILITY_BILL = 'UTILITY_BILL',
    OTHERS = 'OTHERS'
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
}

export interface ICreateProperty {
    name: string
    description: string
    address: string
    property_type: PropertyType
    city: string
    state: string
    country: string
    latitude: number
    longitude: number
    amenities: number[]
    // kyc_id: number
    is_pet_allowed: boolean
    owner_email?: string
    owner_name?: string
}

export interface IAssignProperty {
    agent_id: string
}

export interface IUpdateProperty {
    name: string,
    description: string,
    address: string,
    property_type: PropertyType,
    city: string,
    state: string,
    country: string,
    latitude: number,
    longitude: number,
    // kyc_id?: number,
    ownerId: number,
    amenities?: number[],
    // assignedAgent?: IUser,
    is_pet_allowed: boolean,
    owner_email?: string,
    owner_name?: string
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
    amenities?: number[],
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
    bathroom_count: number
    amenities: number[]
}

export interface IUploadPropertyMedia {
    media_file: File
    media_type: MediaType
    is_featured: boolean
}

export interface IAvailability {
    id: string | number
    unit_id: string | number
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