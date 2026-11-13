'use client';

import React, { useState } from 'react';
import { useRequestPasswordReset } from '@/src/lib/request-handlers/auth';
import { useRouter } from 'next/navigation';
import InputGroup from '@/src/components/formcomponent/InputGroup';
import Button from '@/src/components/button';
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes';
import Link from 'next/link';
import Loader from '@/src/components/loader';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function RequestPasswordReset() {
  const [inputMode, setInputMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Nigeria (+234)');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const { mutate: requestReset, isPending } = useRequestPasswordReset();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate input
    if (inputMode === 'email') {
      if (!email.trim()) {
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return;
      }
    } else {
      if (!phone.trim()) {
        return;
      }
      if (phone.length < 10) {
        return;
      }
    }

    const countryCode = country.match(/\(([^)]+)\)/)?.[1] || '';
    const formattedPhone = phone.replace(/\D/g, '');
    const phoneWithCode =
      inputMode === 'phone'
        ? (countryCode + formattedPhone).replace(/^\+/, '')
        : undefined;

    requestReset(
      {
        email: inputMode === 'email' ? email.trim() : undefined,
        phone: phoneWithCode,
      },
      {
        onSuccess: () => {
          const redirectParam = inputMode === 'email' ? `email=${encodeURIComponent(email)}` : `phone=${encodeURIComponent(phoneWithCode || '')}`;
          router.push(`${PAGE_ROUTES.auth.passwordReset}/reset?${redirectParam}`);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your email or phone number to receive reset instructions</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Email/Phone Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setInputMode('email');
                setPhone('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'email'
                  ? 'bg-[#124452] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('phone');
                setEmail('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'phone'
                  ? 'bg-[#124452] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Input Fields */}
          {inputMode === 'email' ? (
            <InputGroup
              label="Email Address"
              inputType="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeHolder="Enter your email"
              required
            />
          ) : (
            <div className="space-y-3">
              <label className="text-[#101928] text-sm font-medium">
                Phone Number <span className="text-[#DD514D]">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-[46px] border border-[#d1d5db] rounded-lg px-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#124452]"
              >
                <option>Nigeria (+234)</option>
                <option>Kenya (+254)</option>
                <option>Ghana (+233)</option>
              </select>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full h-[46px] border border-[#d1d5db] rounded-lg px-2.5 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#124452]"
                placeholder="080 X XXXX XXX"
              />
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500">
            You'll receive a 6-digit code to verify your identity and reset your password.
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            buttonName={
              isPending ? (
                <span className="flex items-center gap-2">
                  <Loader /> Sending...
                </span>
              ) : (
                `Send Reset Code via ${inputMode === 'email' ? 'Email' : 'Phone'}`
              )
            }
            variant="primary"
            buttonSize="full"
            disabled={isPending}
            isLoading={isPending}
          />
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link href={PAGE_ROUTES.auth.login} className="text-[#124452] font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
