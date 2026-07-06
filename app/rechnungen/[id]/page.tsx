import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rechnungLoeschen } from "@/app/actions/rechnungen";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { SeitenKopf, Karte } from "@/components/ui";
import { RechnungEditor } from "@/components/rechnung-editor";
import { LoeschenButton } from "@/components/loeschen-button";
import { toDatumString } from "@/lib/format";
import { kundeAdresse } from "@/lib/auftrag-optionen";

export const dynamic = "force-dynamic";

export default async function RechnungSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rechnung, einstellungen] = await Promise.all([
    prisma.rechnung.findUnique({
      where: { id },
      include: {
        auftrag: { include: { kunde: true } },
        positionen: { orderBy: { sortierung: "asc" } },
      },
    }),
    ladeEinstellungen(),
  ]);
  if (!rechnung) notFound();

  const kunde = rechnung.auftrag.kunde;

  return (
    <div className="mx-auto max-w-2xl">
      <SeitenKopf titel={rechnung.nummer} zurueckHref="/rechnungen" />

      <Karte className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Rechnungsentwurf für</p>
            <p className="text-[15px] font-semibold">
              {kunde.name}
              {kunde.firma ? ` (${kunde.firma})` : ""}
            </p>
            <p className="text-sm text-slate-500">{kundeAdresse(kunde) || "Keine Adresse hinterlegt"}</p>
          </div>
          <Link
            href={`/auftraege/${rechnung.auftrag.id}`}
            className="text-[15px] font-semibold text-orange-600 hover:underline"
          >
            Zum Auftrag
          </Link>
        </div>
        {(!einstellungen.firmenname || (!einstellungen.steuernummer && !einstellungen.ustIdNr)) && (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Für ein vollständiges Rechnungs-PDF fehlen noch Betriebsangaben
            (Firmenname, Steuernummer oder USt-IdNr.).{" "}
            <Link href="/einstellungen" className="font-semibold underline">
              Jetzt in den Einstellungen ergänzen
            </Link>
          </p>
        )}
      </Karte>

      <RechnungEditor
        rechnungId={rechnung.id}
        kopf={{
          datum: toDatumString(rechnung.datum),
          leistungVon: rechnung.leistungVon ? toDatumString(rechnung.leistungVon) : "",
          leistungBis: rechnung.leistungBis ? toDatumString(rechnung.leistungBis) : "",
          mwstSatz: rechnung.mwstSatz,
          zahlungszielTage: rechnung.zahlungszielTage,
        }}
        positionen={rechnung.positionen.map((p) => ({
          bezeichnung: p.bezeichnung,
          menge: p.menge,
          einheit: p.einheit,
          einzelpreis: p.einzelpreis,
        }))}
        stundensatz={einstellungen.stundensatz}
      />

      <div className="mt-5">
        <LoeschenButton
          aktion={rechnungLoeschen.bind(null, rechnung.id)}
          frage="Diesen Rechnungsentwurf endgültig löschen?"
          label="Entwurf löschen"
        />
      </div>
    </div>
  );
}
