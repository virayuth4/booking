import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth/authContext";
import { NavActionProvider } from "./context/navActionContext";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Navigation from "./Components/navigation/navigation";
import ConditionalNavigation from "./Components/navigation/conditionalNavigation";

// Load Google Sans alternative (Plus Jakarta Sans)
const googleSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Riel Point",
  description: "Cambodia Cashback & Rewards Platform",
  icons: {
    icon: "/icon-192.png",
  },
  openGraph: {
    images: ["/icon-192.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://rielpoint.firebaseapp.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://rielpoint.firebaseapp.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
                <ConditionalNavigation/>
            {/* <TopNavigation/> */}
            <main className="flex-1 pb-62.5">{children}</main>
            <Analytics />
        
        </AuthProvider>
      </body>
    </html>
  );
}