'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginLogic } from '../auth/useLoginLogic';
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from '@/lib/formStyle';


function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function LoginForm({ isMerchant = false, callback: callbackProp }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = callbackProp ?? searchParams.get('callback');

  const { error, isLoading, phoneEmailSignIn, googleSignIn } = useLoginLogic({ isModal: false });

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
    }
  };

  const isPhoneNumberValid = () => {
    return phone.length >= 8 && phone.length <= 11;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    const formattedPhone = phone.startsWith('0')
      ? phone.substring(1)
      : phone;

    try {
      await phoneEmailSignIn(formattedPhone, password);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  const goToSignupWithCallback = () => {
    const url = callback ? `/signup?callback=${encodeURIComponent(callback)}` : '/signup';
    router.push(url);
  };

   return (
    <div className="min-h-screen bg-white px-5 py-8 text-[#141414] md:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col md:justify-center">

        {/* Header */}
        <div className="mb-6">
          {isMerchant && (
            <div className="mb-4 pt-2">
              <span className="font-mono text-[11px] tracking-wide text-black/35 uppercase">
                merchant portal
              </span>
            </div>
          )}

          <h1 className="text-2xl font-semibold leading-[1.05] tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-black/55">
            Sign in to manage your bookings.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/5 px-3.5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Google Sign-in */}
        {/* <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={secondaryButtonClasses}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continue with Google</span>
        </button> */}

        {/* <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="font-mono text-[11px] tracking-wide text-black/35">OR</span>
          <div className="h-px flex-1 bg-black/10" />
        </div> */}

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
              Phone number
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="012 xxx 456"
              value={phone}
              onChange={handlePhoneChange}
              required
              disabled={isLoading}
              autoComplete="tel"
              className={fieldClasses}
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="font-mono text-[11px] tracking-wide text-black/55 hover:text-[#141414] disabled:opacity-50"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
              className={fieldClasses}
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              disabled={isLoading}
              className="text-sm text-black/55 transition hover:text-[#141414] disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading} className={primaryButtonClasses}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Signup */}
        <div className="mt-8 text-center text-sm">
          <span className="text-black/55">Don&apos;t have an account?</span>{' '}
          <button
            type="button"
            onClick={goToSignupWithCallback}
            disabled={isLoading}
            className="font-semibold text-[#141414] hover:underline disabled:opacity-50"
          >
            {isMerchant ? 'Create merchant account' : 'Create an account'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center font-mono text-[11px] text-black/35">
          © {new Date().getFullYear()} acme reserve
        </div>
      </div>
    </div>
  );
}