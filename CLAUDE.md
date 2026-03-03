# Aparte Admin Dashboard - AI Agent Guide

> **Last Updated:** March 2, 2026
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

### RBAC System (usePermissions hook)

```typescript
// Role checks
isSuperAdmin, isAdmin, isAgent, isOwner, isStaff

// Module access
canViewDashboard, canViewProperties, canViewBookings, canViewUsers, ...

// Action permissions
canCreateProperty, canEditProperty, canDeleteProperty, canVerifyProperty, ...
```

Navigation links in `nav_links.tsx` use `allow` arrays to show/hide based on user role.

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
  role: UserRole  // SUPER_ADMIN, ADMIN, AGENT, OWNER, GUEST, MANAGER
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

**Last Updated:** March 2, 2026
**Version:** 1.0.0
