import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auftragAnlegen } from "@/app/actions/auftraege";
import { AuftragForm } from "@/components/auftrag-form";
import { SeitenKopf, LeererZustand } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NeuerAuftragSeite({
  searchParams,
}: {
  searchParams: Promise<{ kunde?: string }>;
}) {
  const { kunde } = await searchParams;
  const kunden = await prisma.kunde.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Neuer Auftrag" zurueckHref="/auftraege" />
      {kunden.length === 0 ? (
        <LeererZustand
          hinweis="Für einen Auftrag brauchen Sie zuerst einen Kunden."
          aktionLabel="Ersten Kunden anlegen"
          aktionHref="/kunden/neu"
        />
      ) : (
        <>
          <AuftragForm
            aktion={auftragAnlegen}
            kunden={kunden}
            vorausgewaehlterKundeId={kunde}
            abbrechenHref="/auftraege"
          />
          <p className="mt-4 text-center text-sm text-slate-500">
            Kunde fehlt noch?{" "}
            <Link href="/kunden/neu" className="font-semibold text-orange-600 hover:underline">
              Neuen Kunden anlegen
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
