'use client';

import React, { useState, useEffect } from 'react';
import { useResetPassword } from '@/src/lib/request-handlers/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import InputGroup from '@/src/components/formcomponent/InputGroup';
import Button from '@/src/components/button';
import { PAGE_ROUTES } from '@/src/lib/routes/page_routes';
import Link from 'next/link';
import Loader from '@/src/components/loader';
import { Icon } from '@iconify/react/dist/iconify.js';

export default function ResetPassword() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const country = 'Nigeria (+234)'; // Default country code

  const { mutate: resetPassword, isPending } = useResetPassword();

  // Redirect if no email or phone provided
  useEffect(() => {
    if (!email && !phone) {
      setIsValidating(true);
      router.push(PAGE_ROUTES.auth.passwordReset);
    }
  }, [email, phone, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate inputs
    if (!otp.trim()) {
      return;
    }

    if (otp.length !== 6) {
      return;
    }

    if (!newPassword.trim()) {
      return;
    }

    if (newPassword.length < 8) {
      return;
    }

    if (!confirmPassword.trim()) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    // Validate email or phone
    if (!email && !phone) {
      return;
    }

    const countryCode = country.match(/\(([^)]+)\)/)?.[1] || '';
    const formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    const phoneWithCode =
      phone ? (countryCode + formattedPhone).replace(/^\+/, '') : undefined;

    resetPassword(
      {
        email: email ? email.trim() : undefined,
        phone: phoneWithCode,
        otp: otp.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        onSuccess: () => {
          router.push(PAGE_ROUTES.auth.login);
        },
      }
    );
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
          <p className="text-gray-600">
            Enter the code sent to your {email ? 'email' : 'phone'} and set a new password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
          {/* OTP Input */}
          <div>
            <InputGroup
              label="Verification Code"
              inputType="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              placeHolder="000000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code</p>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#101928] text-sm font-medium">
                New Password <span className="text-[#DD514D]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="text-gray-500 hover:text-gray-700"
              >
                {passwordVisible ? (
                  <Icon icon="mdi:eye-off" width="18" height="18" />
                ) : (
                  <Icon icon="mdi:eye" width="18" height="18" />
                )}
              </button>
            </div>
            <input
              type={passwordVisible ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-[46px] border border-[#d1d5db] rounded-lg px-2.5 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#124452]"
              placeholder="Enter new password"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#101928] text-sm font-medium">
                Confirm Password <span className="text-[#DD514D]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                className="text-gray-500 hover:text-gray-700"
              >
                {confirmPasswordVisible ? (
                  <Icon icon="mdi:eye-off" width="18" height="18" />
                ) : (
                  <Icon icon="mdi:eye" width="18" height="18" />
                )}
              </button>
            </div>
            <input
              type={confirmPasswordVisible ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-[46px] border border-[#d1d5db] rounded-lg px-2.5 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#124452]"
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-[#DD514D] mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            buttonName={
              isPending ? (
                <span className="flex items-center gap-2">
                  <Loader /> Resetting...
                </span>
              ) : (
                'Reset Password'
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
          <p className="text-gray-600 text-sm">
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
