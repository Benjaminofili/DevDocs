import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevDocs AI - Professional README Generator",
  description: "Generate comprehensive, AI-powered README documentation for your projects. Supports multiple tech stacks with intelligent analysis.",
  keywords: "readme generator, documentation, ai, developer tools, github, markdown",
  authors: [{ name: "Benjamin Ofili" }],
  creator: "Benjamin Ofili",
  openGraph: {
    title: "DevDocs AI - Professional README Generator",
    description: "Generate comprehensive, AI-powered README documentation for your projects",
    url: "https://devdocs-ai.vercel.app",
    siteName: "DevDocs AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevDocs AI - Professional README Generator",
    description: "Generate comprehensive, AI-powered README documentation for your projects",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
