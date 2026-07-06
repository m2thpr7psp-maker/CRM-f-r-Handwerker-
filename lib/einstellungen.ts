import { prisma } from "@/lib/prisma";
import type { Einstellungen } from "@prisma/client";

/** Lädt die Betriebseinstellungen (legt den Datensatz bei Bedarf an) */
export async function ladeEinstellungen(): Promise<Einstellungen> {
  return prisma.einstellungen.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}
