import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, Karte } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { IconSuche } from "@/components/icons";
import { feldKlasse } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SucheSeite({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const suchbegriff = (q ?? "").trim();

  const [kunden, auftraege] = suchbegriff
    ? await Promise.all([
        prisma.kunde.findMany({
          where: {
            OR: [
              { name: { contains: suchbegriff } },
              { firma: { contains: suchbegriff } },
              { ort: { contains: suchbegriff } },
              { strasse: { contains: suchbegriff } },
              { telefon: { contains: suchbegriff } },
              { email: { contains: suchbegriff } },
            ],
          },
          orderBy: { name: "asc" },
          take: 25,
        }),
        prisma.auftrag.findMany({
          where: {
            OR: [
              { titel: { contains: suchbegriff } },
              { beschreibung: { contains: suchbegriff } },
              { kunde: { name: { contains: suchbegriff } } },
            ],
          },
          include: { kunde: true },
          orderBy: { erstelltAm: "desc" },
          take: 25,
        }),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-2xl">
      <SeitenKopf titel="Suche" />

      <form action="/suche" method="get" className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <IconSuche className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={suchbegriff}
            placeholder="Kunde oder Auftrag suchen …"
            autoFocus
            className={`${feldKlasse} pl-11`}
          />
        </div>
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
        >
          Suchen
        </button>
      </form>

      {!suchbegriff ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-[15px] text-slate-500">
          Geben Sie einen Namen, Ort oder Auftragstitel ein.
        </p>
      ) : kunden.length === 0 && auftraege.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-[15px] text-slate-500">
          Nichts gefunden zu „{suchbegriff}“. Prüfen Sie die Schreibweise.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {kunden.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Kunden <span className="text-slate-400">({kunden.length})</span>
              </h2>
              <Karte>
                <ul className="divide-y divide-slate-100">
                  {kunden.map((kunde) => (
                    <li key={kunde.id}>
                      <Link
                        href={`/kunden/${kunde.id}`}
                        className="flex min-h-14 flex-col justify-center px-4 py-3 hover:bg-slate-50 md:px-5"
                      >
                        <p className="text-[15px] font-semibold">
                          {kunde.name}
                          {kunde.firma && (
                            <span className="font-normal text-slate-500"> · {kunde.firma}</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {[kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Karte>
            </section>
          )}

          {auftraege.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Aufträge <span className="text-slate-400">({auftraege.length})</span>
              </h2>
              <Karte>
                <ul className="divide-y divide-slate-100">
                  {auftraege.map((auftrag) => (
                    <li key={auftrag.id}>
                      <Link
                        href={`/auftraege/${auftrag.id}`}
                        className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
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
            </section>
          )}
        </div>
      )}
    </div>
  );
}
