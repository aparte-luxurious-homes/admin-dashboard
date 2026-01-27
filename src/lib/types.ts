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


export interface IWallet {
  id: string,
  userId: number,
  balance: string,
  pendingCash: string,
  currency: string,
  createdAt: string,
  updatedAt: string
}

export interface IUserProfile {
  id: number;
  userId: number;
  user_id?: number;
  firstName: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  gender?: string;
  dob?: string;
  address?: string;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  bvn: string | null;
  nin: string | null;
  profileImage: string | null;
  profile_image?: string | null;
  averageRating: string;
  average_rating?: string;
  kycStatus: KycStatus;
  kyc_status?: KycStatus;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface IUser {
  id: number;
  email: string;
  phone?: string | null;
  isActive: boolean;
  is_active?: boolean;
  isVerified: boolean;
  is_verified?: boolean;
  lastLogin?: string;
  last_login?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  role: UserRole;
  verificationToken?: string;
  verification_token?: string;
  profile: IUserProfile;
  kyc?: [],
  wallets?: IWallet[],
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