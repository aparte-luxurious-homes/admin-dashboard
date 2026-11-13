# Admin Dashboard — Architecture Reference

> **Stack:** Next.js 15.1.6 · React 19 · TypeScript 5 · Redux Toolkit 2.5.1 · React Query 5.66.0 · Axios 1.7.9 · Material-UI 6.4.5 · Tailwind CSS 3.4.1
> **Deployed:** Vercel
> **Last Updated:** 2026-03-10

---

## Table of Contents
1. [Directory Structure](#directory-structure)
2. [Next.js App Router — Pages](#nextjs-app-router--pages)
3. [State Management](#state-management)
4. [API Layer](#api-layer)
5. [Authentication Flow](#authentication-flow)
6. [Role-Based Access Control](#role-based-access-control)
7. [Key Components](#key-components)
8. [Type System](#type-system)
9. [Configuration](#configuration)

---

## Directory Structure

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── (pages)/
│   │   │   ├── (dashboard)/          # All protected routes + dashboard layout
│   │   │   │   ├── layout.tsx        # Dashboard shell (sidebar + header)
│   │   │   │   ├── page.tsx          # Home: KPI cards + charts
│   │   │   │   ├── audit-logs/
│   │   │   │   ├── booking-management/
│   │   │   │   │   ├── bookings/           # List + detail + create
│   │   │   │   │   │   └── [bookingId]/
│   │   │   │   │   └── booking-disputes/
│   │   │   │   ├── property-management/
│   │   │   │   │   ├── all-properties/     # List + detail + create
│   │   │   │   │   │   └── [propertyId]/
│   │   │   │   │   │       ├── units/
│   │   │   │   │   │       │   └── [unitId]/
│   │   │   │   │   │       └── create-unit/
│   │   │   │   │   ├── assign-agents/
│   │   │   │   │   └── manage-verifications/
│   │   │   │   ├── roles-permissions/
│   │   │   │   ├── settings/               # personal-info, login-security, payments-payouts
│   │   │   │   ├── transactions/           # payments, refunds, withdrawals
│   │   │   │   ├── user-management/        # guests, owners, agents, admins
│   │   │   │   └── wallet/
│   │   │   └── auth/                 # Unprotected pages
│   │   │       ├── login/
│   │   │       └── password-reset/
│   │   ├── layout.tsx                # Root: Providers wrapper
│   │   └── globals.css
│   │
│   ├── components/                   # UI components by feature domain
│   │   ├── providers/                # ReduxProvider, QueryClientProvider, etc.
│   │   ├── booking-mgt/
│   │   ├── properties-mgt/
│   │   ├── finance-mgt/
│   │   ├── user-management/
│   │   ├── roles-permissions/
│   │   ├── transactions/
│   │   ├── ui/                       # Radix UI primitives
│   │   ├── sidenav.tsx               # Main navigation (role-filtered)
│   │   └── icons.tsx                 # SVG icon registry
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # fetch user, login/logout, auth state
│   │   ├── usePermissions.ts         # role-based permission flags
│   │   ├── useTheme.tsx
│   │   └── useWindowSize.ts
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios instance + interceptors
│   │   ├── store.ts                  # Redux store (auth + alertDialog)
│   │   ├── types.ts                  # IUser, IWallet, IBooking, etc.
│   │   ├── enums.ts                  # UserRole, KycStatus, Gender
│   │   ├── utils.ts                  # formatMoney, formatDate, downloadPDF
│   │   ├── slices/
│   │   │   ├── authSlice.ts          # {user: IUser | null}
│   │   │   └── alertDialogSlice.ts
│   │   ├── routes/
│   │   │   ├── endpoints.tsx         # API_ROUTES object (type-safe endpoints)
│   │   │   ├── page_routes.tsx       # PAGE_ROUTES object (frontend routes)
│   │   │   └── nav_links.tsx         # ROLE_NAV_LINKS (sidebar by role)
│   │   └── request-handlers/         # React Query mutation/query hooks
│   │       ├── auth.ts
│   │       ├── userMgt.ts
│   │       ├── propertyMgt.ts
│   │       ├── bookingMgt.ts
│   │       ├── financeMgt.ts
│   │       └── unitMgt.ts
│   │
│   └── instrumentation.ts            # Sentry initialization
│
├── public/
├── package.json
├── next.config.ts                    # Sentry, standalone output, image remotePatterns
├── tailwind.config.ts
└── tsconfig.json
```

---

## Next.js App Router — Pages

### Route Groups

- `(pages)` — Top-level grouping (no URL segment)
- `(dashboard)` — All protected routes that render inside the Dashboard layout

### Route Map

| Route | Component | Auth | Role Restriction |
|-------|-----------|------|-----------------|
| `/auth/login` | LoginPage | No | Any |
| `/auth/password-reset` | PasswordReset | No | Any |
| `/` | Dashboard home | Yes | All staff |
| `/user-management/guests` | GuestList | Yes | ADMIN+ |
| `/user-management/owners` | OwnerList | Yes | ADMIN+ |
| `/user-management/agents` | AgentList | Yes | ADMIN+ |
| `/user-management/admins` | AdminList | Yes | SUPER_ADMIN |
| `/property-management/all-properties` | PropertyList | Yes | ADMIN+, AGENT, OWNER |
| `/property-management/all-properties/[propertyId]` | PropertyDetail | Yes | ADMIN+, AGENT, OWNER |
| `/property-management/all-properties/[propertyId]/units/[unitId]` | UnitDetail | Yes | ADMIN+, AGENT, OWNER |
| `/property-management/manage-verifications` | VerificationQueue | Yes | ADMIN+, AGENT |
| `/property-management/assign-agents` | AssignAgents | Yes | ADMIN+ |
| `/booking-management/bookings` | BookingList | Yes | ADMIN+, AGENT, OWNER |
| `/booking-management/bookings/[bookingId]` | BookingDetail | Yes | All with access |
| `/booking-management/bookings/create` | CreateBooking | Yes | ADMIN+, AGENT |
| `/transactions/payments` | PaymentList | Yes | ADMIN+ |
| `/transactions/withdrawals` | WithdrawalList | Yes | ADMIN+ |
| `/transactions/refunds` | RefundList | Yes | ADMIN+ |
| `/wallet` | WalletDashboard | Yes | All staff |
| `/roles-permissions` | RolesAndPermissions | Yes | ADMIN+ |
| `/audit-logs` | AuditLogs | Yes | ADMIN+ |
| `/settings` | Settings | Yes | All staff |

---

## State Management

### Dual-layer architecture

```
Redux (global, persisted)           React Query (server state, cached)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
auth.user: IUser | null              "authUser": IUser
alertDialog: {isOpen, ...}           "properties": IProperty[]
                                     "bookings": IBooking[]
Persisted to localStorage            "users": IUser[]
via redux-persist                    "transactions": ITransaction[]
                                     etc.
Survives page reload                 5-min stale time, auto-refetch
```

### Redux Slices

```typescript
// authSlice
{ user: IUser | null }
Actions: setUser(user: IUser), clearUser()

// alertDialogSlice
{ isOpen: boolean, title: string, description: string, confirmText: string, onConfirm: fn }
Actions: showAlert(config), closeAlert()
```

### When to use which

- **Redux:** User identity (persists across navigation, SSR hydration)
- **React Query:** Any data that can go stale (properties, bookings, users, transactions)

---

## API Layer

### Axios Instance (`src/lib/api.ts`)

```typescript
const axiosRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_API_URL,
  timeout: 30000,
});
```

**Request Interceptor:**
1. Normalize baseURL to include `/api/v1`
2. Strip leading slashes from URL
3. Attach JWT from cookie: `Authorization: Bearer {token}`
4. Remove empty query params (prevents `?role=&is_verified=`)
5. Dev mode: log final request URL

**Response Interceptor:**
1. On 401: remove token cookie → clear Redux user → invalidate RQ cache → redirect `/auth/login`
2. Dedup flag prevents multiple simultaneous redirects

### Request Handlers (React Query)

**Pattern:**
```typescript
// Query (GET)
export function GetAllProperties(params) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => axiosRequest.get(API_ROUTES.properties.base, { params }),
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation (POST/PUT/DELETE)
export function CreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosRequest.post(API_ROUTES.properties.base, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}
```

**Available modules in `src/lib/request-handlers/`:**
- `auth.ts` — `useLogin`, `useLogout`, `fetchUser`
- `userMgt.ts` — `GetAllUsers`, `CreateUser`, `UpdateUser`, `DeleteUser`
- `propertyMgt.ts` — Property + unit + media + amenity + verification hooks
- `bookingMgt.ts` — Booking CRUD + status management
- `financeMgt.ts` — Wallet, transaction, withdrawal hooks
- `unitMgt.ts` — Unit-specific management hooks

### API Routes (`src/lib/routes/endpoints.tsx`)

Centralized type-safe endpoint map. Always reference via `API_ROUTES`, never hardcode strings.

---

## Authentication Flow

### Login

```typescript
// 1. User submits on /auth/login
const loginMutation = useLogin();

// 2. Call POST /auth/login
await loginMutation.mutateAsync({ email, password });

// 3. Response: { user, authorization: { token, expiresAt } }

// 4. Validate role (GUEST blocked):
if (user.role === UserRole.GUEST) throw new Error("Access Denied");

// 5. Store token in cookie (domain-aware)
setCookie("token", token, { domain, secure, httpOnly: false });

// 6. Redux: setUser(user)
dispatch(setUser(user));

// 7. React Query: setQueryData(["authUser"], user)

// 8. Navigate to "/"
```

### Session Persistence

- Token cookie: 7-day expiry (not refreshed — user must re-login after expiry)
- Redux `user` persisted to localStorage via `redux-persist`
- On page load: if token + no Redux user → `useAuth` hook fetches `/profile`
- Refetch interval: 5 minutes

### Protected Routes

```typescript
// Dashboard layout:
const { token } = getCookies();
const { user } = useAppSelector((state) => state.auth);

if (!token && !user) {
  redirect("/auth/login");
}
```

---

## Role-Based Access Control

### Permission Flags (`src/hooks/usePermissions.ts`)

```typescript
const permissions = {
  canViewDashboard: [ADMIN, SUPER_ADMIN, OPERATIONS_ADMIN, SUPPORT_ADMIN, ANALYST, OWNER, AGENT],
  canViewProperties: [ADMIN, SUPER_ADMIN, OPERATIONS_ADMIN, OWNER, AGENT],
  canViewBookings: [ADMIN, SUPER_ADMIN, OPERATIONS_ADMIN, SUPPORT_ADMIN, OWNER, AGENT],
  canViewUsers: [ADMIN, SUPER_ADMIN, SUPPORT_ADMIN],
  canViewAuditLogs: [ADMIN, SUPER_ADMIN],
  canManageFinances: [ADMIN, SUPER_ADMIN],
  canCreateProperty: [OWNER, AGENT, ADMIN, SUPER_ADMIN],
  canVerifyProperty: [AGENT, ADMIN, SUPER_ADMIN],
};
```

### Sidebar Navigation

`src/lib/routes/nav_links.tsx` defines navigation items per role. `sidenav.tsx` filters based on `usePermissions()`. The backend enforces authorization on every API call regardless of UI visibility.

---

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Sidenav` | `components/sidenav.tsx` | Role-filtered main navigation |
| `Dashboard Layout` | `app/(pages)/(dashboard)/layout.tsx` | Shell: sidebar + header + content |
| `DataGrid tables` | `components/*/tables/` | MUI DataGrid with custom columns |
| `AlertDialog` | `components/ui/` | Radix UI confirm dialog (Redux-driven) |
| `StatsCard` | `components/statcard/` | KPI card display |
| `UsersChart` | `components/userchart/` | Line chart (Chart.js) |
| `MobileOverlay` | `components/MobileOverlay.tsx` | Mobile hamburger menu |

### Adding a New Feature Page

1. Create `src/app/(pages)/(dashboard)/{feature}/page.tsx`
2. Add API hook in `src/lib/request-handlers/{feature}.ts`
3. Add route constant in `src/lib/routes/page_routes.tsx`
4. Add API endpoint in `src/lib/routes/endpoints.tsx`
5. Add to nav links in `src/lib/routes/nav_links.tsx` (with role restriction)
6. Add permission flag in `src/hooks/usePermissions.ts` if needed

---

## Type System

Key interfaces in `src/lib/types.ts`:

```typescript
interface IUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  profile: IUserProfile;
  wallets?: IWallet[];
}

interface IWallet {
  id: string;
  userId: string;
  balance: string;       // String (monetary precision)
  pendingCash: string;
  currency: "NGN" | "USD" | "GHS";
}

interface ILoginResponse {
  user: IUser;
  authorization: {
    token: string;
    expiresAt: string;
    type: "Bearer";
  };
}
```

---

## Configuration

**Environment variables** (`.env.local` for development):

```bash
NEXT_PUBLIC_BASE_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

**next.config.ts:**
- `output: "standalone"` — Docker-ready build
- Sentry source maps
- Image `remotePatterns` for Cloudinary + GCS

**Development:**
```bash
npm install
npm run dev   # http://localhost:3000
```
