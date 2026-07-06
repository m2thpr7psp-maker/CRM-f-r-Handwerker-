import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auftragLoeschen } from "@/app/actions/auftraege";
import { rechnungAusAuftragErzeugen } from "@/app/actions/rechnungen";
import { formatWaehrung } from "@/lib/format";
import { berechneSummen } from "@/lib/geld";
import { SeitenKopf, Karte } from "@/components/ui";
import { StatusWechsler } from "@/components/status-wechsler";
import { LoeschenButton } from "@/components/loeschen-button";
import { formatDatum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuftragDetailSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      kunde: true,
      termine: {
        orderBy: [{ datum: "asc" }, { startZeit: "asc" }],
        include: { mitarbeiter: true },
      },
      rechnungen: {
        orderBy: { nummer: "desc" },
        include: { positionen: true },
      },
    },
  });
  if (!auftrag) notFound();

  return (
    <>
      <SeitenKopf
        titel={auftrag.titel}
        zurueckHref="/auftraege"
        aktion={
          <Link
            href={`/auftraege/${auftrag.id}/bearbeiten`}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bearbeiten
          </Link>
        }
      />

      <div className="flex flex-col gap-5">
        <Karte className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">Status:</span>
            <StatusWechsler auftragId={auftrag.id} status={auftrag.status} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Kunde</dt>
              <dd>
                <Link
                  href={`/kunden/${auftrag.kunde.id}`}
                  className="text-[15px] font-medium text-orange-600 hover:underline"
                >
                  {auftrag.kunde.name}
                  {auftrag.kunde.firma ? ` (${auftrag.kunde.firma})` : ""}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Erstellt am</dt>
              <dd className="text-[15px]">{formatDatum(auftrag.erstelltAm)}</dd>
            </div>
            {auftrag.beschreibung && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-slate-500">Beschreibung</dt>
                <dd className="whitespace-pre-line text-[15px]">{auftrag.beschreibung}</dd>
              </div>
            )}
          </dl>
        </Karte>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Termine</h2>
            <Link
              href={`/termine/neu?auftrag=${auftrag.id}`}
              className="text-[15px] font-semibold text-orange-600 hover:underline"
            >
              + Termin planen
            </Link>
          </div>
          {auftrag.termine.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-[15px] text-slate-500">
              Noch keine Termine für diesen Auftrag.
            </p>
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {auftrag.termine.map((termin) => (
                  <li key={termin.id}>
                    <Link
                      href={`/termine/${termin.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: termin.mitarbeiter?.farbe ?? "#94a3b8" }}
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold">
                          {formatDatum(termin.datum)} · {termin.startZeit}–{termin.endZeit} Uhr
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {termin.mitarbeiter?.name ?? "Kein Mitarbeiter"}
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

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Rechnungsentwürfe</h2>
            <form action={rechnungAusAuftragErzeugen.bind(null, auftrag.id)}>
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Rechnungsentwurf erzeugen
              </button>
            </form>
          </div>
          {auftrag.rechnungen.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-[15px] text-slate-500">
              Noch kein Rechnungsentwurf – mit einem Klick oben erzeugen.
            </p>
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {auftrag.rechnungen.map((rechnung) => {
                  const { brutto } = berechneSummen(rechnung.positionen, rechnung.mwstSatz);
                  return (
                    <li key={rechnung.id}>
                      <Link
                        href={`/rechnungen/${rechnung.id}`}
                        className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                      >
                        <div>
                          <p className="text-[15px] font-semibold">{rechnung.nummer}</p>
                          <p className="text-sm text-slate-500">
                            vom {formatDatum(rechnung.datum)}
                          </p>
                        </div>
                        <span className="text-[15px] font-bold">{formatWaehrung(brutto)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Karte>
          )}
        </section>

        <div className="mt-2">
          <LoeschenButton
            aktion={auftragLoeschen.bind(null, auftrag.id)}
            frage="Auftrag mit allen Terminen endgültig löschen?"
            label="Auftrag löschen"
          />
        </div>
      </div>
    </>
  );
}
