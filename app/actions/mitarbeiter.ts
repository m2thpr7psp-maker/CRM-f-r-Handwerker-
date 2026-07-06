"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function mitarbeiterAnlegen(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const farbe = String(formData.get("farbe") ?? "#2563eb");
  if (!name) return;
  await prisma.mitarbeiter.create({ data: { name, farbe } });
  revalidatePath("/mitarbeiter");
}

export async function mitarbeiterAktualisieren(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const farbe = String(formData.get("farbe") ?? "#2563eb");
  if (!name) return;
  await prisma.mitarbeiter.update({ where: { id }, data: { name, farbe } });
  revalidatePath("/mitarbeiter");
}

export async function mitarbeiterLoeschen(id: string) {
  await prisma.mitarbeiter.delete({ where: { id } });
  revalidatePath("/mitarbeiter");
}
