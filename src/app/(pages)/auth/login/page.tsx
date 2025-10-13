'use client'

import { useLogin } from "@/src/hooks/useAuth";
import { useState, useEffect } from "react";
import Button from "@/src/components/button";
import InputGroup from "../../../../components/formcomponent/InputGroup";
import Image from "next/image";
import AparteeText from "../../../../../public/svg/logo_text_white.svg";
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import axiosRequest from "@/lib/api";
import { BASE_API_URL } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { setUser } from "@/src/lib/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import Loader from "@/src/components/loader";
import { UserRole } from "@/src/lib/enums";
import { Icon } from "@iconify/react/dist/iconify.js";
import useValidator from "@/src/hooks/useValidator";

export default function Login() {
  const { mutate: loginMutation, isPending } = useLogin(); 
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [validator, triggerValidation] = useValidator();
  const [passwordType, setPasswordType] = useState<string>("password");
  const [isTokenAuthenticating, setIsTokenAuthenticating] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const togglePassword = () => {
    if (passwordType === "password") {
      setPasswordType("text");
    } else {
      setPasswordType("password");
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsTokenAuthenticating(true);
      
      // Set the token in cookies first
      const isProduction = window.location.protocol === 'https:';
      Cookies.set("token", token, { expires: 7, secure: isProduction, sameSite: "Strict" });
      
      // Try to fetch profile with the token
      axiosRequest.get(`${BASE_API_URL}/profile`)
        .then(async (response) => {
          const user = response.data.data;
          
          // Check for guest role
          if (user.role === UserRole.GUEST) {
            throw new Error("Access Denied: This admin platform is restricted to authorized personnel only. If you believe this is an error, please contact support.");
          }
          
          // Update Redux store
          dispatch(setUser(user));
          // Update React Query cache
          queryClient.setQueryData(["authUser"], user);
          
          // Small delay to ensure state is persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Use router for navigation
          router.replace(PAGE_ROUTES.dashboard.base);
        })
        .catch((error) => {
          // Token is invalid, remove it and show error
          Cookies.remove("token");
          console.error('Token validation failed:', error);
          
          const errorMessage = error?.response?.data?.message || 
            (error.message?.includes('Access Denied') ? error.message : 'Authentication failed. Please login with your credentials.');
          
          toast.error(errorMessage, {
            duration: 6000,
            style: {
              maxWidth: '500px',
              width: 'max-content'
            }
          });
          setIsTokenAuthenticating(false);
        });
    }
  }, [searchParams, dispatch, queryClient, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validator.allValid()) {
      loginMutation(
        { email, password },
        {
          onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || 
              (error.message?.includes('Access Denied') ? error.message : 'Login failed. Please check your credentials.');
            
            toast.error(errorMessage, {
              duration: 6000,
              style: {
                maxWidth: '500px',
                width: 'max-content'
              }
            });
          }
        }
      );
    } else {
      triggerValidation();
    }
  }

  if (isTokenAuthenticating) {
    return <Loader message="Authenticating..." />;
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center px-4 relative overflow-hidden">
      {/* Faded background logo */}
      <div className="absolute hidden md:block top-8 left-8 opacity-5 transform scale-150 -rotate-12">
        <Image
          src="/svg/logo.svg"
          alt="background-logo"
          height={300}
          width={300}
          priority
        />
      </div>
      
      {/* Mobile watermark - centered and subtle */}
      <div className="absolute md:hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] transform scale-[2]">
        <Image
          src="/svg/logo.svg"
          alt="background-logo"
          height={200}
          width={200}
          priority
        />
      </div>
      
      <main className="w-full max-w-md animate-fadeIn relative z-10">
        <div className="mx-auto w-fit mb-8 md:mb-10 transform hover:scale-105 transition-transform duration-300">
          <div className="relative">
            <Image
              src="/svg/logo_text_white.svg"
              alt="logo"
              height={170}
              width={170}
            />
            <Image
              src="/svg/admin_text.svg"
              alt="admin"
              className="absolute -bottom-1 right-0.5"
              height={30}
              width={30}
            />
          </div>
        </div>
        
        <form
          className="flex flex-col gap-5 p-6 md:p-8 rounded-xl bg-[#ffffff] text-gray-200 w-full 
          shadow-[4px_4px_10px_rgba(255,255,255,0.5)] transition-all duration-300"
          onSubmit={handleSubmit}
        >
          <div>
            <InputGroup
              label="Email"
              required
              onChange={(e) => setEmail(e.target.value)}
              inputType="email"
              inputName="email"
            />
            {validator.message("email", email, "required|email")}
          </div>
          <div>
            <InputGroup
              label="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
              inputType={passwordType}
              inputName="password"
            />
            <div className="w-[26px] relative top-[-32px] ml-auto">
              {passwordType === "password" ? (
                <Icon icon="mdi:eye-outline" className="text-black" onClick={togglePassword} />
              ) : (
                <Icon icon="f7:eye-slash" className="text-black" onClick={togglePassword} />
              )}
            </div>
            {validator.message("password", password, "required|password")}
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-2/3">
              <Button
                variant="primaryoutline"
                buttonSize="full"
                color="btnfontprimary"
                isLoading={isPending}
                type="submit"
                buttonName="Login"
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
