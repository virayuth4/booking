'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const BOT_ID = process.env.NEXT_PUBLIC_ACME_TELEGRAM_LOGIN_BOT_TOKEN; // numeric part of the bot token (before the ":")

function TelegramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <circle cx="12" cy="12" r="12" fill="#27A7E7" />
      <path
        fill="#fff"
        d="M5.43 11.87c3.5-1.52 5.84-2.53 7-3.01 3.33-1.39 4.03-1.63 4.48-1.64.1 0 .32.02.46.14.12.1.16.23.17.33.02.1.04.3.02.47-.18 1.9-.96 6.5-1.36 8.62-.17.9-.5 1.2-.82 1.23-.7.06-1.23-.46-1.9-.9-1.06-.69-1.65-1.12-2.68-1.8-1.19-.78-.42-1.2.26-1.9.18-.18 3.26-2.99 3.32-3.25.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.11.02-1.8 1.14-5.09 3.36-.48.33-.92.5-1.31.49-.43-.01-1.26-.24-1.88-.44-.76-.25-1.36-.38-1.31-.8.03-.22.33-.45.9-.68Z"
      />
    </svg>
  );
}

function TelegramLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get('callback');

  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Telegram's official widget script (exposes window.Telegram.Login)
  useEffect(() => {
    if (window.Telegram?.Login) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError('Could not load Telegram. Check your connection.');
    document.body.appendChild(script);
  }, []);

  const handleTelegramLogin = () => {
    setError('');

    if (!BOT_ID) {
      setError('Telegram login is not configured.');
      return;
    }

    setIsLoading(true);

    window.Telegram.Login.auth({ bot_id: Number(BOT_ID), request_access: 'write' }, async (user) => {
      // user is false if the person closed the popup or denied access
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login failed');

        router.push(callback || '/');
      } catch (err) {
        setError(err.message || 'Login failed. Please try again.');
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-8 font-sans text-foreground antialiased md:px-6 md:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col md:justify-center">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="font-body mt-2 text-sm leading-5 text-muted-foreground">
            Sign in with your Telegram account.
          </p>
        </div>

        {error && (
          <div className="font-body mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleTelegramLogin}
          disabled={!scriptReady || isLoading}
          className="press flex w-full items-center justify-center gap-2 rounded-full bg-[#27A7E7] px-4 py-3.5 font-sans text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading || !scriptReady ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TelegramIcon className="rounded-full bg-white" />
          )}
          <span>{isLoading ? 'Waiting for Telegram...' : 'Login with Telegram'}</span>
        </button>

        <p className="font-body mt-4 text-center text-xs text-muted-foreground">
          A Telegram popup will ask you to confirm.
        </p>

        <div className="mt-8 text-center font-sans text-sm">
          <button
            type="button"
            onClick={() => router.push(callback ? `/login?callback=${encodeURIComponent(callback)}` : '/login')}
            disabled={isLoading}
            className="text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            Use phone number instead
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TelegramLoginPage() {
  return (
    <Suspense fallback={null}>
      <TelegramLogin />
    </Suspense>
  );
}