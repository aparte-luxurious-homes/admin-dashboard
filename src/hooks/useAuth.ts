"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import axiosRequest from "@/lib/api";
import { setUser, clearUser } from "@/lib/slices/authSlice";
import { useEffect } from "react";
import { BASE_API_URL } from "../lib/routes/endpoints";
import { ILoginResponse, IUser, IBaseResponse } from "../lib/types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "../lib/routes/page_routes";
import { RootState } from "../lib/store";
import { UserRole } from "../lib/enums";


// 🔹 Fetch User & Sync with Redux
export const fetchUser = async (): Promise<IUser> => {
  const response = await axiosRequest.get(`${BASE_API_URL}/profile`);
  const user = response.data.data;
  
  if (user.role === UserRole.GUEST) {
    Cookies.remove("token");
    window.location.href = PAGE_ROUTES.auth.login;
    throw Error("Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support.");
  }

  return user;
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = Cookies.get("token");
  
  // Debug: Log all cookies
  useEffect(() => {
    const allCookies = document.cookie;
    console.log('[useAuth] All cookies:', allCookies);
    console.log('[useAuth] Token from Cookies.get:', token);
  }, [token]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchUser,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    enabled: !!token && !user, // Only fetch if token exists and we don't have user data yet
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Sync Redux only if data exists and is different from the current user
  useEffect(() => {
    if (data && data.id && data.id !== user?.id) {
      console.log('[useAuth] Setting user in Redux:', data.email);
      dispatch(setUser(data));
    }
  }, [data, dispatch, user]);

  // Log errors but don't crash - let the persisted Redux user data work
  useEffect(() => {
    if (error && !user) {
      console.error('[useAuth] Failed to fetch user profile:', error);
    }
  }, [error, user]);

  // Log current auth state
  useEffect(() => {
    console.log('[useAuth] Current state - User:', user?.email || 'None', 'Token:', !!token, 'Fetching:', isFetching);
  }, [user, token, isFetching]);

  return { user, isFetching };
};

// 🔹 Login Mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axiosRequest.post<IBaseResponse<ILoginResponse> | ILoginResponse>(
        `${BASE_API_URL}/auth/login`,
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

      // Only set token if user is not a guest
      // Use secure cookies only in production (HTTPS)
      const isProduction = window.location.protocol === 'https:';
      
      // Extract domain for cookie (for production)
      const hostname = window.location.hostname;
      const domain = hostname.includes('aparte.ng') ? '.aparte.ng' : undefined;
      
      const cookieOptions: any = { 
        expires: 7, 
        secure: isProduction, 
        sameSite: "Lax" as const, // Changed from Strict to Lax for better compatibility
        path: '/' // Ensure cookie is available across all paths
      };
      
      // Only set domain for production (don't set for localhost)
      if (domain) {
        cookieOptions.domain = domain;
      }
      
      console.log('[useLogin] Setting token cookie with options:', cookieOptions);
      console.log('[useLogin] Current location:', { hostname, protocol: window.location.protocol });
      
      // Try setting the cookie
      Cookies.set("token", payload.authorization.token, cookieOptions);
      
      // Verify cookie was set
      const verifyToken = Cookies.get("token");
      console.log('[useLogin] Token verification after set:', verifyToken ? 'Token set successfully' : 'ERROR: Token not set!');
      console.log('[useLogin] document.cookie after set:', document.cookie);
      
      // If token still not set, try without domain
      if (!verifyToken && domain) {
        console.warn('[useLogin] Token not set with domain, trying without domain...');
        const fallbackOptions = { ...cookieOptions };
        delete fallbackOptions.domain;
        Cookies.set("token", payload.authorization.token, fallbackOptions);
        const recheckToken = Cookies.get("token");
        console.log('[useLogin] Fallback token check:', recheckToken ? 'Success!' : 'Still failed');
      }
      
      return payload.user;
    },
    onSuccess: async (user) => {
      console.log('[useLogin] Login successful, setting user:', user.email);
      
      // Verify token is still there before proceeding
      const tokenCheck = Cookies.get("token");
      console.log('[useLogin] Token check before state update:', tokenCheck ? 'Token exists' : 'ERROR: Token missing!');
      
      // Update state before navigation
      dispatch(setUser(user));
      queryClient.setQueryData(["authUser"], user);
      
      console.log('[useLogin] State updated, waiting for persistence...');
      
      // Small delay to ensure state is persisted
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Final token verification before navigation
      const finalTokenCheck = Cookies.get("token");
      console.log('[useLogin] Final token check before navigation:', finalTokenCheck ? 'Token exists' : 'ERROR: Token missing!');
      console.log('[useLogin] All cookies before navigation:', document.cookie);
      
      console.log('[useLogin] Navigating to dashboard...');
      
      // Use replace instead of push to prevent back navigation to login
      router.replace(PAGE_ROUTES.dashboard.base);
    },
    onError: (error: any) => {
      // Remove token if there's an error
      console.log('[useLogin] Login error, removing token');
      Cookies.remove("token");
      console.error('[useLogin] Login failed:', error);
    }
  });
};

// 🔹 Logout Mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      await axiosRequest.post(`${BASE_API_URL}/auth/logout`);
      Cookies.remove("token");
    },
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.setQueryData(["authUser"], null);
      // Redirect to login after logout
      window.location.href = PAGE_ROUTES.auth.login;
    },
  });
};
