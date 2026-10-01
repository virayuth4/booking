'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegistration } from '../context/registrationContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from 'lucide-react';
import { useSignUpLogic } from '../auth/signUpLogic';

const API = `${process.env.NEXT_PUBLIC_BACKEND}/api/flutter/user/registration`;

export default function OtpForm() {
  const router = useRouter();
  const { registrationData, clearRegistrationData, incrementAttempts } = useRegistration();
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false); // Phase A -> Phase B

  // Password only ever lives here, in local state, never in context/localStorage
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Timer only starts once the bot has actually sent the code
  const [timeLeft, setTimeLeft] = useState(0);

  // Telegram step: 'idle' -> 'waiting' -> 'code_sent'
  const [tgStatus, setTgStatus] = useState('idle');
  const [tgDetail, setTgDetail] = useState('pending'); // 'pending' | 'awaiting_contact'
  const [tgNonce, setTgNonce] = useState(null);
  const [tgDeepLink, setTgDeepLink] = useState('');
  const [tgExpiresAt, setTgExpiresAt] = useState(null);

  const { phoneEmailSignUp } = useSignUpLogic({ isModal: false });
  const searchParams = useSearchParams();
  const flowType = searchParams.get('flow') || 'registration';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const countdownInterval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(countdownInterval);
  }, [timeLeft]);

  useEffect(() => {
    if (isVerified) return;
    const checkData = setTimeout(() => {
      if (!registrationData.phoneNumber) {
        router.replace('/signup');
      } else {
        setIsCheckingData(false);
      }
    }, 300);
    return () => clearTimeout(checkData);
  }, [registrationData, router, isVerified]);

  // Poll the server while the user is in Telegram
  useEffect(() => {
    if (tgStatus !== 'waiting' || !tgNonce) return;

    let cancelled = false;

    const poll = async () => {
      if (tgExpiresAt && Date.now() > new Date(tgExpiresAt).getTime()) {
        setTgStatus('idle');
        setError('Telegram link expired. Please try again.');
        return;
      }

      try {
        const res = await fetch(`${API}/telegram/status/${tgNonce}`, { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;

        switch (data.status) {
          case 'code_sent':
            setError('');
            setTimeLeft(60);
            setTgStatus('code_sent');
            break;
          case 'awaiting_contact':
            setTgDetail('awaiting_contact');
            break;
          case 'phone_mismatch':
            setTgStatus('idle');
            setError('The Telegram number does not match the number you entered.');
            break;
          case 'expired':
            setTgStatus('idle');
            setError('Telegram link expired. Please try again.');
            break;
          default:
            break; // 'pending' – keep waiting
        }
      } catch {
        // Network blip – next tick will retry
      }
    };

    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tgStatus, tgNonce, tgExpiresAt]);

  // Step 1: ask the server for a one-time link to the bot
  const handleGetTelegramCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/telegram/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: registrationData.phoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Could not start Telegram verification');

      setTgNonce(data.nonce);
      setTgDeepLink(data.deepLink);
      setTgExpiresAt(data.expiresAt);
      setTgDetail('pending');
      setTgStatus('waiting');

      // May be blocked on some mobile browsers – the "Open Telegram" link below is the fallback
      window.open(data.deepLink, '_blank', 'noopener');
    } catch (err) {
      setError(err.message || 'Could not start Telegram verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Phase A: verify the OTP code only — no password involved yet
  const handleVerifyOTP = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { phoneNumber } = registrationData;

      const verifyResponse = await fetch(
        `${API}/otp/confirmation/${phoneNumber}`,
        {
          method: "POST",
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp })
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || errorData.message || 'Failed to verify OTP');
      }

      // Code confirmed — move to password step, don't create the account yet
      setOtpVerified(true);
      setIsLoading(false);
    } catch (error) {
      setError(error.message || 'Failed to verify OTP. Please try again.');
      setIsLoading(false);
    }
  };

  // Phase B: password never leaves this function's scope beyond the fetch call itself
  const handleCreateAccount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { phoneNumber, fullName } = registrationData;
      const result = await phoneEmailSignUp(phoneNumber, password, fullName);

      if (result.success) {
        setIsVerified(true);
        clearRegistrationData();
        // Explicitly drop password from memory as soon as we're done with it
        setPassword('');
        setConfirmPassword('');
        router.push('/');
      } else {
        throw new Error(result.error || 'Failed to complete registration');
      }
    } catch (error) {
      setError(error.message || 'Failed to complete registration. Please try again.');
      setIsLoading(false);
    }
  };

  // Resend: server's bot DMs a new code to the chat that already shared its number
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      incrementAttempts();
      const res = await fetch(`${API}/otp/resend/${registrationData.phoneNumber}`, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registrationData.fullName,
          attempts: registrationData.attempts + 1
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to resend code');
      }
      setOtp('');
      setTimeLeft(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (isCheckingData) {
    return (
      <div className="flex justify-center items-center h-screen bg-white font-mono text-xs uppercase tracking-wider text-black">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-3 w-3 animate-spin text-black" />
          <span>LOADING...</span>
        </div>
      </div>
    );
  }

  const codeSent = tgStatus === 'code_sent';

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 md:p-12 font-mono text-xs uppercase tracking-wider text-black">
      <div className="hidden md:block"></div>

      <div className="w-full max-w-[320px] mx-auto my-auto space-y-8">
        <div className="text-left border-b border-black pb-3 space-y-2">
          <h1 className="text-sm font-normal tracking-widest">
            {otpVerified ? 'Set Password' : 'Verification'}
          </h1>
          <p className="text-[10px] text-stone-500 normal-case tracking-normal leading-relaxed">
            {otpVerified
              ? 'Your phone number has been verified. Choose a password to finish creating your account.'
              : codeSent
                ? 'Your code has been sent to your Telegram chat. Enter it below.'
                : `Verify +855 ${registrationData.phoneNumber} with Telegram. Your code will be sent in a chat with our bot.`}
          </p>
        </div>

        {!otpVerified && codeSent && (
          <div className="text-left text-[10px] text-stone-500 tracking-widest">
            EXPIRES IN: <span className="text-black font-normal">{formatTime(timeLeft)}</span>
          </div>
        )}

        {error && (
          <div className="p-3 border border-black bg-neutral-50 text-stone-600 normal-case tracking-normal">
            <p>{error}</p>
          </div>
        )}

        {/* Phase A.1 — get the code from Telegram */}
        {!otpVerified && !codeSent && (
          tgStatus === 'waiting' ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[10px] tracking-widest">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>WAITING FOR TELEGRAM...</span>
              </div>

              <ol className="list-decimal list-inside space-y-1 normal-case tracking-normal text-[11px] leading-relaxed">
                <li className={tgDetail === 'pending' ? 'text-black' : 'text-stone-400'}>
                  Open the bot and tap Start
                </li>
                <li className={tgDetail === 'awaiting_contact' ? 'text-black' : 'text-stone-400'}>
                  Tap “Share my number”
                </li>
                <li className="text-stone-400">Come back here and enter your code</li>
              </ol>

              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[10px] tracking-widest text-black hover:underline underline-offset-4"
              >
                Open Telegram again
              </a>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleGetTelegramCode}
              className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-normal tracking-widest rounded-none border-0 shadow-none transition-colors duration-200 disabled:opacity-30 disabled:bg-black"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>OPENING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="h-3 w-3" />
                  <span>GET CODE ON TELEGRAM</span>
                </div>
              )}
            </Button>
          )
        )}

        {/* Phase A.2 — OTP entry (after the bot sent the code) */}
        {!otpVerified && codeSent && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="ENTER CODE"
              className="w-full h-10 px-0 bg-transparent border-0 border-b border-stone-300 rounded-none text-black placeholder:text-stone-400 focus-visible:border-black focus-visible:ring-0 focus-visible:outline-none transition-colors duration-200 text-left tracking-widest"
              required
              disabled={isLoading || timeLeft <= 0}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button
              type="submit"
              className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-normal tracking-widest rounded-none border-0 shadow-none transition-colors duration-200 disabled:opacity-30 disabled:bg-black"
              disabled={isLoading || timeLeft <= 0}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>VERIFYING...</span>
                </div>
              ) : 'CONFIRM CODE'}
            </Button>
          </form>
        )}

        {/* Phase B — password entry, local state only */}
        {otpVerified && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1 relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-10 px-0 pr-12 bg-transparent border-0 border-b border-stone-300 rounded-none text-black placeholder:text-stone-400 focus-visible:border-black focus-visible:ring-0 focus-visible:outline-none transition-colors duration-200"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black transition-colors duration-200 text-[10px] tracking-widest focus:outline-none"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full h-10 px-0 bg-transparent border-0 border-b border-stone-300 rounded-none text-black placeholder:text-stone-400 focus-visible:border-black focus-visible:ring-0 focus-visible:outline-none transition-colors duration-200"
              disabled={isLoading}
              autoComplete="new-password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-normal tracking-widest rounded-none border-0 shadow-none transition-colors duration-200 disabled:opacity-30 disabled:bg-black"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>CREATING...</span>
                  </div>
                ) : 'CREATE ACCOUNT'}
              </Button>
            </div>
          </form>
        )}

        {!otpVerified && (
          <div className="flex flex-col space-y-2 text-[10px] text-stone-500 tracking-widest pt-2 border-t border-stone-100">
            {codeSent && (
              timeLeft <= 0 ? (
                registrationData.attempts > 3 ? (
                  <p className="text-stone-400 normal-case tracking-normal">
                    Maximum allocation of code retransmissions exceeded.
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-left text-black hover:underline underline-offset-4 focus:outline-none"
                  >
                    Resend Code
                  </button>
                )
              ) : (
                <p className="normal-case tracking-normal text-stone-400 leading-relaxed">
                  If the message was not received, a new request will become available once the active code expires.
                </p>
              )
            )}

            {tgStatus === 'waiting' && (
              <button
                onClick={() => setTgStatus('idle')}
                className="text-left hover:text-black transition-colors duration-200 focus:outline-none"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => router.push('/signup')}
              disabled={isLoading}
              className="text-left hover:text-black transition-colors duration-200 focus:outline-none pt-2"
            >
              Return to Sign up
            </button>
          </div>
        )}
      </div>

      <div className="text-center md:text-left text-[9px] text-stone-400 tracking-widest mt-auto pt-12">
        © {new Date().getFullYear()} ALL RIGHTS RESERVED
      </div>
    </div>
  );
}