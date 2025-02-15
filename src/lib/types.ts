import { KycStatus, UserRole } from "./enums";

// Auth and Axios related interfaces

export interface IResponse<T> {
  total_count: number;
  status: 'success' | 'error';
  code: string;
  message: string;
  count?: number;
  data: T;
}

export interface IBaseResponse<T> {
  status: 'success' | 'error';
  code: string;
  message: string;
  data: T;
}
  
export interface IErrorResponse {
  error_code: string;
  message: string;
}


export interface IUserProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string | null;
  gender: string | null;
  dob: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  bvn: string | null;
  nin: string | null;
  profileImage: string | null;
  averageRating: string;
  kycStatus: KycStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface IUser {
  id: number;
  email: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt?: string;
  role: UserRole;
  verificationToken: string | null;
  profile: IUserProfile;
}

export interface IAuthorization {
  expiresAt: string;
  token: string;
  type: string;
}

export interface ILoginResponse {
  user: IUser;
  authorization: IAuthorization;
}