"use server";

import { prisma } from "@/lib/prisma";
import { AUFTRAG_STATUS, AuftragStatus } from "@/lib/status";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function auftragDaten(formData: FormData) {
  const beschreibung = String(formData.get("beschreibung") ?? "").trim();
  return {
    titel: String(formData.get("titel") ?? "").trim(),
    kundeId: String(formData.get("kundeId") ?? ""),
    beschreibung: beschreibung === "" ? null : beschreibung,
  };
}

export async function auftragAnlegen(formData: FormData) {
  const daten = auftragDaten(formData);
  if (!daten.titel || !daten.kundeId) return;
  const auftrag = await prisma.auftrag.create({ data: daten });
  revalidatePath("/auftraege");
  redirect(`/auftraege/${auftrag.id}`);
}

export async function auftragAktualisieren(id: string, formData: FormData) {
  const daten = auftragDaten(formData);
  if (!daten.titel || !daten.kundeId) return;
  await prisma.auftrag.update({ where: { id }, data: daten });
  revalidatePath("/auftraege");
  redirect(`/auftraege/${id}`);
}

export async function auftragStatusSetzen(id: string, status: string) {
  if (!AUFTRAG_STATUS.includes(status as AuftragStatus)) return;
  await prisma.auftrag.update({ where: { id }, data: { status } });
  revalidatePath("/auftraege");
  revalidatePath(`/auftraege/${id}`);
  revalidatePath("/");
}

export async function auftragLoeschen(id: string) {
  await prisma.auftrag.delete({ where: { id } });
  revalidatePath("/auftraege");
  redirect("/auftraege");
}
