import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, LeererZustand } from "@/components/ui";
import { AnfrageKarte, AnfrageDaten } from "@/components/anfrage-karte";

export const dynamic = "force-dynamic";

const DRINGLICHKEIT_REIHENFOLGE: Record<string, number> = {
  NOTFALL: 0,
  DRINGEND: 1,
  NORMAL: 2,
};

export default async function AnfragenSeite({
  searchParams,
}: {
  searchParams: Promise<{ ansicht?: string }>;
}) {
  const { ansicht } = await searchParams;
  const alle = ansicht === "alle";

  const anfragen = await prisma.terminAnfrage.findMany({
    where: alle ? undefined : { status: { in: ["NEU", "VORGESCHLAGEN"] } },
    include: { slots: true },
    orderBy: { createdAt: "asc" },
  });

  // Dringlichkeit zuerst, dann die ältesten oben
  const sortiert = [...anfragen].sort((a, b) => {
    const d =
      (DRINGLICHKEIT_REIHENFOLGE[a.dringlichkeit] ?? 9) -
      (DRINGLICHKEIT_REIHENFOLGE[b.dringlichkeit] ?? 9);
    if (d !== 0 && !alle) return d;
    if (alle) return b.createdAt.getTime() - a.createdAt.getTime();
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const daten: AnfrageDaten[] = sortiert.map((a) => ({
    id: a.id,
    kundeName: a.kundeName,
    telefon: a.telefon,
    adresse: a.adresse,
    anliegen: a.anliegen,
    dringlichkeit: a.dringlichkeit,
    wunschZeitraum: a.wunschZeitraum,
    quelle: a.quelle,
    status: a.status,
    createdAtIso: a.createdAt.toISOString(),
    slots: a.slots.map((s) => ({
      id: s.id,
      datumIso: s.datum.toISOString(),
      uhrzeitVon: s.uhrzeitVon,
      uhrzeitBis: s.uhrzeitBis,
      status: s.status,
    })),
  }));

  return (
    <>
      <SeitenKopf titel="Anfragen" />

      <div className="mb-4 flex gap-2">
        <FilterChip href="/anfragen" aktiv={!alle} label="Offen" />
        <FilterChip href="/anfragen?ansicht=alle" aktiv={alle} label="Alle" />
        <Link
          href="/einstellungen/verfuegbarkeit"
          className="ml-auto inline-flex min-h-11 items-center text-sm font-semibold text-orange-600 hover:underline"
        >
          Verfügbarkeit
        </Link>
      </div>

      {daten.length === 0 ? (
        <LeererZustand
          hinweis={
            alle
              ? "Noch keine Anfragen eingegangen."
              : "Keine offenen Anfragen – alles erledigt!"
          }
          aktionLabel={alle ? undefined : "Alle Anfragen ansehen"}
          aktionHref={alle ? undefined : "/anfragen?ansicht=alle"}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {daten.map((anfrage) => (
            <AnfrageKarte key={anfrage.id} anfrage={anfrage} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  href,
  aktiv,
  label,
}: {
  href: string;
  aktiv: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${
        aktiv
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
