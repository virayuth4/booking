"use client";

import { usePathname } from "next/navigation";
import Navigation from "./navigation";
import { useAuth } from "@/app/auth/authContext";

const ALLOWED_TOP_LEVEL_PATHS = ["login", "signup", "forgot-password", "about"];

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const segments = pathname.split("/").filter(Boolean);

  const isAllowedPage = ALLOWED_TOP_LEVEL_PATHS.includes(segments[0]);

  // Hide navigation on /[slug] and /[slug]/book
  const isBookingPage =
    !isAllowedPage &&
    (segments.length === 1 ||
      (segments.length === 2 && segments[1] === "book"));

  // Don't render navigation anywhere under /admin
  const isAdminPage = segments[0] === "admin";

  if (isBookingPage || isAdminPage) {
    return null;
  }

  return <Navigation currentUser={currentUser} />;
}