# Authentication Flow Fix

## Problem
The admin dashboard was experiencing a redirect loop where users would be logged out immediately after login and redirected back to the login page.

## Root Cause
The authentication flow had several issues:

1. **Unconditional Profile Fetch**: The `useAuth()` hook was making API calls to fetch user profile even when no authentication token existed, triggering 401 errors.

2. **Aggressive Error Handling**: The axios interceptor was catching 401 errors and immediately redirecting to login, even during the initial authentication process.

3. **Race Conditions**: State updates weren't fully persisted before navigation occurred, causing the dashboard to load without proper authentication state.

4. **API Timeout**: The API timeout was set too low (5 seconds), causing requests to fail on slower networks.

5. **No Route Guards**: The login page didn't prevent already-authenticated users from accessing it, and the dashboard didn't properly validate authentication before rendering.

## Solutions Implemented

### 1. Enhanced `useAuth()` Hook (`src/hooks/useAuth.ts`)
- Added `enabled: !!token` to the React Query configuration to only fetch user data when a token exists
- Added `staleTime` to reduce unnecessary refetches
- Reads token from cookies before attempting to fetch user data

```typescript
const token = Cookies.get("token");

const { data, isFetching } = useQuery({
  queryKey: ["authUser"],
  queryFn: fetchUser,
  refetchInterval: 1000 * 60 * 5,
  retry: false,
  enabled: !!token, // Only fetch if token exists
  staleTime: 1000 * 60 * 5,
});
```

### 2. Improved Login Flow (`src/hooks/useAuth.ts`)
- Added a 100ms delay after state updates to ensure Redux persistence completes
- Ensures both Redux store and React Query cache are updated before navigation

```typescript
onSuccess: async (user) => {
  dispatch(setUser(user));
  queryClient.setQueryData(["authUser"], user);
  await new Promise(resolve => setTimeout(resolve, 100));
  router.replace(PAGE_ROUTES.dashboard.base);
}
```

### 3. Dashboard Authentication Guard (`src/layouts/dashboard.tsx`)
- Added comprehensive authentication checking on mount
- Shows loader while verifying authentication
- Handles multiple scenarios:
  - No token and no user → redirect to login
  - Token exists but user not loaded → wait for fetch
  - User data available → render dashboard
- Displays loader during authentication verification

```typescript
useEffect(() => {
  const token = Cookies.get("token");
  
  if (!token && !user) {
    router.replace(PAGE_ROUTES.auth.login);
    return;
  }

  if (token && !user && !isFetching) {
    setIsCheckingAuth(true);
    return;
  }

  if (user) {
    setIsCheckingAuth(false);
  }
}, [user, isFetching, router]);
```

### 4. Login Page Guard (`src/app/(pages)/auth/layout.tsx`)
- Prevents authenticated users from accessing the login page
- Redirects to dashboard if token exists

```typescript
useEffect(() => {
  const token = Cookies.get("token");
  if (token) {
    router.replace(PAGE_ROUTES.dashboard.base);
  }
}, [router]);
```

### 5. Improved Token Authentication (`src/app/(pages)/auth/login/page.tsx`)
- Fixed token query parameter authentication flow
- Uses router.replace instead of window.location.href for consistency
- Added proper error handling and state persistence delay

### 6. Increased API Timeout (`src/lib/api.ts`)
- Increased timeout from 5 seconds to 30 seconds
- Prevents timeouts on slower networks or during API cold starts

```typescript
timeout: 30000, // Increased to 30 seconds
```

## Authentication Flow (After Fix)

### Login Process:
1. User submits credentials
2. API returns user data and token
3. Token is stored in cookies (7-day expiry)
4. User data is stored in Redux (with persistence)
5. React Query cache is updated
6. 100ms delay to ensure state persistence
7. Navigate to dashboard using `router.replace()`

### Dashboard Load:
1. Dashboard layout checks for token in cookies
2. If token exists, `useAuth()` triggers profile fetch
3. Profile data is synced to Redux
4. Dashboard renders with user data
5. User data auto-refreshes every 5 minutes

### Logout Process:
1. API logout endpoint is called
2. Token is removed from cookies
3. Redux state is cleared
4. React Query cache is invalidated
5. User is redirected to login page

## Files Modified

1. `src/hooks/useAuth.ts` - Enhanced authentication hooks
2. `src/layouts/dashboard.tsx` - Added authentication guard
3. `src/app/(pages)/auth/layout.tsx` - Added login page guard
4. `src/app/(pages)/auth/login/page.tsx` - Improved token authentication
5. `src/lib/api.ts` - Increased timeout and maintained error handling

## Testing Recommendations

Test the following scenarios:

1. ✅ Fresh login with email/password
2. ✅ Login with token query parameter
3. ✅ Dashboard access without authentication
4. ✅ Login page access when already authenticated
5. ✅ Token expiration handling (401 errors)
6. ✅ Page refresh while authenticated
7. ✅ Network slow/timeout scenarios
8. ✅ Guest user login attempt
9. ✅ Logout and re-login flow
10. ✅ Multiple tabs with same authentication

## Notes

- Redux persistence is configured via `redux-persist` and helps maintain user state across page refreshes
- React Query cache provides a secondary layer of state management for API data
- The 100ms delay in state updates is a conservative approach to ensure Redux persistence completes
- The axios interceptor still handles 401 errors globally but now only triggers after proper authentication setup

