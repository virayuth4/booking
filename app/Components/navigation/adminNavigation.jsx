// components/AdminHeader.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function initials(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export default function AdminHeader({ currentUser, plan, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsMenuOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  function handleHome() {
    setIsMenuOpen(false);
    router.push('/');
  }

    function handlePricing() {
    setIsMenuOpen(false);
    router.push('/#pricing');
  }

      function handleDemo() {
    setIsMenuOpen(false);
    router.push('/cincin-pizzaria-demo');
  }




  function handleLogout() {
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      router.push('/logout');
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#faf9f6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/admin">
            <span className="text-lg font-semibold tracking-tight">acme reserve</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-black/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-black/45 sm:inline">
              {plan}
            </span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="h-8 rounded-full bg-[#141414] px-4 text-center font-mono text-xs leading-8 text-[#faf9f6] transition hover:bg-black/80"
            >
              {currentUser?.phone_number || initials(currentUser?.fullname || currentUser?.email)}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-black/10 bg-[#faf9f6] p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleHome}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-black/80 transition hover:bg-black/5"
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleDemo}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-black/80 transition hover:bg-black/5"
            >
              Demo
            </button>
             <button
              type="button"
              onClick={handlePricing}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-black/80 transition hover:bg-black/5"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}