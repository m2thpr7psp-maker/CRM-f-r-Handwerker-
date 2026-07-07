import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Karte } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { formatDatumLang, heuteDatum } from "@/lib/format";
import { OFFENE_STATUS } from "@/lib/status";
import { IconKalender, IconPersonen, IconPlus, IconSuche, IconWerkzeug, IconZahnrad } from "@/components/icons";
import { feldKlasse } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardSeite() {
  const heute = heuteDatum();

  const [termineHeute, offeneAuftraege, letzteKunden, anzahlOffen] = await Promise.all([
    prisma.termin.findMany({
      where: { datum: heute },
      orderBy: { startZeit: "asc" },
      include: { auftrag: { include: { kunde: true } }, mitarbeiter: true },
    }),
    prisma.auftrag.findMany({
      where: { status: { in: [...OFFENE_STATUS] } },
      orderBy: { erstelltAm: "desc" },
      take: 5,
      include: { kunde: true },
    }),
    prisma.kunde.findMany({ orderBy: { erstelltAm: "desc" }, take: 5 }),
    prisma.auftrag.count({ where: { status: { in: [...OFFENE_STATUS] } } }),
  ]);

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guten Tag!</h1>
          <p className="text-[15px] text-slate-500">{formatDatumLang(heute)}</p>
        </div>
        <Link
          href="/einstellungen"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
          aria-label="Einstellungen"
        >
          <IconZahnrad className="h-6 w-6" />
        </Link>
      </div>

      {/* Globale Suche */}
      <form action="/suche" method="get" className="mb-5">
        <div className="relative">
          <IconSuche className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            placeholder="Kunde oder Auftrag suchen …"
            className={`${feldKlasse} pl-11`}
          />
        </div>
      </form>

      {/* Schnellaktionen */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <SchnellAktion href="/termine/neu" label="Neuer Termin" icon={<IconKalender className="h-6 w-6" />} />
        <SchnellAktion href="/auftraege/neu" label="Neuer Auftrag" icon={<IconWerkzeug className="h-6 w-6" />} />
        <SchnellAktion href="/kunden/neu" label="Neuer Kunde" icon={<IconPersonen className="h-6 w-6" />} />
      </div>

      <div className="flex flex-col gap-6">
        {/* Heutige Termine */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Heutige Termine</h2>
            <Link href="/kalender" className="text-[15px] font-semibold text-orange-600 hover:underline">
              Zum Kalender
            </Link>
          </div>
          {termineHeute.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-[15px] text-slate-500">
              Heute stehen keine Termine an.
            </p>
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {termineHeute.map((termin) => (
                  <li key={termin.id}>
                    <Link
                      href={`/auftraege/${termin.auftragId}`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                    >
                      <span
                        className="h-10 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: termin.mitarbeiter?.farbe ?? "#94a3b8" }}
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold">
                          {termin.startZeit}–{termin.endZeit} Uhr · {termin.auftrag.titel}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {termin.auftrag.kunde.name}
                          {termin.mitarbeiter ? ` · ${termin.mitarbeiter.name}` : ""}
                          {termin.ort ? ` · ${termin.ort}` : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Karte>
          )}
        </section>

        {/* Offene Aufträge */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Offene Aufträge
              {anzahlOffen > 0 && (
                <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-sm font-semibold text-orange-700">
                  {anzahlOffen}
                </span>
              )}
            </h2>
            <Link href="/auftraege" className="text-[15px] font-semibold text-orange-600 hover:underline">
              Alle Aufträge
            </Link>
          </div>
          {offeneAuftraege.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center">
              <p className="text-[15px] text-slate-500">Keine offenen Aufträge.</p>
              <Link
                href="/auftraege/neu"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <IconPlus className="h-4 w-4" /> Auftrag anlegen
              </Link>
            </div>
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {offeneAuftraege.map((auftrag) => (
                  <li key={auftrag.id}>
                    <Link
                      href={`/auftraege/${auftrag.id}`}
                      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{auftrag.titel}</p>
                        <p className="truncate text-sm text-slate-500">{auftrag.kunde.name}</p>
                      </div>
                      <StatusBadge status={auftrag.status} klein />
                    </Link>
                  </li>
                ))}
              </ul>
            </Karte>
          )}
        </section>

        {/* Letzte Kunden */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Letzte Kunden</h2>
            <Link href="/kunden" className="text-[15px] font-semibold text-orange-600 hover:underline">
              Alle Kunden
            </Link>
          </div>
          {letzteKunden.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center">
              <p className="text-[15px] text-slate-500">
                Noch keine Kunden – legen Sie Ihren ersten Kunden an.
              </p>
              <Link
                href="/kunden/neu"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <IconPlus className="h-4 w-4" /> Ersten Kunden anlegen
              </Link>
            </div>
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {letzteKunden.map((kunde) => (
                  <li key={kunde.id}>
                    <Link
                      href={`/kunden/${kunde.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                    >
                      <p className="truncate text-[15px] font-semibold">
                        {kunde.name}
                        {kunde.firma && (
                          <span className="font-normal text-slate-500"> · {kunde.firma}</span>
                        )}
                      </p>
                      <span className="text-sm text-slate-400">{kunde.ort ?? ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Karte>
          )}
        </section>
      </div>
    </>
  );
}

function SchnellAktion({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 text-center shadow-sm hover:border-orange-300 hover:bg-orange-50"
    >
      <span className="text-orange-500">{icon}</span>
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
    </Link>
  );
}
