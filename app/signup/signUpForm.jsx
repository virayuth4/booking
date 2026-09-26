'use client';

import React, { useState } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignUpLogic } from '../auth/signUpLogic';

const STEPS = {
  PHONE: 'phone',
  PASSWORD: 'password',
  OTP: 'otp',
};

const STEP_META = {
  [STEPS.PHONE]: { n: '01', title: 'Create your account', sub: 'Start earning cashback with RielPoint.' },
  [STEPS.PASSWORD]: { n: '02', title: 'Set a password', sub: "You'll use this to sign in next time." },
  [STEPS.OTP]: { n: '03', title: 'Verify your phone', sub: null },
};

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

// shared field classes — rounded-xl panel, hairline border, mono-friendly focus ring
const fieldClasses =
  'w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm text-[#141414] outline-none transition placeholder:text-black/30 focus:border-black/30 focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50';

const primaryButtonClasses =
  'flex w-full items-center justify-center gap-2 rounded-full bg-[#141414] px-4 py-3 text-sm font-semibold text-[#faf9f6] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40';

const secondaryButtonClasses =
  'flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-[#f2f0ea] px-4 py-3 text-sm font-semibold text-[#141414] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50';

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { phoneEmailSignUp, googleSignUp } = useSignUpLogic({ isModal: false });
  const callback = searchParams.get('callback');

  // Wizard step
  const [step, setStep] = useState(STEPS.PHONE);

  // Signup fields — all local, never persisted
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attempts, setAttempts] = useState(1);

  const [referredBy] = useState(() => {
    const ref = searchParams.get('ref');
    return ref && /^\d+$/.test(ref) ? ref : null; // must be a plain integer id
  });

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) setPhoneNumber(value);
  };

  const isPhoneNumberValid = () => phoneNumber.length >= 8 && phoneNumber.length <= 11;

  const formattedPhoneForApi = () =>
    phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;

  // Step 1 -> Step 2: just move forward, no API call yet
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!isPhoneNumberValid()) return;
    setStep(STEPS.PASSWORD);
  };

  // Step 2: submit phoneNumber + password, get OTP sent
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log("Sending Registration Initiate")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user/registration/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhoneForApi(), password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to send OTP');
      }

      setTimeLeft(60);
      setStep(STEPS.OTP);
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown for OTP step
  React.useEffect(() => {
    if (step !== STEPS.OTP || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Step 3: confirm OTP, then create the account
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setOtpError('');

    try {
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user/registration/otp/confirmation/${formattedPhoneForApi()}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || errorData.message || 'Invalid code');
      }

      // Backend already created the account using the password from step 2
      // (see backend notes below) — sign the user in client-side now
      const result = await phoneEmailSignUp(formattedPhoneForApi(), password, referredBy);

      if (result.success) {
        setPassword('');
        router.push(callback || '/');
      } else {
        throw new Error(result.error || 'Failed to complete sign in');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setOtpError('');

    try {
      console.log("Hand resending otp")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user/registration/otp/resend/${formattedPhoneForApi()}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to resend code');
      }

      setAttempts(data.resendCount);
      setTimeLeft(60);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Google sign-up short-circuits the whole phone/OTP wizard
  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await googleSignUp();
      if (!result?.success) {
        setError(result?.error || 'Failed to sign up with Google. Please try again.');
      }
      // On success, googleSignUp's handleSuccessfulSignUp already redirects.
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const goBack = () => {
    setError('');
    if (step === STEPS.PASSWORD) setStep(STEPS.PHONE);
    else if (step === STEPS.OTP) setStep(STEPS.PASSWORD);
  };

  const meta = STEP_META[step];

  return (
    <div className="min-h-screen bg-white px-5 py-8 text-[#141414] md:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col md:justify-center">

        {/* Header */}
        <div className="mb-6">
          {step !== STEPS.PHONE && (
            <button
              type="button"
              onClick={goBack}
              disabled={isLoading || isVerifying}
              className="mb-5 -ml-1 flex items-center gap-1 text-sm font-medium text-black/55 hover:text-[#141414] disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {/* mono step numeral over a hairline rule */}
          <div className="mb-4 border-t border-black/15 pt-2">
            <span className="font-mono text-[11px] tracking-wide text-black/35">{meta.n} / 03</span>
          </div>

          <h1 className="text-2xl font-semibold leading-[1.05] tracking-tight">
            {meta.title}
          </h1>

          <p className="mt-2 text-sm text-black/55">
            {step === STEPS.OTP ? (
              <>
                Enter the code sent to{' '}
                <span className="font-mono text-black/70">+855 {formattedPhoneForApi()}</span>
              </>
            ) : (
              meta.sub
            )}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/5 px-3.5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Phone */}
        {step === STEPS.PHONE && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className={secondaryButtonClasses}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <span className="font-mono text-[11px] tracking-wide text-black/35">OR</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-5">
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
                  autoFocus
                  autoComplete="tel"
                  className={fieldClasses}
                />
              </div>

              <button type="submit" disabled={!isPhoneNumberValid()} className={primaryButtonClasses}>
                Continue
              </button>
            </form>
          </>
        )}

        {/* Step 2: Password */}
        {step === STEPS.PASSWORD && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
                autoFocus
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="new-password"
                className={fieldClasses}
              />
            </div>

            <button type="submit" disabled={isLoading || !password} className={primaryButtonClasses}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>
        )}

        {/* Step 3: OTP */}
        {step === STEPS.OTP && (
          <>
            <div className="mb-5 text-center text-sm text-black/55">
              Code expires in{' '}
              <span className="font-mono font-medium text-[#141414]">{formatTime(timeLeft)}</span>
            </div>

            {otpError && (
              <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/5 px-3.5 py-3 text-sm text-red-600">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label htmlFor="otp" className="mb-1.5 block text-sm font-medium">
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  disabled={isVerifying || timeLeft <= 0}
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className={`${fieldClasses} text-center font-mono text-lg tracking-[0.3em] placeholder:text-black/20`}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || timeLeft <= 0}
                className={primaryButtonClasses}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify phone</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              {timeLeft <= 0 ? (
                attempts > 3 ? (
                  <p className="text-sm text-black/35">Maximum resend attempts reached.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isVerifying || isResending}
                    className="text-sm font-medium text-[#141414] hover:underline disabled:opacity-50"
                  >
                    {isResending ? 'Resending...' : 'Resend verification code'}
                  </button>
                )
              ) : (
                <p className="text-sm text-black/35">You can request a new code after it expires.</p>
              )}
            </div>
          </>
        )}

        {/* Login */}
        {step === STEPS.PHONE && (
          <div className="mt-8 text-center text-sm">
            <span className="text-black/55">Already have an account?</span>{' '}
            <button
              type="button"
              onClick={() => router.push(callback ? `/login?callback=${encodeURIComponent(callback)}` : '/login')}
              className="font-semibold text-[#141414] hover:underline"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center font-mono text-[11px] text-black/35">
          © {new Date().getFullYear()} RielPoint
        </div>
      </div>
    </div>
  );
}