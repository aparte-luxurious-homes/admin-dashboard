'use client'

import Image from "next/image";

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Faded background logo */}
      <div className="absolute top-8 left-8 opacity-5 transform scale-150 -rotate-12">
        <Image
          src="/svg/logo.svg"
          alt="background-logo"
          height={300}
          width={300}
          priority
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="animate-pulse mb-4 relative">
          <Image
            src="/svg/logo_text_white.svg"
            alt="logo"
            height={170}
            width={170}
            priority
          />
          <div className="absolute -bottom-1 right-0.5">
            <Image
              src="/svg/admin_text.svg"
              alt="admin"
              height={30}
              width={30}
            />
          </div>
        </div>
        <p className="text-white text-lg mt-4">{message}</p>
      </div>
    </div>
  );
} 