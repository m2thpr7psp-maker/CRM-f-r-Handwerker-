import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeitenKopf } from "@/components/ui";
import { TerminForm } from "@/components/termin-form";
import { ladeTerminOptionen } from "@/lib/auftrag-optionen";
import { toDatumString } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TerminBearbeitenSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [termin, optionen] = await Promise.all([
    prisma.termin.findUnique({ where: { id } }),
    ladeTerminOptionen(),
  ]);
  if (!termin) notFound();

  // Falls der Auftrag des Termins bereits abgerechnet ist, trotzdem anzeigen
  let { auftraege } = optionen;
  if (!auftraege.some((a) => a.id === termin.auftragId)) {
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: termin.auftragId },
      include: { kunde: true },
    });
    if (auftrag) {
      auftraege = [
        {
          id: auftrag.id,
          titel: auftrag.titel,
          kundeName: auftrag.kunde.name,
          kundeAdresse: "",
        },
        ...auftraege,
      ];
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Termin bearbeiten" zurueckHref={`/termine/${id}`} />
      <TerminForm
        auftraege={auftraege}
        mitarbeiter={optionen.mitarbeiter}
        terminId={termin.id}
        vorgabe={{
          auftragId: termin.auftragId,
          datum: toDatumString(termin.datum),
          startZeit: termin.startZeit,
          endZeit: termin.endZeit,
          mitarbeiterId: termin.mitarbeiterId ?? "",
          ort: termin.ort ?? "",
          notiz: termin.notiz ?? "",
        }}
        abbrechenHref={`/termine/${id}`}
      />
    </div>
  );
}
