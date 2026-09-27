import { initials } from "@/lib/initials";
import Link from "next/link";

// components/Navigation.jsx
export default function Navigation({ currentUser, plan }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">acme reserve</span>

        <nav className="hidden gap-8 text-sm text-black/60 md:flex">
          <a href="#industries" className="transition hover:text-black">Who it's for</a>
          <a href="#how" className="transition hover:text-black">How it works</a>
          <a href="#pricing" className="transition hover:text-black">Pricing</a>
        </nav>

        {currentUser ? (
          <div className="flex items-center gap-4">
            {plan && (
              <span className="hidden rounded-full border border-black/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-black/45 sm:inline">
                {plan}
              </span>
            )}
             <Link
            href="/admin"
            className="rounded-full bg-[#141414] px-4 py-2 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
            >
              Dashboard
            </Link>
           
          </div>
        ) : (
          <Link
            href="/signup"
            className="rounded-full bg-[#141414] px-4 py-2 text-sm font-medium text-[#faf9f6] transition hover:bg-black"
          >
            Sign Up
          </Link>
        )}
      </div>
    </header>
  );
}