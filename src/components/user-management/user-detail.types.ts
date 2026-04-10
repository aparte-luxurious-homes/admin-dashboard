export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dob: string | null;
  bio: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  kycStatus: string;
  profileImage: string | null;
  averageRating: number | null;
  nin: string | null;
  bvn: string | null;
  referralCode: string | null;
}

export interface Wallet {
  id: string;
  balance: string;
  pendingCash: string;
  currency: string;
}

export interface UserDetail {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string | null;
  profile: UserProfile;
  wallets: Wallet[];
}

export interface RoleConfig {
  role: string;
  label: string;
  breadcrumbActive: string;
  breadcrumbLink: string;
  breadcrumbLinkName: string;
  successMessage: string;
}

function str(val: unknown): string | null {
  return typeof val === "string" && val ? val : null;
}

function normalizeWallet(raw: any): Wallet {
  return {
    id: String(raw.id ?? ""),
    balance: String(raw.balance ?? raw.Balance ?? "0"),
    pendingCash: String(raw.pendingCash ?? raw.pending_cash ?? raw.PendingCash ?? "0"),
    currency: String(raw.currency ?? raw.Currency ?? "NGN"),
  };
}

export function normalizeUser(raw: any): UserDetail {
  const p = raw.profile ?? {};
  return {
    id: String(raw.id ?? ""),
    email: raw.email ?? "",
    phone: str(raw.phone),
    role: typeof raw.role === "string" ? raw.role : raw.role?.value ?? "",
    isActive: raw.isActive ?? raw.is_active ?? false,
    isVerified: raw.isVerified ?? raw.is_verified ?? false,
    createdAt: str(raw.createdAt ?? raw.created_at),
    profile: {
      firstName: str(p.firstName ?? p.first_name ?? raw.firstName ?? raw.first_name),
      lastName: str(p.lastName ?? p.last_name ?? raw.lastName ?? raw.last_name),
      gender: str(p.gender),
      dob: str(p.dob),
      bio: str(p.bio),
      address: str(p.address),
      city: str(p.city),
      state: str(p.state),
      country: str(p.country),
      kycStatus: p.kycStatus ?? p.kyc_status ?? "PENDING",
      profileImage: str(p.profileImage ?? p.profile_image ?? raw.profileImage ?? raw.profile_image),
      averageRating: p.averageRating != null ? Number(p.averageRating) : p.average_rating != null ? Number(p.average_rating) : null,
      nin: str(p.nin),
      bvn: str(p.bvn),
      referralCode: str(p.referral_code ?? p.referralCode),
    },
    wallets: Array.isArray(raw.wallets) ? raw.wallets.map(normalizeWallet) : [],
  };
}
