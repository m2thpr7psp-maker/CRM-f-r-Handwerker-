import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { kundeLoeschen } from "@/app/actions/kunden";
import { SeitenKopf, Karte, LeererZustand } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { LoeschenButton } from "@/components/loeschen-button";
import { formatDatum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function KundeDetailSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kunde = await prisma.kunde.findUnique({
    where: { id },
    include: { auftraege: { orderBy: { erstelltAm: "desc" } } },
  });
  if (!kunde) notFound();

  const adresse = [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <SeitenKopf
        titel={kunde.name}
        zurueckHref="/kunden"
        aktion={
          <Link
            href={`/kunden/${kunde.id}/bearbeiten`}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bearbeiten
          </Link>
        }
      />

      <div className="flex flex-col gap-5">
        <Karte className="p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {kunde.firma && (
              <div>
                <dt className="text-sm font-semibold text-slate-500">Firma</dt>
                <dd className="text-[15px]">{kunde.firma}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-semibold text-slate-500">Adresse</dt>
              <dd className="text-[15px]">{adresse || "–"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Telefon</dt>
              <dd className="text-[15px]">
                {kunde.telefon ? (
                  <a href={`tel:${kunde.telefon}`} className="font-medium text-orange-600 underline">
                    {kunde.telefon}
                  </a>
                ) : (
                  "–"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">E-Mail</dt>
              <dd className="text-[15px]">
                {kunde.email ? (
                  <a href={`mailto:${kunde.email}`} className="font-medium text-orange-600 underline">
                    {kunde.email}
                  </a>
                ) : (
                  "–"
                )}
              </dd>
            </div>
            {kunde.notizen && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-slate-500">Notizen</dt>
                <dd className="whitespace-pre-line text-[15px]">{kunde.notizen}</dd>
              </div>
            )}
          </dl>
        </Karte>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Aufträge</h2>
            <Link
              href={`/auftraege/neu?kunde=${kunde.id}`}
              className="text-[15px] font-semibold text-orange-600 hover:underline"
            >
              + Neuer Auftrag
            </Link>
          </div>
          {kunde.auftraege.length === 0 ? (
            <LeererZustand
              hinweis="Noch keine Aufträge für diesen Kunden."
              aktionLabel="Auftrag anlegen"
              aktionHref={`/auftraege/neu?kunde=${kunde.id}`}
            />
          ) : (
            <Karte>
              <ul className="divide-y divide-slate-100">
                {kunde.auftraege.map((auftrag) => (
                  <li key={auftrag.id}>
                    <Link
                      href={`/auftraege/${auftrag.id}`}
                      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{auftrag.titel}</p>
                        <p className="text-sm text-slate-500">
                          Erstellt am {formatDatum(auftrag.erstelltAm)}
                        </p>
                      </div>
                      <StatusBadge status={auftrag.status} klein />
                    </Link>
                  </li>
                ))}
              </ul>
            </Karte>
          )}
        </section>

        <div className="mt-2">
          <LoeschenButton
            aktion={kundeLoeschen.bind(null, kunde.id)}
            frage="Kunden mit allen Aufträgen und Terminen endgültig löschen?"
            label="Kunden löschen"
          />
        </div>
      </div>
    </>
  );
}
