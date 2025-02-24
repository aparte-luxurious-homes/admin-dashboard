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
  if (response.data.data.user.role === UserRole.GUEST) {
    window.location.href = PAGE_ROUTES.auth.login;
    throw Error("You aren't authorized to access this platform"); //Use toast instead
  }

  return response.data.data;
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data, isFetching } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchUser,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  // Sync Redux only if data exists and is different from the current user
  useEffect(() => {
    if (data && data.id !== user?.id) {
      dispatch(setUser(data));
    }
  }, [data, dispatch, user]);

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
      if (data.user.role === UserRole.GUEST) throw Error("You aren't authorized to access this platform");

      Cookies.set("token", data.authorization.token, { expires: 7, secure: true, sameSite: "Strict" });
      return data.user;
    },
    onSuccess: (user) => {
      dispatch(setUser(user)); // Sync Redux
      queryClient.setQueryData(["authUser"], user); // Sync React Query
      router.push(PAGE_ROUTES.dashboard.base)
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
      await axiosRequest.post(`${BASE_API_URL}/auth/logout`);
      Cookies.remove("token");
    },
    onSuccess: () => {
      dispatch(clearUser()); // Clear Redux
      queryClient.setQueryData(["authUser"], null); // Clear React Query
    },
  });
};
