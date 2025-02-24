'use client'

import { useLogin } from "@/src/hooks/useAuth";
import { useState } from "react";
import Button from "@/src/components/button";
import Image from "next/image";
import AparteeText from "../../../../../public/svg/logo_text_white.svg";

export default function Login() {
  const { mutate: loginMutation, isPending } = useLogin(); 
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation({email, password})
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <main className="w-2/5">

        <div className="mx-auto w-fit mb-10">
          <Image src={AparteeText} alt="" />
        </div>
        
        <form
          className="flex flex-col gap-4 p-8 rounded-xl bg-[#028090] text-gray-200 w-full shadow-[4px_4px_10px_rgba(255,255,255,0.5)]"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="w-full h-auto p-3 rounded-lg text-gray-900" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="w-full h-auto p-3 mb-4 rounded-lg text-gray-900" value={password} onChange={(e) => setPassword(e.target.value)}/>
          <Button
            variant="primaryoutline"
            buttonSize="full"
            color="btnfontprimary"
            isLoading={isPending}
            // onClick={handleSubmit}
            type="submit"
            buttonName="Login"
          />
          {/* {
            isPending ?
            <p className="text-background text-base">Please wait...</p>
            :
            <input type="submit" value={'Submit'} className="mt-5 w-2/3 h-auto m-auto p-2 rounded-xl bg-transparent hover:bg-white border border-gray-200 text-gray-200 hover:text-gray-900 ease-in-out duration-150"/>
          } */}
        </form>
      </main>
    </div>
  );
}
