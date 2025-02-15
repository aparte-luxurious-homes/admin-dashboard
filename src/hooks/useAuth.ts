"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { setUser, clearUser } from "@/lib/slices/authSlice";
import { useEffect } from "react";
import { BASE_API_URL } from "../lib/routes/endpoints";
import { ILoginResponse, IUser } from "../lib/types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "../lib/routes/page_routes";


// 🔹 Fetch User & Sync with Redux
export const fetchUser = async (): Promise<IUser | null> => {
  const response = await api.get(`${BASE_API_URL}/profile`);
  return response.data.data || null;
};

// 🔹 Custom hook to get authenticated user
export const useAuth = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    // const queryClient = useQueryClient();
  
    const { data: user } = useQuery<IUser | null>({
      queryKey: ["authUser"],
      queryFn: fetchUser,
      staleTime: 1000 * 60 * 1, // Cache for 5 minutes
    });
  
    useEffect(() => {
      if (user) {
        dispatch(setUser(user)); // Sync Redux only if user is not null
      } else router.push(PAGE_ROUTES.auth.login)
    }, [user, dispatch]);
  
    return { user };
};

// 🔹 Login Mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
        const { data } = await api.post<ILoginResponse>(`${BASE_API_URL}/auth/login`, credentials);
        console.log(data)
        Cookies.set("token", data.authorization.token, { expires: 7, secure: true, sameSite: "Strict" });
        return data.user;
    },
    onSuccess: (user) => {
        dispatch(setUser(user)); // Sync Redux
        queryClient.setQueryData(["authUser"], user); // Sync React Query
        router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.base)
    },
    onError: (error) => {
        console.error(error);
    }
  });
};

// 🔹 Logout Mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      await api.post(`${BASE_API_URL}/auth/logout`);
      Cookies.remove("token");
    },
    onSuccess: () => {
      dispatch(clearUser()); // Clear Redux
      queryClient.setQueryData(["authUser"], null); // Clear React Query
    },
  });
};
