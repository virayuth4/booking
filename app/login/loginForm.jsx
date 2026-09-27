'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginLogic } from '../auth/useLoginLogic';

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
    <div className="min-h-screen bg-background px-5 py-8 font-sans text-foreground antialiased md:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col md:justify-center">

        {/* Header */}
        <div className="mb-8">
          {isMerchant && (
            <div className="mb-3">
              <span className="inline-flex rounded border border-border px-2 py-0.5 font-tape text-[10px] tracking-wider text-muted-foreground uppercase">
                merchant portal
              </span>
            </div>
          )}

          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>

          <p className="font-body mt-2 text-sm leading-5 text-muted-foreground">
        
              Sign in to manage your bookings.
            
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="font-body mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="press flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 font-sans text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continue with Google</span>
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[11px] text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block font-sans text-sm font-medium text-foreground"
            >
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
              className="w-full rounded-lg border border-border bg-card px-3.5 py-3 font-body text-base text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-sans text-sm font-medium text-foreground"
              >
                Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="font-tape text-[11px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {showPassword ? 'hide' : 'show'}
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
              className="w-full rounded-lg border border-border bg-card px-3.5 py-3 font-body text-base text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              disabled={isLoading}
              className="font-body text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
         <button
          type="submit"
          disabled={isLoading}
          className="text-white press flex w-full items-center justify-center gap-2 bg-black rounded-full bg-primary px-4 py-3.5 font-sans text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
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
        <div className="mt-8 text-center font-sans text-sm">
          <span className="text-muted-foreground">
            Don&apos;t have an account?{' '}
          </span>
          <button
            type="button"
            onClick={goToSignupWithCallback}
            disabled={isLoading}
            className="font-medium text-foreground transition hover:underline disabled:opacity-50"
          >
            {isMerchant
              ? 'Create merchant account'
              : 'Create an account'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center font-tape text-[11px] uppercase tracking-wider text-muted-foreground/70">
          © {new Date().getFullYear()} acme reserve
        </div>
      </div>
    </div>
  );
}