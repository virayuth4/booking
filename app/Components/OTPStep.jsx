'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { fieldClasses, primaryButtonClasses } from '@/lib/formStyle';
import { QRCodeSVG } from 'qrcode.react';

const REGISTRATION_API = `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/user/registration`;
const OTP_LIFETIME_SECONDS = 60;

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

/**
 * OTP verification step, delivered through a Telegram bot.
 *
 * Flow: "Get code on Telegram" -> user taps Start + Share my number in the bot
 *       -> server sends the code in the chat -> user types it here.
 *
 * Props:
 *  - phoneNumber:   phone in API format (no leading 0)
 *  - onVerified:    async () => void. Sign-up flow: called after the code is confirmed
 *                   by the default registration endpoint. Throw an Error to show a message.
 *  - onSubmitCode:  optional async (code: string) => void. When provided, it REPLACES the default
 *                   registration confirmation and onVerified (used by forgot-password, where the
 *                   code and the new password are submitted together). Throw an Error to show a message.
 *  - onBusyChange:  optional (busy: boolean) => void, so the parent can disable its Back/Close button
 */
export default function OtpStep({ phoneNumber, onVerified, onSubmitCode, onBusyChange }) {
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [attempts, setAttempts] = useState(1);

  // Timer only starts once the bot has actually sent the code
  const [timeLeft, setTimeLeft] = useState(0);

  // Telegram: 'idle' -> 'waiting' -> 'code_sent'
  const [tgStatus, setTgStatus] = useState('idle');
  const [tgDetail, setTgDetail] = useState('pending'); // 'pending' | 'awaiting_contact'
  const [tgNonce, setTgNonce] = useState(null);
  const [tgDeepLink, setTgDeepLink] = useState('');
  const [tgExpiresAt, setTgExpiresAt] = useState(null);

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Let the parent know when we're mid-request
  useEffect(() => {
    onBusyChange?.(isVerifying || isResending || isStarting);
  }, [isVerifying, isResending, isStarting, onBusyChange]);

  // Poll the server while the user is in Telegram
  useEffect(() => {
    if (tgStatus !== 'waiting' || !tgNonce) return;

    let cancelled = false;

    const poll = async () => {
      if (tgExpiresAt && Date.now() > new Date(tgExpiresAt).getTime()) {
        setTgStatus('idle');
        setOtpError('Telegram link expired. Please try again.');
        return;
      }

      try {
        const res = await fetch(`${REGISTRATION_API}/telegram/status/${tgNonce}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (cancelled) return;

        switch (data.status) {
          case 'code_sent':
            setOtpError('');
            setTimeLeft(OTP_LIFETIME_SECONDS);
            setTgStatus('code_sent');
            break;
          case 'awaiting_contact':
            setTgDetail('awaiting_contact');
            break;
          case 'phone_mismatch':
            setTgStatus('idle');
            setOtpError('The Telegram number does not match the number you entered.');
            break;
          case 'expired':
            setTgStatus('idle');
            setOtpError('Telegram link expired. Please try again.');
            break;
          default:
            break; // 'pending' – keep waiting
        }
      } catch {
        // Network blip – next tick retries
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
    setIsStarting(true);
    setOtpError('');

    try {
      const res = await fetch(`${REGISTRATION_API}/telegram/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      // A 404/500 HTML page isn't JSON, so don't let .json() throw a confusing parse error
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `Telegram verification unavailable (${res.status})`);
      }

      setTgNonce(data.nonce);
      setTgDeepLink(data.deepLink);
      setTgExpiresAt(data.expiresAt);
      setTgDetail('pending');
      setTgStatus('waiting');

      // May be blocked on some mobile browsers – the "Open Telegram" link below is the fallback
      window.open(data.deepLink, '_blank', 'noopener');
    } catch (err) {
      setOtpError(err.message || 'Could not start Telegram verification.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setOtpError('');

    try {
      if (onSubmitCode) {
        await onSubmitCode(otp);
      } else {
        const verifyResponse = await fetch(`${REGISTRATION_API}/otp/confirmation/${phoneNumber}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Invalid code');
        }

        await onVerified();
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Server's bot DMs a new code to the chat that already shared its number
  const handleResendOTP = async () => {
    setIsResending(true);
    setOtpError('');

    try {
      const response = await fetch(`${REGISTRATION_API}/otp/resend/${phoneNumber}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to resend code');
      }

      setOtp('');
      setAttempts(data.resendCount);
      setTimeLeft(OTP_LIFETIME_SECONDS);
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const errorBox = otpError && (
    <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/5 px-3.5 py-3 text-sm text-red-600">
      {otpError}
    </div>
  );

  // ── A. Get the code from Telegram ───────────────────────────────
  if (tgStatus !== 'code_sent') {
    return (
      <>
        {errorBox}

        {tgStatus === 'waiting' ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-black/55">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for Telegram...</span>
            </div>

             {/* Desktop only: phones are already in the right place, so they use the link instead */}
    {tgDeepLink && (
      <div className="hidden flex-col items-center gap-2 rounded-xl border border-black/10 p-4 md:flex">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={tgDeepLink} size={168} level="M" marginSize={1} />
        </div>
        <p className="text-xs text-black/55">Scan with your phone to open Telegram</p>
      </div>
    )}

            <ol className="space-y-2 text-sm">
              <li className={`flex gap-3 ${tgDetail === 'pending' ? 'text-[#141414]' : 'text-black/35'}`}>
                <span className="font-mono text-[11px] pt-0.5">01</span>
                <span>Open the bot and tap Start</span>
              </li>
              <li className={`flex gap-3 ${tgDetail === 'awaiting_contact' ? 'text-[#141414]' : 'text-black/35'}`}>
                <span className="font-mono text-[11px] pt-0.5">02</span>
                <span>Tap “Share my number”</span>
              </li>
              <li className="flex gap-3 text-black/35">
                <span className="font-mono text-[11px] pt-0.5">03</span>
                <span>Come back here and enter your code</span>
              </li>
            </ol>

            <div className="flex items-center justify-between text-sm">
              <a
                href={tgDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#141414] hover:underline"
              >
                Open Telegram again
              </a>
              <button
                type="button"
                onClick={() => setTgStatus('idle')}
                className="text-black/55 hover:text-[#141414]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGetTelegramCode}
            disabled={isStarting}
            className={primaryButtonClasses}
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Opening Telegram...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Get code on Telegram</span>
              </>
            )}
          </button>
        )}
      </>
    );
  }

  // ── B. Enter the code ───────────────────────────────────────────
  return (
    <>
      <div className="mb-5 text-center text-sm text-black/55">
        Code expires in{' '}
        <span className="font-mono font-medium text-[#141414]">{formatTime(timeLeft)}</span>
      </div>

      {errorBox}

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
            autoComplete="one-time-code"
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
  );
}