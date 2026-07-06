import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "HandwerkOS",
  description: "Termine, Aufträge, Kunden und Rechnungen für Handwerksbetriebe",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen">
          <Navigation />
          <main className="min-w-0 flex-1 pb-24 md:pb-8">
            <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
