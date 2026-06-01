import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider as GymAuthProvider } from "@/lib/auth/context";
import { AuthProvider as IGCAuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/lib/context/theme-context";
import { LanguageProvider } from "@/lib/context/language-context";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "Infinity Gym Center",
  description: "Gestion de salle de sport - Système de gestion des adhérents",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Infinity Gym",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E10600",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Infinity Gym" />
        <link rel="apple-touch-icon" href="/logo-transparent.png" />
      </head>
      <body className="min-h-screen">
        <ErrorBoundary>
          <GymAuthProvider>
            <IGCAuthProvider>
              <ThemeProvider>
                <LanguageProvider>
                  {children}
                </LanguageProvider>
              </ThemeProvider>
            </IGCAuthProvider>
          </GymAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}