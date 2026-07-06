import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { kundeAktualisieren } from "@/app/actions/kunden";
import { KundeForm } from "@/components/kunde-form";
import { SeitenKopf } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KundeBearbeitenSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kunde = await prisma.kunde.findUnique({ where: { id } });
  if (!kunde) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Kunde bearbeiten" zurueckHref={`/kunden/${id}`} />
      <KundeForm
        aktion={kundeAktualisieren.bind(null, id)}
        kunde={kunde}
        abbrechenHref={`/kunden/${id}`}
      />
    </div>
  );
}
