import { SeitenKopf, LeererZustand } from "@/components/ui";
import { TerminForm } from "@/components/termin-form";
import { ladeTerminOptionen } from "@/lib/auftrag-optionen";
import { heuteDatumString } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NeuerTerminSeite({
  searchParams,
}: {
  searchParams: Promise<{ auftrag?: string; datum?: string }>;
}) {
  const { auftrag, datum } = await searchParams;
  const { auftraege, mitarbeiter } = await ladeTerminOptionen();

  const vorausgewaehlt = auftraege.find((a) => a.id === auftrag);

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Neuer Termin" zurueckHref="/kalender" />
      {auftraege.length === 0 ? (
        <LeererZustand
          hinweis="Für einen Termin brauchen Sie zuerst einen offenen Auftrag."
          aktionLabel="Auftrag anlegen"
          aktionHref="/auftraege/neu"
        />
      ) : (
        <TerminForm
          auftraege={auftraege}
          mitarbeiter={mitarbeiter}
          vorgabe={{
            auftragId: vorausgewaehlt?.id ?? "",
            datum: datum ?? heuteDatumString(),
            startZeit: "08:00",
            endZeit: "12:00",
            mitarbeiterId: "",
            ort: vorausgewaehlt?.kundeAdresse ?? "",
            notiz: "",
          }}
          abbrechenHref="/kalender"
        />
      )}
    </div>
  );
}
