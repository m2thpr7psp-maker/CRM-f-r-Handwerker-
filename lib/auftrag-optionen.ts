import { prisma } from "@/lib/prisma";
import type { AuftragOption, MitarbeiterOption } from "@/components/termin-form";

export function kundeAdresse(kunde: {
  strasse: string | null;
  plz: string | null;
  ort: string | null;
}): string {
  return [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

/** Aufträge und Mitarbeiter als Auswahloptionen für das Terminformular */
export async function ladeTerminOptionen(): Promise<{
  auftraege: AuftragOption[];
  mitarbeiter: MitarbeiterOption[];
}> {
  const [auftraege, mitarbeiter] = await Promise.all([
    prisma.auftrag.findMany({
      where: { status: { notIn: ["ABGERECHNET"] } },
      orderBy: { erstelltAm: "desc" },
      include: { kunde: true },
    }),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    auftraege: auftraege.map((a) => ({
      id: a.id,
      titel: a.titel,
      kundeName: a.kunde.name,
      kundeAdresse: kundeAdresse(a.kunde),
    })),
    mitarbeiter: mitarbeiter.map((m) => ({ id: m.id, name: m.name, farbe: m.farbe })),
  };
}
