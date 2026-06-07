# Aparte Admin Dashboard - AI Agent Guide

> **Last Updated:** May 2, 2026
> **Project Type:** Admin Management Portal for Aparte Property Platform
> **Stack:** Next.js 15 + React 19 + TypeScript + Redux Toolkit + TanStack Query

---

## Project Overview

The **Admin Dashboard** is the management portal for the Aparte property platform. It enables admins, owners, and agents to manage properties, bookings, users, finances, and platform operations.

**This is a frontend application** that consumes the Aparte API v1 backend (`api-v1/`).

### Platform Context

Aparte has 3 repos in this workspace:
- **api-v1/** - FastAPI backend (PostgreSQL, payment gateways, wallet system)
- **admin-dashboard/** (this repo) - Next.js management portal
- **landing-page/** - React customer-facing booking site

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js (App Router) | 15.1.11 |
| **UI Library** | React | 19.0.0 |
| **Language** | TypeScript | 5+ |
| **Styling** | Tailwind CSS + MUI 6.4.5 + Emotion | 3.4.1 |
| **State** | Redux Toolkit + Redux Persist | 2.5.1 |
| **Data Fetching** | TanStack Query (React Query) | 5.66.0 |
| **HTTP Client** | Axios | 1.7.9 |
| **Forms** | Formik + Yup | 2.4.6, 1.6.1 |
| **Charts** | Chart.js + react-chartjs-2 | 4.4.8, 5.3.0 |
| **PDF** | jsPDF + jspdf-autotable | 3.0.0, 5.0.2 |
| **Monitoring** | Sentry | 8.54.0 |
| **Package Manager** | Yarn | 1.22.22 |

---

## Repository Structure

```
admin-dashboard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout with Providers
│   │   ├── globals.css
│   │   └── (pages)/
│   │       ├── auth/                # Login, password reset
│   │       └── (dashboard)/         # Protected dashboard routes
│   │           ├── page.tsx         # Dashboard home
│   │           ├── layout.tsx       # Dashboard layout (sidebar, topbar)
│   │           ├── audit-logs/
│   │           ├── booking-management/
│   │           ├── property-management/
│   │           ├── user-management/
│   │           ├── transactions/
│   │           ├── settings/
│   │           ├── roles-permissions/
│   │           ├── notifications/
│   │           └── wallet/
│   │
│   ├── components/                   # UI Components (~60 files)
│   │   ├── providers/               # Redux, React Query, Toast providers
│   │   ├── ui/                      # Shadcn/UI base components
│   │   ├── booking-mgt/             # Booking management views
│   │   ├── properties-mgt/          # Property management views
│   │   ├── finance-mgt/             # Finance approval modals
│   │   ├── audit-logs/
│   │   ├── roles-permissions/
│   │   ├── user-management/
│   │   ├── table/                   # Data table with pagination
│   │   ├── sidenav.tsx              # Navigation sidebar
│   │   └── icons.tsx                # Custom icon library
│   │
│   ├── lib/                          # Core library
│   │   ├── api.ts                   # Axios instance (interceptors, token, 401 handling)
│   │   ├── store.ts                 # Redux store + React Query client
│   │   ├── types.ts                 # TypeScript interfaces (IUser, IWallet, IResponse)
│   │   ├── enums.ts                 # UserRole, KycStatus, Gender
│   │   ├── routes/
│   │   │   ├── endpoints.tsx        # API endpoint definitions
│   │   │   ├── nav_links.tsx        # Sidebar navigation (role-based)
│   │   │   └── page_routes.tsx      # Frontend page routes
│   │   ├── request-handlers/        # TanStack Query hooks
│   │   │   ├── propertyMgt.ts       # Property CRUD, verifications, media
│   │   │   ├── bookingMgt.ts        # Booking CRUD, payment proof
│   │   │   ├── unitMgt.ts           # Unit management
│   │   │   ├── userMgt.ts           # User management
│   │   │   └── financeMgt.ts        # Refund/withdrawal approval
│   │   ├── slices/
│   │   │   ├── authSlice.ts         # User state (setUser, clearUser)
│   │   │   └── alertDialogSlice.ts  # Alert dialog state
│   │   └── utils.ts
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts               # Auth (login, logout, user fetching)
│   │   ├── usePermissions.ts        # RBAC (role checks, module/action permissions)
│   │   ├── useTheme.tsx
│   │   ├── useValidator.ts
│   │   └── useWindowSize.ts
│   │
│   ├── layouts/
│   │   ├── dashboard.tsx            # Dashboard layout (auth check, sidebar, topbar)
│   │   └── auth.tsx                 # Auth pages layout
│   │
│   └── data/                         # Static data (amenities, countries)
│
├── Dockerfile                        # Multi-stage build (Node 18 → standalone)
├── cloudbuild.yaml                   # GCP Cloud Build → Cloud Run
├── next.config.ts                    # Standalone output, Sentry, Cloudinary images
├── tailwind.config.ts                # Primary: #124452, Background: #F3F3F3
├── package.json
└── yarn.lock
```

---

## Architecture & Patterns

### State Management

**Redux Store:**
```typescript
{
  auth: { user: IUser | null },       // Persisted in localStorage
  alertDialog: { isOpen, title, ... } // Transient UI state
}
```

**TanStack Query:** Used for all API data fetching with automatic cache invalidation on mutations.

### Authentication Flow

1. Login via `POST /auth/login` → JWT token stored in cookie (7-day expiry, secure in production)
2. `useAuth()` hook fetches `/profile` to validate user and sync to Redux
3. Guest role users are blocked from admin dashboard
4. 401 responses trigger auto-logout with cookie/state cleanup
5. Cookie domain: `.aparte.ng` in production

**Phone-OTP gate (added 2026-05-02):** Onboarded staff with `phone_verified=false` get a 401 with `detail.code === 'PHONE_VERIFICATION_REQUIRED'` on first login. The login page detects this and opens [src/components/auth/PhoneOtpModal.tsx](src/components/auth/PhoneOtpModal.tsx) with the masked phone, a 6-digit auto-advance input (paste-friendly), 60-second resend cooldown matching backend rate limit, and an email-fallback button (`POST /auth/phone/request-otp-via-email`). Successful verify (`POST /auth/phone/verify`) returns a full JWT and completes the login the same way as a normal password flow. Hooks live in `src/hooks/useAuth.ts` (`useRequestPhoneOtp`, `useRequestPhoneOtpViaEmail`, `useVerifyPhoneOtp`).

### RBAC System (usePermissions hook)

```typescript
// Role checks (synchronous — derived from user.role, no network call)
isSuperAdmin, isAdmin, isAgent, isOwner, isStaff

// Module access flags (synchronous, role-based — render nav links instantly)
canViewDashboard, canViewProperties, canViewBookings, canViewUsers,
canViewRolesPermissions, ...

// Action permissions (synchronous, role-based)
canCreateProperty, canEditProperty, canDeleteProperty, canVerifyProperty, ...

// Granular permissions (async, DB-backed — mirrors backend's
// services/permissions/service.py::user_has_permission)
permissions: Permission[]              // current user's granular perms
permissionsLoading: boolean
hasPermission(name: string) => boolean // SUPER_ADMIN auto-passes
```

Navigation links in `nav_links.tsx` use `allow` arrays to show/hide based on user role.

**Granular vs role-based:** the synchronous role flags drive nav rendering and route gating (instant, no flicker). The async `hasPermission(name)` call is for fine-grained in-page UI gates (e.g. "show this Delete button only if `users.delete` is granted") and matches the seeded permission catalog in the backend. They're complementary — use role flags for layout, `hasPermission` for surgical button-level gates.

### Permissions Management Page (RolesPermissionsView)

Lives at `/roles-permissions` ([src/components/roles-permissions/](src/components/roles-permissions/)). Full e2e flow:
- Create / edit-description / delete a permission resource (`CreatePermissionModal`, `EditPermissionModal`, `DeletePermissionConfirm`)
- Assign / revoke per role with parallel `Promise.allSettled` saves (failed toggles stay pending for retry)
- Seed defaults button calls `POST /permissions/seed`
- React Query handler: [src/lib/request-handlers/permissionsMgt.ts](src/lib/request-handlers/permissionsMgt.ts) — query keys `permissions:list` / `permissions:role`, 5-min `staleTime` matching the backend TTL cache
- Delete buttons visible only to SUPER_ADMIN (matches backend `require_super_admin` on DELETE endpoints)

### Request Handler Pattern

Each API domain has a request handler file exporting TanStack Query hooks:

```typescript
// Example: src/lib/request-handlers/propertyMgt.ts
export function GetAllProperties(page, limit, searchTerm, role?, id?)
export function GetSingleProperty(propertyId)
export function CreateProperty()         // useMutation
export function UpdateProperty()         // useMutation
export function DeleteProperty()         // useMutation
// ... auto-invalidation on success
```

### API Client (src/lib/api.ts)

- Axios instance with 30-second timeout
- Request interceptor: attaches JWT from cookie, normalizes URL
- Response interceptor: handles 401 (auto-logout), sanitizes query params
- Base URL from environment variables (production/staging/local)

---

## Key Interfaces

```typescript
interface IUser {
  id, email, phone, firstName, lastName, isActive, isVerified
  role: UserRole  // SUPER_ADMIN, ADMIN, OPERATIONS_ADMIN, SUPPORT_ADMIN, ANALYST, AGENT, OWNER, GUEST  (MANAGER was removed 2026-05-02 — frontend now matches backend's 8 roles)
  profile: IUserProfile
  wallets?: IWallet[]
}

interface IUserProfile {
  firstName, lastName, gender, dob, address, city, state, country
  profileImage, averageRating, kycStatus, nin, bvn
}

interface IWallet {
  id, userId, balance, pendingCash, currency
}

interface IResponse<T> {
  total_count, status, code, message, data: T
}
```

---

## Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard home |
| `/user-management/guests\|owners\|agents\|admins` | User management by role |
| `/property-management/all-properties` | Property listing & CRUD |
| `/property-management/all-properties/[id]` | Property details |
| `/property-management/all-properties/[id]/units/[unitId]` | Unit details |
| `/property-management/manage-verifications` | Property verification queue |
| `/property-management/assign-agents` | Agent assignment |
| `/booking-management/bookings` | Booking list & management |
| `/booking-management/bookings/create` | Create booking |
| `/booking-management/bookings/[id]` | Booking details |
| `/booking-management/booking-disputes` | Dispute management |
| `/transactions/payments\|withdrawals\|refunds\|booking-withdrawals` | Financial transactions |
| `/wallet` | Wallet overview |
| `/roles-permissions` | RBAC management |
| `/audit-logs` | System audit trail |
| `/notifications/create\|manage` | Notification management |
| `/settings` | User settings (profile, security, payouts) |

---

## Environment Variables

```
NEXT_PUBLIC_BASE_API_URL=https://api.aparteng.com/api/v1
NEXT_PUBLIC_BASE_STAGING_API_URL=...
NEXT_PUBLIC_BASE_LOCAL_API_URL=http://localhost:8008/api/v1
NEXT_PUBLIC_NODE_ENV=development|production
```

---

## Development

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # Production build
yarn lint         # ESLint
```

## Deployment

- **Platform:** GCP Cloud Run (europe-west1)
- **Build:** Docker multi-stage (Node 18-alpine → standalone Next.js)
- **CI/CD:** Cloud Build (`cloudbuild.yaml`)
- **Resources:** Memory 512Mi, CPU 1, Timeout 300s
- **Monitoring:** Sentry (org: aparte, project: admin-dashboard)

---

## Development Guidelines

1. **Follow existing patterns** - Use request handlers in `src/lib/request-handlers/` for API calls
2. **Use TanStack Query** - All data fetching via useQuery/useMutation hooks
3. **Check permissions** - Use `usePermissions()` hook for role-based UI
4. **Component organization** - Feature-specific components go in `src/components/{feature}-mgt/`
5. **Type safety** - Define interfaces in `src/lib/types.ts` or feature-specific `types.ts`
6. **Toast notifications** - Use `react-hot-toast` for user feedback
7. **Forms** - Use Formik + Yup for form handling and validation
8. **Never hardcode API URLs** - Always use environment variables via `src/lib/routes/endpoints.tsx`
9. **Token management** - Handled by `useAuth()` hook and Axios interceptor; never manage manually
10. **State persistence** - Only auth user is persisted; avoid persisting unnecessary data

---

## Notable conventions (added 2026-05-02)

- **`images.unoptimized: true`** in [next.config.ts](next.config.ts). Vercel's image-optimization API is bypassed entirely (the staging deployment hit the Hobby-tier quota and returned 402 on every transform). All `<Image>` renders are passthroughs to Cloudinary / GCS — both already provide CDN. If responsive sizing / AVIF transcoding becomes necessary later, wire `images.loader: 'custom'` with a Cloudinary fetch URL builder rather than re-enabling Vercel optimization.
- **AutoBreadcrumb section-only segments.** [src/components/breadcrumb/AutoBreadcrumb.tsx](src/components/breadcrumb/AutoBreadcrumb.tsx) maintains a `NON_NAVIGABLE_SEGMENTS` set covering `booking-management`, `notifications`, `property-management`, `transactions`, `user-management`. Those route segments have no `page.tsx` so rendering them as `<Link>` causes Next.js to prefetch a non-existent route and 404. Render as plain text. If you add a parent overview page for one of those sections, remove the segment from the set.
- **Stepper inputs (units / guests count).** Use the transient string state pattern documented in [BookingSidebar.tsx](../landing-page/src/components/property/BookingSidebar.tsx) — `<input type="number">` with `value={transientStringState}`, `onFocus={(e) => e.target.select()}`, `onChange` allowing empty mid-edit, `onBlur` clamp. Direct numeric binding produces the append-then-clamp + empty-snaps-back bugs.
- **Admin-on-behalf KYC upload.** [KycReviewPanel.tsx](src/components/user-management/KycReviewPanel.tsx) has an "Upload on behalf" button gated by `KYC_UPLOAD_ROLES = {SUPER_ADMIN, ADMIN, OPERATIONS_ADMIN}` mirroring the backend (SUPPORT_ADMIN excluded). Modal: [KycUploadOnBehalfModal.tsx](src/components/user-management/KycUploadOnBehalfModal.tsx). Hook: `UploadKycOnBehalf` in `userMgt.ts`.

---

**Last Updated:** May 2, 2026
**Version:** 1.0.0
