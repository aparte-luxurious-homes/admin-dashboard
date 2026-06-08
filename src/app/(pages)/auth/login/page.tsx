'use client'

import { useLogin } from "@/src/hooks/useAuth";
import { useState, useEffect } from "react";
import Button from "@/src/components/button";
import InputGroup from "../../../../components/formcomponent/InputGroup";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import axiosRequest from "@/lib/api";
// import { BASE_API_URL } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { setUser } from "@/src/lib/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import Loader from "@/src/components/loader";
import { UserRole } from "@/src/lib/enums";
import { Icon } from "@iconify/react/dist/iconify.js";
import useValidator from "@/src/hooks/useValidator";
import PhoneOtpModal from "@/src/components/auth/PhoneOtpModal";

export default function Login() {
  const { mutate: loginMutation, isPending } = useLogin();
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [validator, triggerValidation] = useValidator();
  const [passwordType, setPasswordType] = useState<string>("password");
  const [isTokenAuthenticating, setIsTokenAuthenticating] = useState(false);
  const [phoneOtpPhone, setPhoneOtpPhone] = useState<string | null>(null);
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
      const hostname = window.location.hostname;
      const domain = hostname.includes('aparte.ng') ? '.aparte.ng' : undefined;

      const cookieOptions: any = {
        expires: 7,
        secure: isProduction,
        sameSite: "Lax" as const,
        path: '/'
      };

      if (domain) {
        cookieOptions.domain = domain;
      }

      Cookies.set("token", token, cookieOptions);
      console.log('[Login] Token from URL set in cookie with options:', cookieOptions);
      console.log('[Login] document.cookie:', document.cookie);

      // Try to fetch profile with the token
      axiosRequest.get("/profile")
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
            // Phone verification gate: backend returns 401 with detail.code so
            // the frontend can step the user through SMS-OTP entry instead of
            // dead-ending on a generic toast.
            const detail = error?.response?.data?.detail;
            if (detail && typeof detail === "object" && detail.code === "PHONE_VERIFICATION_REQUIRED" && detail.phone) {
              toast(detail.message || "Phone verification required.", {
                icon: "📱",
                duration: 4000,
              });
              setPhoneOtpPhone(detail.phone as string);
              return;
            }

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
          <div className="relative">
            <InputGroup
              label="Password"
              required
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
              inputType={passwordType}
              inputName="password"
              inputClassName="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-10 flex h-9 w-9 items-center justify-center rounded-full text-[#101928] hover:text-[#124452]"
              onClick={togglePassword}
              aria-label={passwordType === "password" ? "Show password" : "Hide password"}
            >
              {passwordType === "password" ? (
                <Icon icon="mdi:eye-outline" />
              ) : (
                <Icon icon="f7:eye-slash" />
              )}
            </button>
            <Link href={PAGE_ROUTES.auth.passwordReset} className="text-xs text-[#124452] hover:underline mt-2 inline-block">
              Forgot Password?
            </Link>
            {validator.message("password", password, "required|min:6")}
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

      <PhoneOtpModal
        isOpen={!!phoneOtpPhone}
        phone={phoneOtpPhone || ""}
        onClose={() => setPhoneOtpPhone(null)}
      />
    </div>
  );
}
