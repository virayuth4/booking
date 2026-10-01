'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import OtpStep from '../Components/OTPStep';

const API = `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user`;

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');       // local state only, never persisted
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Telegram verification modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpBusy, setIsOtpBusy] = useState(false); // reported by <OtpStep />

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) setPhoneNumber(value);
  };

  const isPhoneNumberValid = () => phoneNumber.length >= 8 && phoneNumber.length <= 11;

  const formattedPhone = () => (phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber);

  // Step 1: validate locally, then ask the server to open a pending reset for this phone.
  // The password stays in this component. No code is sent yet: the bot sends it
  // only after Telegram proves the phone number.
  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API}/forgot-password/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'Something went wrong');

      setShowOtpModal(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: called by <OtpStep /> with the code the user typed. Only now does the
  // password leave the browser, in this one request together with the code.
  const handleSubmitCode = async (otpCode) => {
    const response = await fetch(`${API}/forgot-password/otp-confirmation`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formattedPhone(), otpCode, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Invalid code, please try again');

    setNewPassword('');
    setConfirmPassword('');
    router.push('/login?reset=success');
  };

  return (
    <div className="min-h-screen px-5 py-8 text-slate-900 md:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col justify-center">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm leading-5 text-slate-500">
            Enter your phone number and choose a new password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleContinue} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Phone */}
          <div>
            <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium">
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="012 xxx 456"
              value={phoneNumber}
              onChange={handlePhoneChange}
              required
              disabled={isLoading}
              autoComplete="tel"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* New Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </label>
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password"
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !isPhoneNumberValid() || !newPassword || !confirmPassword}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>

        {/* Login */}
        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500">Remember your password?</span>{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            disabled={isLoading}
            className="font-semibold text-slate-900 hover:underline disabled:opacity-50"
          >
            Back to sign in
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} acme reserve
        </div>
      </div>

      {/* Telegram verification modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              disabled={isOtpBusy}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-900 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 pr-8">
              <h2 className="text-xl font-semibold tracking-tight">Verify your phone</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                Confirm +855 {formattedPhone()} with a code from Telegram, then your password will be reset.
              </p>
            </div>

            <OtpStep
              phoneNumber={formattedPhone()}
              onSubmitCode={handleSubmitCode}
              onBusyChange={setIsOtpBusy}
            />
          </div>
        </div>
      )}
    </div>
  );
}