"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import axiosRequest from "@/lib/api";
import { setUser, clearUser } from "@/lib/slices/authSlice";
import { useEffect } from "react";
import { BASE_API_URL } from "../lib/routes/endpoints";
import { ILoginResponse, IUser } from "../lib/types";
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
    if (data && data.id !== user?.id) {
      dispatch(setUser(data));
    }
  }, [data, dispatch, user]);

  // Log errors but don't crash - let the persisted Redux user data work
  useEffect(() => {
    if (error && !user) {
      console.error('Failed to fetch user profile:', error);
    }
  }, [error, user]);

  return { user, isFetching };
};

// 🔹 Login Mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await axiosRequest.post<ILoginResponse>(`${BASE_API_URL}/auth/login`, credentials);
      
      // Check for guest role before setting any state
      if (data.user.role === UserRole.GUEST) {
        throw new Error("Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support.");
      }

      // Only set token if user is not a guest
      // Use secure cookies only in production (HTTPS)
      const isProduction = window.location.protocol === 'https:';
      Cookies.set("token", data.authorization.token, { 
        expires: 7, 
        secure: isProduction, 
        sameSite: "Strict" 
      });
      return data.user;
    },
    onSuccess: async (user) => {
      // Update state before navigation
      dispatch(setUser(user));
      queryClient.setQueryData(["authUser"], user);
      
      // Small delay to ensure state is persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use replace instead of push to prevent back navigation to login
      router.replace(PAGE_ROUTES.dashboard.base);
    },
    onError: (error: any) => {
      // Remove token if there's an error
      Cookies.remove("token");
      console.error('Login failed:', error);
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
