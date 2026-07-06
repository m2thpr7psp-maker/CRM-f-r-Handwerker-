import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, LeererZustand, Karte } from "@/components/ui";
import { formatDatum, formatWaehrung } from "@/lib/format";
import { berechneSummen } from "@/lib/geld";

export const dynamic = "force-dynamic";

export default async function RechnungenSeite() {
  const rechnungen = await prisma.rechnung.findMany({
    orderBy: { nummer: "desc" },
    include: {
      auftrag: { include: { kunde: true } },
      positionen: true,
    },
  });

  return (
    <>
      <SeitenKopf titel="Rechnungsentwürfe" />
      <p className="-mt-3 mb-5 text-sm text-slate-500">
        Entwürfe zur Prüfung – die endgültige Rechnung stellen Sie mit Ihrer
        Buchhaltungssoftware.
      </p>
      {rechnungen.length === 0 ? (
        <LeererZustand
          hinweis="Noch keine Rechnungsentwürfe – öffnen Sie einen Auftrag und tippen Sie dort auf „Rechnungsentwurf erzeugen“."
          aktionLabel="Zu den Aufträgen"
          aktionHref="/auftraege"
        />
      ) : (
        <Karte>
          <ul className="divide-y divide-slate-100">
            {rechnungen.map((rechnung) => {
              const { brutto } = berechneSummen(rechnung.positionen, rechnung.mwstSatz);
              return (
                <li key={rechnung.id}>
                  <Link
                    href={`/rechnungen/${rechnung.id}`}
                    className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">
                        {rechnung.nummer} · {rechnung.auftrag.kunde.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {rechnung.auftrag.titel} · {formatDatum(rechnung.datum)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[15px] font-bold">
                      {formatWaehrung(brutto)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Karte>
      )}
    </>
  );
}
