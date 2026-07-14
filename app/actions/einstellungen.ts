"use server";

import { prisma } from "@/lib/prisma";
import { parseDezimal } from "@/lib/geld";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_LOGO_BYTES = 1_000_000; // ~1 MB reicht für ein Briefkopf-Logo

export async function einstellungenSpeichern(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const stundensatzEingabe = parseDezimal(text("stundensatz"));
  const daten: {
    firmenname: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon: string;
    email: string;
    steuernummer: string;
    ustIdNr: string;
    iban: string;
    kleinunternehmer: boolean;
    stundensatz?: number;
    logo?: string | null;
  } = {
    firmenname: text("firmenname"),
    strasse: text("strasse"),
    plz: text("plz"),
    ort: text("ort"),
    telefon: text("telefon"),
    email: text("email"),
    steuernummer: text("steuernummer"),
    ustIdNr: text("ustIdNr"),
    iban: text("iban"),
    kleinunternehmer: formData.get("kleinunternehmer") === "1",
  };
  if (!Number.isNaN(stundensatzEingabe) && stundensatzEingabe >= 0) {
    daten.stundensatz = stundensatzEingabe;
  }

  if (formData.get("logoEntfernen") === "1") {
    daten.logo = null;
  } else {
    const logo = formData.get("logo");
    if (logo instanceof File && logo.size > 0 && logo.size <= MAX_LOGO_BYTES) {
      if (logo.type === "image/png" || logo.type === "image/jpeg") {
        const buffer = Buffer.from(await logo.arrayBuffer());
        daten.logo = `data:${logo.type};base64,${buffer.toString("base64")}`;
      }
    }
  }

  await prisma.einstellungen.upsert({
    where: { id: 1 },
    update: daten,
    create: { id: 1, ...daten, logo: daten.logo ?? undefined },
  });

  revalidatePath("/einstellungen");
  redirect("/einstellungen?gespeichert=1");
}
