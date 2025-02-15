'use client'

import { useLogin } from "@/src/hooks/useAuth";
import { useState } from "react";

export default function Login() {
  const { mutate: loginMutation, isPending } = useLogin(); 
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleSubmit = (e: any) => {
    e.preventDefault();
    loginMutation({email, password})
  }

  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <main className="w-2/5">

        <div className="">
          <p
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Login page
          </p>
        </div>
        
        <form
          className="flex flex-col gap-4 p-8 rounded-xl bg-black text-gray-200 w-full"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="w-full h-auto p-1 rounded-lg text-gray-900" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">
            password
          </label>
          <input id="password" type="password" className="w-full h-auto p-1 rounded-lg text-gray-900" value={password} onChange={(e) => setPassword(e.target.value)}/>

          {
            isPending ?
            <p className="text-background text-base">Please wait...</p>
            :
            <input type="submit" value={'Submit'} className="mt-5 w-2/3 h-auto m-auto p-2 rounded-xl bg-transparent hover:bg-white border border-gray-200 text-gray-200 hover:text-gray-900 ease-in-out duration-150"/>
          }
        </form>
      </main>
    </div>
  );
}
