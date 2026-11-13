# Admin Dashboard — Developer Guide

Practical guide for developers working on the Aparte admin dashboard.

---

## Setup

```bash
cd admin-dashboard
npm install
cp .env.template .env.local
# Edit .env.local: set NEXT_PUBLIC_BASE_API_URL=http://localhost:8000/api/v1
npm run dev
```

Dashboard runs on http://localhost:3000.
API must be running at http://localhost:8000 (see api-v1 setup).

---

## Project Conventions

### Naming
- Files/folders: `kebab-case`
- Components: `PascalCase`
- Hooks: `useHookName.ts`
- Types: `ITypeName` (interfaces), `TTypeName` (types)
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase`

### Import Order
```typescript
// 1. React/Next
import { useState } from "react";
import Link from "next/link";
// 2. Third-party
import { useQuery } from "@tanstack/react-query";
// 3. Internal (absolute via tsconfig paths)
import { API_ROUTES } from "@/lib/routes/endpoints";
import { useAuth } from "@/hooks/useAuth";
// 4. Types
import type { IUser } from "@/lib/types";
```

---

## Adding a New API Endpoint

1. **Add to `src/lib/routes/endpoints.tsx`:**
```typescript
export const API_ROUTES = {
  // ... existing
  newFeature: {
    base: "/new-feature",
    detail: (id: string) => `/new-feature/${id}`,
  },
};
```

2. **Add type in `src/lib/types.ts`:**
```typescript
export interface INewFeature {
  id: string;
  name: string;
}
```

3. **Add request handler in `src/lib/request-handlers/newFeature.ts`:**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/lib/api";
import { API_ROUTES } from "@/lib/routes/endpoints";
import type { INewFeature } from "@/lib/types";

export function GetNewFeatures(params?: object) {
  return useQuery({
    queryKey: ["newFeatures", params],
    queryFn: () => axiosRequest.get<INewFeature[]>(API_ROUTES.newFeature.base, { params }),
  });
}

export function CreateNewFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<INewFeature>) =>
      axiosRequest.post(API_ROUTES.newFeature.base, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newFeatures"] });
    },
  });
}
```

---

## Adding a New Page

1. Create `src/app/(pages)/(dashboard)/new-feature/page.tsx`:
```typescript
"use client";
import { GetNewFeatures } from "@/lib/request-handlers/newFeature";

export default function NewFeaturePage() {
  const { data, isLoading } = GetNewFeatures();
  if (isLoading) return <div>Loading...</div>;
  return <div>{/* Your UI */}</div>;
}
```

2. Add route constant:
```typescript
// src/lib/routes/page_routes.tsx
export const PAGE_ROUTES = {
  // ...
  NEW_FEATURE: "/new-feature",
};
```

3. Add to sidebar nav (with role restriction):
```typescript
// src/lib/routes/nav_links.tsx
{
  label: "New Feature",
  href: PAGE_ROUTES.NEW_FEATURE,
  icon: <NewFeatureIcon />,
  roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
}
```

---

## Using the Alert Dialog

```typescript
import { useAppDispatch } from "@/hooks";
import { showAlert, closeAlert } from "@/lib/slices/alertDialogSlice";

const dispatch = useAppDispatch();

// Trigger:
dispatch(showAlert({
  title: "Delete Property?",
  description: "This cannot be undone.",
  confirmText: "Delete",
  onConfirm: async () => {
    await deletePropertyMutation.mutateAsync(propertyId);
    dispatch(closeAlert());
  },
}));
```

---

## Error Handling

**API errors** come from Axios interceptors → toast notifications.

```typescript
import toast from "react-hot-toast";

try {
  await mutation.mutateAsync(data);
  toast.success("Saved successfully");
} catch (err) {
  const message = err?.response?.data?.message ?? "Something went wrong";
  toast.error(message);
}
```

**Global 401 handling:** Automatic redirect to `/auth/login` via Axios interceptor.

---

## Testing

No automated test suite currently exists in this repo.
Manual testing: http://localhost:8000/docs (FastAPI Swagger UI — the backend, not the dashboard).

---

## Deployment

Deployed to Vercel. Production environment variables set in Vercel dashboard.

```bash
# Production build test
npm run build
npm run start
```

See `NEXT_PUBLIC_BASE_API_URL` — points to https://api.aparteng.com in production.
