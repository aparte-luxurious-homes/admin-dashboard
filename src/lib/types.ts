import { KycStatus, UserRole, DisputeCategory, DisputeStatus, DisputeOutcome, ExtensionStatus } from "./enums";

export interface IReview {
  id: string;
  booking_id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_flagged: boolean;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IReviewSummary {
  average_rating: number;
  total_reviews: number;
}

export interface IDisputeEvidence {
  id: string;
  media_url: string;
  media_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface IDisputeLog {
  id: string;
  action: string;
  performer_id: string;
  previous_status: DisputeStatus | null;
  new_status: DisputeStatus;
  comment: string | null;
  created_at: string;
}

export interface IDispute {
  id: string;
  dispute_id: string;
  booking_id: string;
  raised_by: string;
  raised_by_role?: UserRole;
  category: DisputeCategory;
  description: string;
  status: DisputeStatus;
  outcome: DisputeOutcome | null;
  admin_notes: string | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  evidence: IDisputeEvidence[];
  logs: IDisputeLog[];
  created_at: string;
  updated_at: string;
}

export interface IReferralInfo {
  code: string;
  link: string;
}

export interface MonthlyStatementData {
  owner_id: string;
  year: number;
  month: number;
  properties_count: number;
  total_bookings: number;
  total_nights: number;
  gross_revenue: number;
  platform_fees: number;
  agent_fees: number;
  net_earnings: number;
  bookings: any[];
}

export interface AgentBookingReportItem {
  booking_id: string;
  property_name: string;
  unit_name: string;
  owner_name: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  nights: number;
  guests: number;
  status: string;
  payment_method?: string;
  gross_amount: number;
  caution_fee: number;
  agent_fee: number;
  caution_refunded: string;
}

export interface AgentPropertyBreakdown {
  property_name: string;
  owner_name: string;
  total_bookings: number;
  nights_booked: number;
  gross_revenue: number;
  agent_commissions_earned: number;
}

export interface AgentFinancialSummary {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  year: number;
  month: number;
  properties_count: number;
  total_bookings: number;
  nights_booked: number;
  total_gross_amount: number;
  total_caution_fees: number;
  total_agent_fees: number;
  excluded_non_ngn_count: number;
  per_property_breakdown: AgentPropertyBreakdown[];
  bookings: AgentBookingReportItem[];
}

export interface AgentAdHocReportSummary {
  requested_by: string;
  report_type: string;
  date_range: string;
  total_bookings: number;
  nights_booked: number;
  total_gross_amount: number;
  total_caution_fees: number;
  total_agent_fees: number;
  excluded_non_ngn_count: number;
  bookings: AgentBookingReportItem[];
}

export interface IAgentReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_bookings: number;
}

export interface IReferralItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface IReferralRelationship {
  referred_user_id: string;
  referred_user_name: string;
  referrer_id: string;
  referrer_name: string;
  referral_code_used: string;
  created_at: string;
}


// Auth and Axios related interfaces

export interface IPaginatedResponse<T> {
  status: 'success' | 'error';
  code: string;
  message: string;
  data: {
    data: T;
    meta: {
      total: number;
      [key: string]: any;
    }
  }
}

export interface IAdminPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
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
  kycProvider?: string | null;
  kyc_provider?: string | null;
  referral_code?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface IUser {
  id: number;
  email: string;
  phone?: string | null;
  firstName: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
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
  referralCode?: string | null;
  referralLink?: string | null;
  // The /admin/users list response flattens KYC to top-level (no `profile` key).
  // The detail response nests under `profile`. Both fields optional so the
  // type works for either shape.
  kycStatus?: KycStatus;
  kyc_status?: KycStatus;
  profile: IUserProfile;
  kyc?: [],
  kycDocuments?: any[],
  wallets?: IWallet[],
  isProfileComplete?: boolean;
  is_profile_complete?: boolean;
  missingProfileFields?: string[];
  missing_profile_fields?: string[];
}

export interface IAuthorization {
  expiresAt: string;
  token: string;
  type: string;
}

export interface IStayExtension {
  id: string;
  extension_id: string;
  booking_id: string;
  requested_by: string;
  original_end_date: string;
  new_end_date: string;
  extra_nights: number;
  price_per_night: number;
  extension_amount: number;
  status: ExtensionStatus;
  payment_method: string;
  created_at: string;
  updated_at: string;
  owner_decision_by?: string;
  owner_decision_at?: string;
  rejection_reason?: string;
}

export interface ILoginResponse {
  user: IUser;
  authorization: IAuthorization;
}

export interface IIcalFeed {
  id: string;
  unit_id: string | number;
  direction: 'INBOUND' | 'OUTBOUND';
  url: string;
  label: string;
  token?: string;
  last_polled_at?: string;
  last_status: 'OK' | 'ERROR' | 'BROKEN' | 'PENDING';
  error_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IIcalConflict {
  id: string;
  unit_id: string | number;
  aparte_booking_id: string | number;
  external_uid: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface IExternalBookingGroup {
  external_uid: string;
  external_summary: string;
  dates: string[];
}