import Link from "next/link";
import { IconPfeilLinks, IconPlus } from "@/components/icons";

export function SeitenKopf({
  titel,
  zurueckHref,
  aktion,
}: {
  titel: string;
  zurueckHref?: string;
  aktion?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {zurueckHref && (
          <Link
            href={zurueckHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Zurück"
          >
            <IconPfeilLinks className="h-6 w-6" />
          </Link>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight">{titel}</h1>
      </div>
      {aktion}
    </div>
  );
}

export function PrimaerLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-orange-600 active:bg-orange-700"
    >
      <IconPlus className="h-5 w-5" />
      {children}
    </Link>
  );
}

export function LeererZustand({
  hinweis,
  aktionLabel,
  aktionHref,
}: {
  hinweis: string;
  aktionLabel?: string;
  aktionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-[15px] text-slate-500">{hinweis}</p>
      {aktionLabel && aktionHref && (
        <PrimaerLink href={aktionHref}>{aktionLabel}</PrimaerLink>
      )}
    </div>
  );
}

export function Karte({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export const feldKlasse =
  "w-full min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-[15px] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200";

export const labelKlasse = "mb-1.5 block text-sm font-semibold text-slate-700";

export function Feld({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className={labelKlasse}>{label}</span>
      {children}
    </div>
  );
}

export function SpeichernButton({ label = "Speichern" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="min-h-12 w-full rounded-xl bg-orange-500 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-orange-600 active:bg-orange-700 sm:w-auto"
    >
      {label}
    </button>
  );
}

export function AbbrechenLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
    >
      Abbrechen
    </Link>
  );
}
