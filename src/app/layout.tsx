
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import { PostHogProvider } from "@/lib/analytics";

import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { NavigationObserver } from "@/components/navigation-observer";
import { StageProvider } from "@/hooks/use-stage-status";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dev X – Build Apps, Your Way",
  description: "Dev X: Effortless, code-free app creation with a beautiful black theme and modern font.",
  icons: {
    icon: "/logo.svg",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1db954"
        }
      }}
    >
      <TRPCReactProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${spaceGrotesk.variable} antialiased bg-background text-foreground`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <PostHogProvider>
                <StageProvider>
                  <Toaster />
                  <SonnerToaster position="top-right" richColors />
                  <Suspense fallback={null}>
                    <NavigationObserver />
                  </Suspense>
                  {children}
                </StageProvider>
              </PostHogProvider>
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
