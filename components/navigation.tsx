"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHaus,
  IconKalender,
  IconPersonen,
  IconRechnung,
  IconWerkzeug,
  IconZahnrad,
} from "@/components/icons";

const eintraege = [
  { href: "/", label: "Start", icon: IconHaus },
  { href: "/kalender", label: "Kalender", icon: IconKalender },
  { href: "/auftraege", label: "Aufträge", icon: IconWerkzeug },
  { href: "/kunden", label: "Kunden", icon: IconPersonen },
  { href: "/rechnungen", label: "Rechnungen", icon: IconRechnung },
  { href: "/einstellungen", label: "Einstellungen", icon: IconZahnrad },
];

// Auf dem Smartphone passen 5 Einträge in die untere Leiste;
// Einstellungen sind dort über das Dashboard erreichbar.
const mobilEintraege = eintraege.slice(0, 5);

function istAktiv(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: Seitenleiste */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <Link href="/" className="flex items-center gap-2 px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            H
          </span>
          <span className="text-lg font-bold tracking-tight">HandwerkOS</span>
        </Link>
        <nav className="flex flex-col gap-1 px-3">
          {eintraege.map((e) => {
            const aktiv = istAktiv(pathname, e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  aktiv
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <e.icon className="h-5 w-5" />
                {e.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobil: untere Leiste */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {mobilEintraege.map((e) => {
            const aktiv = istAktiv(pathname, e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  aktiv ? "text-orange-600" : "text-slate-500"
                }`}
              >
                <e.icon className="h-6 w-6" />
                {e.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
