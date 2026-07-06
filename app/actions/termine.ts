"use server";

import { prisma } from "@/lib/prisma";
import { parseDatum, toDatumString, zeitZuMinuten } from "@/lib/format";
import { findeKonflikt } from "@/lib/termine";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type TerminFormStatus = {
  fehler?: string;
  konflikt?: string;
  /** Zuletzt eingegebene Werte, damit das Formular nach einer Warnung gefüllt bleibt */
  werte?: {
    auftragId: string;
    datum: string;
    startZeit: string;
    endZeit: string;
    mitarbeiterId: string;
    ort: string;
    notiz: string;
  };
  versuch: number;
};

function alleKalenderPfadeNeuLaden() {
  revalidatePath("/kalender");
  revalidatePath("/");
}

export async function terminSpeichern(
  vorher: TerminFormStatus,
  formData: FormData
): Promise<TerminFormStatus> {
  const id = String(formData.get("id") ?? "");
  const trotzdem = formData.get("trotzdem") === "1";
  const werte = {
    auftragId: String(formData.get("auftragId") ?? ""),
    datum: String(formData.get("datum") ?? ""),
    startZeit: String(formData.get("startZeit") ?? ""),
    endZeit: String(formData.get("endZeit") ?? ""),
    mitarbeiterId: String(formData.get("mitarbeiterId") ?? ""),
    ort: String(formData.get("ort") ?? "").trim(),
    notiz: String(formData.get("notiz") ?? "").trim(),
  };
  const versuch = vorher.versuch + 1;

  if (!werte.auftragId || !werte.datum || !werte.startZeit || !werte.endZeit) {
    return { fehler: "Bitte Auftrag, Datum und Uhrzeiten angeben.", werte, versuch };
  }
  if (zeitZuMinuten(werte.endZeit) <= zeitZuMinuten(werte.startZeit)) {
    return { fehler: "Die Endzeit muss nach der Startzeit liegen.", werte, versuch };
  }

  const datum = parseDatum(werte.datum);
  const mitarbeiterId = werte.mitarbeiterId || null;

  if (!trotzdem) {
    const konflikt = await findeKonflikt({
      mitarbeiterId,
      datum,
      startZeit: werte.startZeit,
      endZeit: werte.endZeit,
      ausgenommenTerminId: id || undefined,
    });
    if (konflikt) return { konflikt, werte, versuch };
  }

  const daten = {
    auftragId: werte.auftragId,
    datum,
    startZeit: werte.startZeit,
    endZeit: werte.endZeit,
    mitarbeiterId,
    ort: werte.ort === "" ? null : werte.ort,
    notiz: werte.notiz === "" ? null : werte.notiz,
  };

  if (id) {
    await prisma.termin.update({ where: { id }, data: daten });
  } else {
    await prisma.termin.create({ data: daten });
  }

  alleKalenderPfadeNeuLaden();
  redirect(`/kalender?tag=${werte.datum}`);
}

export type VerschiebenStatus = {
  konflikt?: string;
  fehler?: string;
  werte?: { datum: string; startZeit: string; endZeit: string };
  versuch: number;
};

export async function terminVerschieben(
  terminId: string,
  vorher: VerschiebenStatus,
  formData: FormData
): Promise<VerschiebenStatus> {
  const trotzdem = formData.get("trotzdem") === "1";
  const werte = {
    datum: String(formData.get("datum") ?? ""),
    startZeit: String(formData.get("startZeit") ?? ""),
    endZeit: String(formData.get("endZeit") ?? ""),
  };
  const versuch = vorher.versuch + 1;

  if (!werte.datum || !werte.startZeit || !werte.endZeit) {
    return { fehler: "Bitte Datum und Uhrzeiten angeben.", werte, versuch };
  }
  if (zeitZuMinuten(werte.endZeit) <= zeitZuMinuten(werte.startZeit)) {
    return { fehler: "Die Endzeit muss nach der Startzeit liegen.", werte, versuch };
  }

  const termin = await prisma.termin.findUnique({ where: { id: terminId } });
  if (!termin) return { fehler: "Termin nicht gefunden.", versuch };

  const datum = parseDatum(werte.datum);

  if (!trotzdem) {
    const konflikt = await findeKonflikt({
      mitarbeiterId: termin.mitarbeiterId,
      datum,
      startZeit: werte.startZeit,
      endZeit: werte.endZeit,
      ausgenommenTerminId: terminId,
    });
    if (konflikt) return { konflikt, werte, versuch };
  }

  await prisma.termin.update({
    where: { id: terminId },
    data: { datum, startZeit: werte.startZeit, endZeit: werte.endZeit },
  });

  alleKalenderPfadeNeuLaden();
  redirect(`/kalender?tag=${werte.datum}`);
}

export async function terminLoeschen(id: string) {
  const termin = await prisma.termin.findUnique({ where: { id } });
  await prisma.termin.delete({ where: { id } });
  alleKalenderPfadeNeuLaden();
  redirect(termin ? `/kalender?tag=${toDatumString(termin.datum)}` : "/kalender");
}
