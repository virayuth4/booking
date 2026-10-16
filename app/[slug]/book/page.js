// app/[slug]/book/page.js
import { redirect, notFound } from "next/navigation";
import { getBookingPage } from "@/lib/bookingPage";

const BOT = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;

function buildTelegramLink(slug) {
  return `${BOT}?startapp=${encodeURIComponent(slug)}`;
}

export default async function BookPage({ params }) {
  const { slug } = await params;

  // Optional: keep this so bad slugs 404 instead of opening the Mini App with junk.
  const page = await getBookingPage(slug);
  if (!page) notFound();

  redirect(buildTelegramLink(slug));
}