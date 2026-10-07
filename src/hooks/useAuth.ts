"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import axiosRequest, { endServerSession } from "@/lib/api";
import { clearAdminSessionCookies } from "@/lib/agentAccessGuard";
import { setUser, clearUser } from "@/lib/slices/authSlice";
import { useEffect } from "react";
import { API_ROUTES } from "../lib/routes/endpoints";
import { ILoginResponse, IUser, IBaseResponse } from "../lib/types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "../lib/routes/page_routes";
import { RootState } from "../lib/store";
import { UserRole } from "../lib/enums";


// 🔹 Fetch User & Sync with Redux
export const fetchUser = async (): Promise<IUser> => {
  const response = await axiosRequest.get("/profile");
  const user = response.data.data;

  if (user.role === UserRole.GUEST) {
    await endServerSession();
    clearAdminSessionCookies();
    window.location.href = PAGE_ROUTES.auth.login;
    throw Error("Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support.");
  }

  return user;
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // The session cookie is HttpOnly, so there is no client-side "do I have a
  // token" check any more. middleware.ts has already bounced requests with no
  // session cookie to login; a cookie the API rejects answers 401 here, and the
  // axios interceptor signs the user out.
  const { data, isFetching, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchUser,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    enabled: !user, // Only fetch when Redux has no persisted user yet
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Sync Redux only if data exists and is different from the current user
  useEffect(() => {
    if (data && data.id && data.id !== user?.id) {
      // console.log('[useAuth] Setting user in Redux:', data.email);
      dispatch(setUser(data));
    }
  }, [data, dispatch, user]);

  // Log errors but don't crash - let the persisted Redux user data work
  useEffect(() => {
    if (error && !user) {
      console.error('[useAuth] Failed to fetch user profile:', error);
    }
  }, [error, user]);

  return { user, isFetching, error };
};

// 🔹 Login Mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axiosRequest.post<IBaseResponse<ILoginResponse> | ILoginResponse>(
        "/auth/login",
        credentials
      );

      const raw = response.data as any;
      const payload: ILoginResponse = raw?.data?.user ? raw.data : raw;

      if (!payload?.user || !payload?.authorization) {
        throw new Error("Invalid login response from server");
      }

      // Check for guest role before setting any state
      if (payload.user.role === UserRole.GUEST) {
        throw new Error("Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support.");
      }

      // An unapproved agent still logs in. AgentAccessGate tells them about
      // KYC once they are signed in; refusing here read as "wrong password".

      // The API answered with the session as an HttpOnly cookie (we sent
      // X-Auth-Mode: cookie), so there is no token here to store.
      return payload.user;
    },
    onSuccess: async (user) => {
      // Update state before navigation
      dispatch(setUser(user));
      queryClient.setQueryData(["authUser"], user);

      // console.log('[useLogin] State updated, waiting for persistence...');

      // Small delay to ensure state is persisted
      await new Promise(resolve => setTimeout(resolve, 200));

      // Use replace instead of push to prevent back navigation to login
      router.replace(PAGE_ROUTES.dashboard.base);
    },
    onError: () => {
      // A failed login sets no session cookie. Zone standing is per-account,
      // though: leaving networkRole behind lets the next agent to log in on
      // this browser inherit a former lead's zone navigation.
      clearAdminSessionCookies();
    }
  });
};

// 🔹 Phone-OTP request (resend SMS)
export const useRequestPhoneOtp = () => {
  return useMutation({
    mutationFn: async ({ phone }: { phone: string }) => {
      const response = await axiosRequest.post(API_ROUTES.auth.requestPhoneOtp, { phone });
      return response.data;
    },
  });
};

// 🔹 Phone-OTP request via email (DND fallback)
export const useRequestPhoneOtpViaEmail = () => {
  return useMutation({
    mutationFn: async ({ phone }: { phone: string }) => {
      const response = await axiosRequest.post(
        API_ROUTES.auth.requestPhoneOtpViaEmail,
        { phone }
      );
      return response.data;
    },
  });
};

// 🔹 Phone-OTP verify (completes login, mirrors useLogin's onSuccess)
export const useVerifyPhoneOtp = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const response = await axiosRequest.post<IBaseResponse<ILoginResponse> | ILoginResponse>(
        API_ROUTES.auth.verifyPhoneOtp,
        { phone, otp }
      );

      const raw = response.data as any;
      const payload: ILoginResponse = raw?.data?.user ? raw.data : raw;

      if (!payload?.user || !payload?.authorization) {
        throw new Error("Invalid verify response from server");
      }

      if (payload.user.role === UserRole.GUEST) {
        throw new Error(
          "Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support."
        );
      }

      // Session arrives as an HttpOnly cookie; see useLogin.
      return payload.user;
    },
    onSuccess: async (user) => {
      dispatch(setUser(user));
      queryClient.setQueryData(["authUser"], user);
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.replace(PAGE_ROUTES.dashboard.base);
    },
    onError: () => {
      // Don't remove the cookie here — the user just hasn't completed verification
      // yet. They may retry the OTP. The login mutation already cleared any stale
      // token before this flow began.
    },
  });
};

// 🔹 Logout Mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      // /auth/logout expires the HttpOnly session cookie; the JS cookies are ours.
      await endServerSession();
      clearAdminSessionCookies();
    },
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.setQueryData(["authUser"], null);
      // Redirect to login after logout
      window.location.href = PAGE_ROUTES.auth.login;
    },
  });
};
