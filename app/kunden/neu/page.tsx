import { kundeAnlegen } from "@/app/actions/kunden";
import { KundeForm } from "@/components/kunde-form";
import { SeitenKopf } from "@/components/ui";

export default function NeuerKundeSeite() {
  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Neuer Kunde" zurueckHref="/kunden" />
      <KundeForm aktion={kundeAnlegen} abbrechenHref="/kunden" />
    </div>
  );
}
