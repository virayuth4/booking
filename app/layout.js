import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth/authContext";
import { NavActionProvider } from "./context/navActionContext";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
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
  title: "acme reserve",
  description: "Booking platform for restaurants, pilate studios, barbers and etc.",
  // icons: {
  //   icon: "/icon-192.png",
  // },
  // openGraph: {
  //   images: ["/icon-192.png"],
  // },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
         <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
                <ConditionalNavigation/>
            {/* <TopNavigation/> */}
            <main className="flex-1 ">{children}</main>
            <Analytics />
        {/* <TelegramFloat/> */}
        </AuthProvider>
      </body>
    </html>
  );
}