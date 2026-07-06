import { prisma } from "@/lib/prisma";
import { SeitenKopf } from "@/components/ui";
import { MitarbeiterListe } from "@/components/mitarbeiter-liste";

export const dynamic = "force-dynamic";

export default async function MitarbeiterSeite() {
  const mitarbeiter = await prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl">
      <SeitenKopf titel="Mitarbeiter" />
      <MitarbeiterListe mitarbeiter={mitarbeiter} />
    </div>
  );
}
