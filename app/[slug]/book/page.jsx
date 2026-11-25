import { redirect } from "next/navigation";


export default async function BookRedirect({ params }) {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_TG_MINIAPP_LINK;

  if (base) {
    redirect(`${base}?startapp=${encodeURIComponent(slug)}`);
  }

  // Fallback if the env var isn't set (e.g. local dev)
  redirect(`/${slug}/booking`);
}