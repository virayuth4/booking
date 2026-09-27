"use client";

import { usePathname } from "next/navigation";
import Navigation from "./navigation";
import { useAuth } from "@/app/auth/authContext";


export default function ConditionalNavigation() {
  const pathname = usePathname();
  const {currentUser} = useAuth();

  // Don't render navigation on /[slug] pages
  const isBookingPage =
    pathname !== "/" &&
    pathname.split("/").filter(Boolean).length === 1;

  if (isBookingPage) {
    return null;
  }

  return <Navigation currentUser={currentUser}/>;
}