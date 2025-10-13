# Production Cookie Issue Fix

## The Problem
Cookies were not persisting in production (`https://admin.aparte.ng`), causing:
- Token cookie not being saved
- All cookies showing as empty string
- 401 errors on API calls
- Immediate logout after login

## Root Cause
Cookie domain mismatch between `admin.aparte.ng` and the base domain `.aparte.ng`.

## The Fix

### 1. **Dynamic Domain Detection**
```typescript
const hostname = window.location.hostname;
const domain = hostname.includes('aparte.ng') ? '.aparte.ng' : undefined;
```

This sets the cookie domain to `.aparte.ng` (with leading dot) which makes the cookie accessible across all subdomains:
- `admin.aparte.ng` ✅
- `api.aparte.ng` ✅  
- `www.aparte.ng` ✅

### 2. **Conditional Domain Setting**
```typescript
const cookieOptions: any = { 
  expires: 7, 
  secure: isProduction, 
  sameSite: "Lax",
  path: '/'
};

// Only set domain for production (don't set for localhost)
if (domain) {
  cookieOptions.domain = domain;
}
```

- **Production**: Sets `domain: '.aparte.ng'`
- **Localhost**: No domain property (cookies work locally)

### 3. **Fallback Mechanism**
```typescript
// If token still not set, try without domain
if (!verifyToken && domain) {
  console.warn('[useLogin] Token not set with domain, trying without domain...');
  const fallbackOptions = { ...cookieOptions };
  delete fallbackOptions.domain;
  Cookies.set("token", data.authorization.token, fallbackOptions);
}
```

If setting with domain fails, automatically retry without domain property.

### 4. **Enhanced Logging**
```typescript
console.log('[useLogin] Setting token cookie with options:', cookieOptions);
console.log('[useLogin] Current location:', { hostname, protocol });
console.log('[useLogin] document.cookie after set:', document.cookie);
console.log('[useLogin] Fallback token check:', recheckToken ? 'Success!' : 'Still failed');
```

Now you can see exactly what's happening with cookies in the console.

## Files Modified

1. **`src/hooks/useAuth.ts`**
   - Added domain detection in login mutation
   - Added fallback mechanism
   - Enhanced logging

2. **`src/app/(pages)/auth/login/page.tsx`**
   - Added domain detection for token auth
   - Enhanced logging

## How Cookie Domains Work

### Without Domain Property:
```javascript
// Cookie only accessible on exact domain
Cookies.set("token", "value", { path: '/' })
// Works on: admin.aparte.ng
// Doesn't work on: api.aparte.ng, www.aparte.ng
```

### With Domain Property (Leading Dot):
```javascript
// Cookie accessible on all subdomains
Cookies.set("token", "value", { domain: '.aparte.ng', path: '/' })
// Works on: admin.aparte.ng, api.aparte.ng, www.aparte.ng, aparte.ng
```

## Testing in Production

After deploying, check console logs during login:

### Expected Success Logs:
```
[useLogin] Setting token cookie with options: {expires: 7, secure: true, sameSite: "Lax", path: "/", domain: ".aparte.ng"}
[useLogin] Current location: {hostname: "admin.aparte.ng", protocol: "https:"}
[useLogin] Token verification after set: Token set successfully
[useLogin] document.cookie after set: token=eyJ...
```

### If Domain Fails (Fallback Triggered):
```
[useLogin] Token verification after set: ERROR: Token not set!
⚠️ [useLogin] Token not set with domain, trying without domain...
[useLogin] Fallback token check: Success!
```

### Then After Navigation:
```
[useAuth] All cookies: token=eyJ...
[useAuth] Token from Cookies.get: eyJ...
[useAuth] Current state - User: admin@aparteng.com Token: true Fetching: false
```

## Browser DevTools Check

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Cookies**
4. Click on `https://admin.aparte.ng`
5. You should see:
   - Name: `token`
   - Value: `eyJ...` (JWT token)
   - Domain: `.aparte.ng` (with leading dot)
   - Path: `/`
   - Expires: 7 days from now
   - Secure: ✓
   - HttpOnly: (empty)
   - SameSite: Lax

## If Still Not Working

### Check 1: Browser Cookie Settings
- Ensure cookies are not blocked
- Check if "Block third-party cookies" is enabled
- Try in incognito/private mode

### Check 2: Domain Configuration
- Verify DNS is correct for `admin.aparte.ng`
- Check if subdomain SSL certificate is valid
- Ensure no CORS issues

### Check 3: API Response
- Verify API returns token in response: `data.authorization.token`
- Check token format (should be JWT)
- Test API endpoint directly

### Check 4: Browser Console
Look for specific error messages:
- "Cookie rejected" errors
- Security policy warnings
- CORS errors

## Alternative Solutions (If Above Doesn't Work)

### Option 1: Use Subdomain-Specific Cookie
```typescript
// Don't set domain at all
Cookies.set("token", token, {
  expires: 7,
  secure: true,
  sameSite: "Lax",
  path: '/'
});
```

### Option 2: Use LocalStorage (Less Secure)
```typescript
// Store in localStorage as fallback
localStorage.setItem('auth_token', token);
```

### Option 3: Session Storage (Per Tab)
```typescript
// Store in sessionStorage (lost on tab close)
sessionStorage.setItem('auth_token', token);
```

## Security Considerations

✅ **Currently Implemented:**
- `secure: true` in production (HTTPS only)
- `sameSite: "Lax"` (prevents most CSRF attacks)
- `path: '/'` (explicit path)
- 7-day expiration

❌ **Not Implemented (Consider Adding):**
- `httpOnly: true` (prevents XSS but needs server-side cookie setting)
- Token rotation/refresh
- Fingerprint validation

## Deployment Checklist

Before deploying to production:
- [ ] Commit all changes
- [ ] Test locally with `yarn dev`
- [ ] Build successfully with `yarn build`
- [ ] Deploy to production
- [ ] Test login on `https://admin.aparte.ng`
- [ ] Check browser console for success logs
- [ ] Verify cookie in DevTools
- [ ] Test page refresh (session persistence)
- [ ] Test in different browsers

---

**Status:** Ready for deployment  
**Expected Result:** Cookies will persist in production with domain `.aparte.ng`  
**Fallback:** If domain approach fails, automatically retries without domain

