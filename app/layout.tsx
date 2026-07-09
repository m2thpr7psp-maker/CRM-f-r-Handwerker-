import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Sperrbildschirm } from "@/components/sperrbildschirm";
import { istEntsperrt } from "@/lib/pin";

export const metadata: Metadata = {
  title: "HandwerkOS",
  description: "Termine, Aufträge, Kunden und Rechnungen für Handwerksbetriebe",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Alle Seiten werden pro Anfrage gerendert, damit die PIN-Sperre
// (Cookie-Prüfung) auf jeder Route greift
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const entsperrt = await istEntsperrt();

  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
        {entsperrt ? (
          <div className="flex min-h-screen">
            <Navigation />
            <main className="min-w-0 flex-1 pb-24 md:pb-8">
              <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <Sperrbildschirm />
        )}
      </body>
    </html>
  );
}
