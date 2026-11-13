'use client'

import { GuestAccountError, useLogin } from "@/src/hooks/useAuth";
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
import PhoneOtpModal, {
  parsePhoneVerificationDetail,
  type PhoneVerificationChallenge,
} from "@/src/components/auth/PhoneOtpModal";
import GuestAccountSwitch from "@/src/components/auth/GuestAccountSwitch";
import type { IUser } from "@/src/lib/types";

/** `?reason=` value the API client sets when a session is ended by the phone gate. */
const PHONE_REAUTH_REASON = "phone_verification";

/** Where an account still waiting on its email code goes to enter it. */
const landingLoginUrl = (): string => {
  const base =
    process.env.NEXT_PUBLIC_LANDING_PAGE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://aparte.ng";
  return `${base.replace(/\/$/, "")}/login`;
};

/** The `detail` object of an API error, when the API sent one (not a string). */
const errorDetail = (error: any): Record<string, any> | null => {
  const detail = error?.response?.data?.detail;
  return detail && typeof detail === "object" ? detail : null;
};

/** Whichever human message the API put on the error: detail string, detail.message or message. */
const apiErrorMessage = (error: any): string | null => {
  const data = error?.response?.data;
  const candidate =
    (typeof data?.detail === "string" && data.detail) ||
    data?.detail?.message ||
    data?.message;
  return typeof candidate === "string" && candidate ? candidate : null;
};

export default function Login() {
  const { mutate: loginMutation, isPending } = useLogin();
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [validator, triggerValidation] = useValidator();
  const [passwordType, setPasswordType] = useState<string>("password");
  const [isTokenAuthenticating, setIsTokenAuthenticating] = useState(false);
  const [phoneChallenge, setPhoneChallenge] = useState<PhoneVerificationChallenge | null>(null);
  // A sign-in that reached a GUEST account: offer the account-type switch
  // instead of refusing. Memory only; no cookie is set for a guest.
  const [guestSession, setGuestSession] = useState<{ token: string; user: IUser } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  // Sent here by the API client after the phone gate ended a session (or by
  // the token hand-off below): say why, so it doesn't read as a random logout.
  const showPhoneReauthNotice = searchParams.get("reason") === PHONE_REAUTH_REASON;
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

          // A guest arriving from aparte.ng (e.g. "List your Aparte") gets
          // the account-type switch, not a refusal. Drop the cookie that was
          // set for the /profile call and the token from the URL.
          if (user.role === UserRole.GUEST) {
            Cookies.remove("token");
            setGuestSession({ token, user });
            setIsTokenAuthenticating(false);
            router.replace(PAGE_ROUTES.auth.login);
            return;
          }

          // Update Redux store. An unapproved agent is handled by
          // AgentAccessGate once the dashboard loads, not here.
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

          // The phone gate refused the handed-off session: this account has to
          // sign in here and confirm its number. Show the same notice the API
          // client shows for a gated session, and drop the token from the URL.
          if (
            error?.response?.status === 401 &&
            errorDetail(error)?.code === "PHONE_VERIFICATION_REQUIRED"
          ) {
            setIsTokenAuthenticating(false);
            router.replace(`${PAGE_ROUTES.auth.login}?reason=${PHONE_REAUTH_REASON}`);
            return;
          }

          const errorMessage = apiErrorMessage(error) ||
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
            if (error instanceof GuestAccountError) {
              setGuestSession({ token: error.token, user: error.user });
              return;
            }
            const detail = errorDetail(error);

            // Phone verification gate: the API refuses with 401 and a
            // challenge, which the modal uses to send, re-target and verify
            // the SMS code. It covers an account with no number on file too,
            // so don't require detail.phone here.
            const challenge = parsePhoneVerificationDetail(detail);
            if (challenge) {
              setPhoneChallenge(challenge);
              return;
            }

            // The email address was never confirmed. The API has just emailed
            // a fresh code, but there's no screen for it here: it's entered at
            // sign-in on aparte.ng.
            if (detail?.code === "EMAIL_VERIFICATION_REQUIRED") {
              const href = landingLoginUrl();
              toast(
                (t) => (
                  <div className="text-sm text-gray-800">
                    <p>{detail.message || "Verify your email address to continue."}</p>
                    <p className="mt-1">
                      Enter the code from that email when you sign in on aparte.ng.
                    </p>
                    <a
                      href={href}
                      onClick={() => toast.dismiss(t.id)}
                      className="mt-2 inline-block font-semibold text-[#124452] underline"
                    >
                      Go to aparte.ng to verify
                    </a>
                  </div>
                ),
                {
                  icon: "📧",
                  duration: 12000,
                  style: { maxWidth: '500px' },
                },
              );
              return;
            }

            const errorMessage = apiErrorMessage(error) ||
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

  if (guestSession) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center px-4 py-8">
        <GuestAccountSwitch
          token={guestSession.token}
          user={guestSession.user}
          onCancel={() => setGuestSession(null)}
        />
      </div>
    );
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
          {showPhoneReauthNotice && (
            <div
              role="status"
              className="flex items-start gap-3 p-3 bg-[#f4fbfb] border border-[#cfe9eb] rounded-lg"
            >
              <Icon icon="mdi:shield-lock-outline" className="w-5 h-5 text-[#028090] mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">
                For your security, sign in again and confirm your phone number.
              </p>
            </div>
          )}
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
        isOpen={!!phoneChallenge}
        challenge={phoneChallenge}
        onClose={() => setPhoneChallenge(null)}
        onGuestAccount={setGuestSession}
      />
    </div>
  );
}
