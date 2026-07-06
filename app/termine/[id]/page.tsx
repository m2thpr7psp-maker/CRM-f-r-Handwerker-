import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { terminLoeschen } from "@/app/actions/termine";
import { SeitenKopf, Karte } from "@/components/ui";
import { VerschiebenDialog } from "@/components/verschieben-dialog";
import { LoeschenButton } from "@/components/loeschen-button";
import { formatDatumLang, toDatumString } from "@/lib/format";
import { kundeAdresse } from "@/lib/auftrag-optionen";

export const dynamic = "force-dynamic";

export default async function TerminDetailSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const termin = await prisma.termin.findUnique({
    where: { id },
    include: { auftrag: { include: { kunde: true } }, mitarbeiter: true },
  });
  if (!termin) notFound();

  const ort = termin.ort ?? kundeAdresse(termin.auftrag.kunde);

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf
        titel="Termin"
        zurueckHref={`/kalender?tag=${toDatumString(termin.datum)}`}
        aktion={
          <Link
            href={`/termine/${termin.id}/bearbeiten`}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bearbeiten
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <Karte className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: termin.mitarbeiter?.farbe ?? "#94a3b8" }}
            />
            <p className="text-lg font-bold">
              {formatDatumLang(termin.datum)}, {termin.startZeit}–{termin.endZeit} Uhr
            </p>
          </div>
          <dl className="grid gap-4">
            <div>
              <dt className="text-sm font-semibold text-slate-500">Auftrag</dt>
              <dd>
                <Link
                  href={`/auftraege/${termin.auftrag.id}`}
                  className="text-[15px] font-medium text-orange-600 hover:underline"
                >
                  {termin.auftrag.titel}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Kunde</dt>
              <dd>
                <Link
                  href={`/kunden/${termin.auftrag.kunde.id}`}
                  className="text-[15px] font-medium text-orange-600 hover:underline"
                >
                  {termin.auftrag.kunde.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Mitarbeiter</dt>
              <dd className="text-[15px]">{termin.mitarbeiter?.name ?? "Nicht zugewiesen"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-500">Ort</dt>
              <dd className="text-[15px]">{ort || "–"}</dd>
            </div>
            {termin.notiz && (
              <div>
                <dt className="text-sm font-semibold text-slate-500">Notiz</dt>
                <dd className="whitespace-pre-line text-[15px]">{termin.notiz}</dd>
              </div>
            )}
          </dl>
        </Karte>

        <VerschiebenDialog
          terminId={termin.id}
          vorgabe={{
            datum: toDatumString(termin.datum),
            startZeit: termin.startZeit,
            endZeit: termin.endZeit,
          }}
        />

        <LoeschenButton
          aktion={terminLoeschen.bind(null, termin.id)}
          frage="Diesen Termin endgültig löschen?"
          label="Termin löschen"
        />
      </div>
    </div>
  );
}
