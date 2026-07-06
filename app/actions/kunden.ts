"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function kundeDaten(formData: FormData) {
  const text = (name: string) => {
    const wert = String(formData.get(name) ?? "").trim();
    return wert === "" ? null : wert;
  };
  return {
    name: String(formData.get("name") ?? "").trim(),
    firma: text("firma"),
    strasse: text("strasse"),
    plz: text("plz"),
    ort: text("ort"),
    telefon: text("telefon"),
    email: text("email"),
    notizen: text("notizen"),
  };
}

export async function kundeAnlegen(formData: FormData) {
  const daten = kundeDaten(formData);
  if (!daten.name) return;
  const kunde = await prisma.kunde.create({ data: daten });
  revalidatePath("/kunden");
  redirect(`/kunden/${kunde.id}`);
}

export async function kundeAktualisieren(id: string, formData: FormData) {
  const daten = kundeDaten(formData);
  if (!daten.name) return;
  await prisma.kunde.update({ where: { id }, data: daten });
  revalidatePath("/kunden");
  redirect(`/kunden/${id}`);
}

export async function kundeLoeschen(id: string) {
  await prisma.kunde.delete({ where: { id } });
  revalidatePath("/kunden");
  redirect("/kunden");
}
