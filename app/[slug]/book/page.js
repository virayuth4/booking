// app/[slug]/book/page.js
import { redirect } from "next/navigation";

export default async function BookPage({ params }) {
  const { slug } = await params;

  redirect(
    `${process.env.NEXT_PUBLIC_TG_MINIAPP_LINK}?startapp=${encodeURIComponent(slug)}`
  );
}