# Aparte Admin Dashboard - Gemini Agent Guide

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
│   │   └── (pages)/
│   │       ├── auth/                # Login, password reset
│   │       └── (dashboard)/         # Protected dashboard routes
│   │           ├── page.tsx         # Dashboard home
│   │           ├── layout.tsx       # Dashboard layout
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
│   │   ├── providers/               # Redux, React Query, Toast
│   │   ├── ui/                      # Shadcn/UI base components
│   │   ├── booking-mgt/             # Booking views & tables
│   │   ├── properties-mgt/          # Property views & forms
│   │   ├── finance-mgt/             # Approval modals
│   │   ├── table/                   # Data table component
│   │   ├── sidenav.tsx              # Navigation sidebar
│   │   └── icons.tsx                # Icon library
│   │
│   ├── lib/                          # Core library
│   │   ├── api.ts                   # Axios (interceptors, token, 401)
│   │   ├── store.ts                 # Redux + React Query setup
│   │   ├── types.ts                 # IUser, IWallet, IResponse interfaces
│   │   ├── enums.ts                 # UserRole, KycStatus, Gender
│   │   ├── routes/
│   │   │   ├── endpoints.tsx        # API route definitions
│   │   │   ├── nav_links.tsx        # Sidebar nav (role-based visibility)
│   │   │   └── page_routes.tsx      # Frontend routes
│   │   ├── request-handlers/        # TanStack Query hooks
│   │   │   ├── propertyMgt.ts
│   │   │   ├── bookingMgt.ts
│   │   │   ├── unitMgt.ts
│   │   │   ├── userMgt.ts
│   │   │   └── financeMgt.ts
│   │   └── slices/
│   │       ├── authSlice.ts         # User state
│   │       └── alertDialogSlice.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth (login, logout, fetch user)
│   │   ├── usePermissions.ts        # RBAC checks
│   │   ├── useTheme.tsx
│   │   ├── useValidator.ts
│   │   └── useWindowSize.ts
│   │
│   └── layouts/
│       ├── dashboard.tsx            # Dashboard layout (auth, sidebar)
│       └── auth.tsx
│
├── Dockerfile                        # Multi-stage (Node 18 → standalone)
├── cloudbuild.yaml                   # GCP Cloud Build → Cloud Run
├── next.config.ts
├── tailwind.config.ts                # Primary: #124452
└── package.json
```

---

## Core Architecture

### State Management
- **Redux Store**: `auth` (persisted user) + `alertDialog` (transient UI)
- **TanStack Query**: All API data fetching with cache invalidation

### Authentication
1. Login → JWT in cookie (7-day, secure in prod, domain `.aparte.ng`)
2. `useAuth()` fetches `/profile`, syncs to Redux
3. Guest role blocked from admin
4. 401 → auto-logout, clear cookies/state

### RBAC (usePermissions)
- Role flags: `isSuperAdmin`, `isAdmin`, `isAgent`, `isOwner`, `isStaff`
- Module access: `canViewDashboard`, `canViewProperties`, `canViewBookings`, etc.
- Action permissions: `canCreateProperty`, `canVerifyProperty`, etc.

### Request Handler Pattern
```typescript
// src/lib/request-handlers/propertyMgt.ts
export function GetAllProperties(page, limit, searchTerm)  // useQuery
export function CreateProperty()                            // useMutation
// Auto-invalidation on mutation success
```

### API Client (src/lib/api.ts)
- Axios with 30s timeout
- Auto JWT attachment from cookie
- 401 handling → logout + redirect
- Query param sanitization

---

## Key Types

```typescript
interface IUser {
  id, email, phone, role: UserRole
  profile: IUserProfile, wallets?: IWallet[]
}
enum UserRole { SUPER_ADMIN, ADMIN, GUEST, AGENT, OWNER, MANAGER }
enum KycStatus { PENDING, VERIFIED, REJECTED }
```

---

## Page Routes

- `/` - Dashboard
- `/user-management/guests|owners|agents|admins` - User CRUD
- `/property-management/all-properties` - Property list
- `/property-management/all-properties/[id]` - Property details (units, verifications)
- `/booking-management/bookings` - Booking list, create, details
- `/transactions/payments|withdrawals|refunds` - Financial transactions
- `/wallet` - Wallet overview
- `/roles-permissions` - RBAC management
- `/audit-logs` - Audit trail
- `/settings` - Profile, security, payouts

---

## Environment Variables

```
NEXT_PUBLIC_BASE_API_URL=https://api.aparteng.com/api/v1
NEXT_PUBLIC_BASE_LOCAL_API_URL=http://localhost:8008/api/v1
NEXT_PUBLIC_NODE_ENV=development|production
```

---

## Development & Deployment

```bash
yarn dev          # localhost:3000
yarn build        # Production build
```

- **Deploy:** GCP Cloud Run (europe-west1) via Cloud Build
- **Docker:** Multi-stage, standalone output, port 8080
- **Resources:** 512Mi memory, 1 CPU

---

## Quick Reference for Gemini

- **API calls**: Use request handlers in `src/lib/request-handlers/`
- **New page**: Create in `src/app/(pages)/(dashboard)/{section}/page.tsx`
- **New component**: Place in `src/components/{feature}-mgt/`
- **Auth check**: `useAuth()` hook handles login/logout/validation
- **Role check**: `usePermissions()` hook for conditional rendering
- **Data fetching**: TanStack Query (useQuery/useMutation), never raw Axios
- **Forms**: Formik + Yup validation
- **Notifications**: `react-hot-toast`
- **API routes**: Defined in `src/lib/routes/endpoints.tsx`
- **Types**: Core interfaces in `src/lib/types.ts`

---

## Critical Notes for Gemini

1. **Never hardcode API URLs** - Use environment variables
2. **Always check permissions** - Use `usePermissions()` for role-based UI
3. **Follow request handler pattern** - Don't make raw Axios calls from components
4. **Token is in cookies** - Managed by `useAuth()` and Axios interceptor
5. **Only auth state is persisted** - Don't add unnecessary Redux persist data
6. **Guest users are blocked** - Admin dashboard rejects guest role on login
7. **Check existing components first** - 60+ components already exist

---

**Last Updated:** March 2, 2026
**Agent Identification:** Antigravity (Gemini-powered)
**Version:** 1.0.0
