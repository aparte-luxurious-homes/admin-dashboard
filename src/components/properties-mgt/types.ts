import { IUser } from "@/src/lib/types"
import { IAvailability, IBooking } from "../booking-mgt/types"

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
    createdAt: string
    updatedAt: string
}



export interface IPropertyVerification {
    id: number
    propertyId: number
    agentId: number
    status: PropertyVerificationStatus
    feedback: string
    verificationDate?: string
    createdAt: string
    agent: IUser
}

export interface IAmenityAssignment {
    id: number
    amenityId: number
    assignableId: number
    assignableType: AssignableType
    createdAt: string
    amenity: IAmenity
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
    id: number
    mediaUrl: string
    mediaType: MediaType
    isFeatured: boolean
    assignableId: number
    assignableType: AssignableType
    uploadedAt: string
}

export interface IPropertyUnit {
    id: number
    propertyId: number
    name: string
    description?: string
    pricePerNight: string
    cautionFee: string
    maxGuests: number
    count: number
    isWholeProperty: boolean
    bedroomCount: number
    livingRoomCount: number
    kitchenCount: number
    bathroomCount: number
    isVerified: boolean
    createdAt: string
    updatedAt: string
    property?: IProperty
    media: IPropertyMedia[]
    reviews: IPropertyReview[]
    amenities: IAmenityAssignment[]
    availability: IAvailability[]
    bookings: IBooking[]
}


export interface IProperty {
    id: number
    ownerId: number
    assignedAgent?: number
    name: string
    description?: string
    address: string
    propertyType: PropertyType
    city: string
    state: string
    country: string
    latitude?: number
    longitude?: number
    kycId?: number
    isVerified: boolean
    isPetAllowed: boolean
    isFeatured: boolean
    createdAt: string
    updatedAt: string
    owner: IUser
    agent: IUser
    units: IPropertyUnit[]
    verifications: IPropertyVerification
    media: IPropertyMedia[]
    amenities: IAmenityAssignment[]
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
    kyc_id: number,
    ownerId: number,
    // assignedAgent?: IUser,
    is_pet_allowed: boolean
}

export interface IUpdatePropertyUnit {
    name: string,
    description: string,
    pricePerNight: string,
    cautionFee: string,
    maxGuests: number,
    count: number,
    isWholeProperty: boolean,
    bedroomCount: number,
    livingRoomCount: number,
    kitchenCount: number,
    bathroomCount: number
}