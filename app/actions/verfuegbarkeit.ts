"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const zeitRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function fensterDaten(formData: FormData) {
  const wochentag = Number(formData.get("wochentag"));
  const von = String(formData.get("von") ?? "");
  const bis = String(formData.get("bis") ?? "");
  if (
    !Number.isInteger(wochentag) ||
    wochentag < 0 ||
    wochentag > 6 ||
    !zeitRegex.test(von) ||
    !zeitRegex.test(bis) ||
    bis <= von
  ) {
    return null;
  }
  return { wochentag, von, bis };
}

export async function fensterAnlegen(formData: FormData) {
  const daten = fensterDaten(formData);
  if (!daten) return;
  await prisma.verfuegbarkeitsFenster.create({ data: daten });
  revalidatePath("/einstellungen/verfuegbarkeit");
}

export async function fensterUmschalten(id: string) {
  const fenster = await prisma.verfuegbarkeitsFenster.findUnique({ where: { id } });
  if (!fenster) return;
  await prisma.verfuegbarkeitsFenster.update({
    where: { id },
    data: { aktiv: !fenster.aktiv },
  });
  revalidatePath("/einstellungen/verfuegbarkeit");
}

export async function fensterLoeschen(id: string) {
  await prisma.verfuegbarkeitsFenster.delete({ where: { id } });
  revalidatePath("/einstellungen/verfuegbarkeit");
}
