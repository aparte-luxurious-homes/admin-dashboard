'use client'

import { useLogin } from "@/src/hooks/useAuth";
import { useState, useEffect } from "react";
import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import Image from "next/image";
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import axiosRequest from "@/src/lib/api";
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
        setPasswordType(prev => prev === "password" ? "text" : "password");
    };

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setIsTokenAuthenticating(true);

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

            axiosRequest.get("/profile")
                .then(async (response) => {
                    const user = response.data.data;
                    if (user.role === UserRole.GUEST) {
                        throw new Error("Access Denied: Admin restricted.");
                    }
                    dispatch(setUser(user));
                    queryClient.setQueryData(["authUser"], user);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    router.replace(PAGE_ROUTES.dashboard.base);
                })
                .catch((error) => {
                    Cookies.remove("token");
                    const errorMessage = error?.response?.data?.message || 'Authentication failed.';
                    toast.error(errorMessage);
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
                        const errorMessage = error?.response?.data?.message || 'Login failed.';
                        toast.error(errorMessage);
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
            <div className="absolute hidden md:block top-8 left-8 opacity-5 transform scale-150 -rotate-12">
                <Image src="/svg/logo.svg" alt="logo" height={300} width={300} priority />
            </div>

            <main className="w-full max-w-md animate-fadeIn relative z-10">
                <div className="mx-auto w-fit mb-8 md:mb-10">
                    <div className="relative">
                        <Image src="/svg/logo_text_white.svg" alt="logo" height={170} width={170} />
                        <Image src="/svg/admin_text.svg" alt="admin" className="absolute -bottom-1 right-0.5" height={30} width={30} />
                    </div>
                </div>

                <form
                    className="flex flex-col gap-5 p-6 md:p-8 rounded-xl bg-white text-zinc-900 w-full shadow-lg"
                    onSubmit={handleSubmit}
                >
                    <div>
                        <InputGroup label="Email" required onChange={(e) => setEmail(e.target.value)} inputType="email" inputName="email" />
                        {validator.message("email", email, "required|email")}
                    </div>
                    <div>
                        <InputGroup label="Password" required onChange={(e) => setPassword(e.target.value)} inputType={passwordType} inputName="password" />
                        <div className="w-[26px] relative top-[-32px] ml-auto">
                            <Icon
                                icon={passwordType === "password" ? "mdi:eye-outline" : "f7:eye-slash"}
                                className="text-black cursor-pointer"
                                onClick={togglePassword}
                            />
                        </div>
                        {validator.message("password", password, "required|min:6")}
                    </div>
                    <div className="mt-2 flex justify-center">
                        <div className="w-2/3">
                            <Button variant="primaryoutline" buttonSize="full" color="btnfontprimary" isLoading={isPending} type="submit" buttonName="Login" />
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
