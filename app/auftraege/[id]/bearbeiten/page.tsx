import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auftragAktualisieren } from "@/app/actions/auftraege";
import { AuftragForm } from "@/components/auftrag-form";
import { SeitenKopf } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AuftragBearbeitenSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [auftrag, kunden] = await Promise.all([
    prisma.auftrag.findUnique({ where: { id } }),
    prisma.kunde.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!auftrag) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Auftrag bearbeiten" zurueckHref={`/auftraege/${id}`} />
      <AuftragForm
        aktion={auftragAktualisieren.bind(null, id)}
        auftrag={auftrag}
        kunden={kunden}
        abbrechenHref={`/auftraege/${id}`}
      />
    </div>
  );
}
