# Debug Guide for Login Issue

## The Problem
After successful login, the token cookie is not being found (`Token: false`), causing API calls to fail with 401 errors.

## What to Check in Browser Console

### 1. During Login - Look for these logs:

```
[useLogin] Setting token cookie with options: {...}
[useLogin] Token verification after set: Token set successfully (or ERROR!)
[useLogin] Login successful, setting user: xxx@example.com
[useLogin] Token check before state update: Token exists
[useLogin] State updated, waiting for persistence...
[useLogin] Final token check before navigation: Token exists
[useLogin] All cookies before navigation: token=...
[useLogin] Navigating to dashboard...
```

### 2. After Navigation to Dashboard:

```
[useAuth] All cookies: token=...
[useAuth] Token from Cookies.get: <actual token value>
[useAuth] Current state - User: xxx@example.com Token: true Fetching: false
[Dashboard] User authenticated: xxx@example.com
```

## Debugging Steps

### Step 1: Check if Token is Being Set
Look for `[useLogin] Token verification after set` log:
- ✅ If it says "Token set successfully" → Token was set, proceed to Step 2
- ❌ If it says "ERROR: Token not set!" → Cookie setting failed

**Possible causes if token not set:**
- Browser blocking cookies
- Browser in incognito/private mode with strict settings
- Cookie size too large
- Browser extension blocking cookies

**Fix:** Check browser console → Application tab → Cookies → localhost/your-domain

### Step 2: Check if Token Survives Until Navigation
Look for `[useLogin] Final token check before navigation`:
- ✅ If "Token exists" → Token survived, proceed to Step 3
- ❌ If "ERROR: Token missing!" → Token was removed between setting and navigation

**Possible causes if token removed:**
- Another piece of code removing it
- Browser auto-clearing cookies
- Cookie settings issue

### Step 3: Check if Token is Available After Navigation
Look for `[useAuth] Token from Cookies.get`:
- ✅ If it shows actual token value → Token is there, problem is elsewhere
- ❌ If it shows `undefined` or `null` → Token disappeared after navigation

**Possible causes if token disappeared:**
- Cookie path issue (fixed by adding `path: '/'`)
- Cookie domain issue
- sameSite setting issue (changed from Strict to Lax)
- Navigation cleared cookies

### Step 4: Check for Token Removal
Look for these logs:
```
[Axios Interceptor] 401 error detected: {...}
[Axios Interceptor] Removing token due to 401
```

or

```
[useLogin] Login error, removing token
```

If you see these, the token is being removed due to an API error.

## Current Fixes Applied

### 1. Cookie Settings Changed
```typescript
{
  expires: 7,
  secure: isProduction, // Only HTTPS in production
  sameSite: "Lax",      // Changed from "Strict" to "Lax"
  path: '/'             // Explicitly set path
}
```

**Why:**
- `sameSite: "Strict"` can cause issues with redirects
- `sameSite: "Lax"` is more permissive but still secure
- `path: '/'` ensures cookie is available on all routes

### 2. Comprehensive Logging
Added logs at every step to track token lifecycle:
- When token is set
- When token is verified
- When token is read
- When token is removed

### 3. Token Verification Before Navigation
Added multiple checks to ensure token exists before and after state updates.

## Testing Procedure

### 1. Clear Everything
```javascript
// Run in browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
localStorage.clear();
sessionStorage.clear();
```

### 2. Refresh Page
Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 3. Open Browser Console
Keep console open to see all logs

### 4. Attempt Login
Enter credentials and watch console logs in real-time

### 5. Analyze Logs
Follow the debug steps above based on what you see

## Manual Cookie Test

If you want to manually test cookie setting:

```javascript
// Run in browser console
import Cookies from 'js-cookie';

// Try setting a test cookie
Cookies.set('test_token', 'test_value', { 
  expires: 7, 
  secure: false, // Set to false for local testing
  sameSite: 'Lax',
  path: '/'
});

// Try reading it back
console.log('Test cookie:', Cookies.get('test_token'));

// Check all cookies
console.log('All cookies:', document.cookie);
```

## Common Issues & Solutions

### Issue 1: Browser Blocking Third-Party Cookies
**Symptoms:** Cookies not being set at all
**Solution:** 
- Check browser settings
- Disable strict cookie blocking
- Test in different browser

### Issue 2: Path Mismatch
**Symptoms:** Cookie set but not readable on different routes
**Solution:** ✅ Already fixed by adding `path: '/'`

### Issue 3: sameSite Issues
**Symptoms:** Cookie set but disappears after navigation
**Solution:** ✅ Already fixed by changing to `sameSite: "Lax"`

### Issue 4: Secure Flag on HTTP
**Symptoms:** Cookie not set in development (localhost)
**Solution:** ✅ Already fixed by setting `secure: isProduction`

### Issue 5: Token Removed by Error Handler
**Symptoms:** Token exists briefly then disappears with 401 error
**Solution:** Check `[Axios Interceptor]` logs to see if token is being removed

## Next Steps

1. **Test with these changes** and check console logs
2. **Report back what you see** in the console, specifically:
   - Does "[useLogin] Token verification after set" show success?
   - Does "[useLogin] Final token check before navigation" show token exists?
   - Does "[useAuth] Token from Cookies.get" show the token?
   - Any "[Axios Interceptor] Removing token" messages?

3. **If still failing**, provide:
   - Full console log from login to error
   - Browser and version
   - Whether testing locally or on deployed site
   - Screenshot of Application → Cookies in DevTools

---

**Last Updated:** After adding comprehensive debugging
**Status:** Awaiting test results with new logging

