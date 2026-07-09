"use server";

import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import {
  entsperrToken,
  hashePin,
  istGueltigePin,
  neuerPinSalz,
  PIN_COOKIE,
  PIN_COOKIE_DAUER_SEKUNDEN,
  pinStimmt,
} from "@/lib/pin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PinStatus = { fehler?: string; erfolg?: string };

async function setzeEntsperrCookie(pinHash: string) {
  (await cookies()).set(PIN_COOKIE, entsperrToken(pinHash), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: PIN_COOKIE_DAUER_SEKUNDEN,
    path: "/",
  });
}

/** Sperrbildschirm: PIN prüfen und entsperren */
export async function entsperren(_vorher: PinStatus, formData: FormData): Promise<PinStatus> {
  const pin = String(formData.get("pin") ?? "").trim();
  const einstellungen = await ladeEinstellungen();

  if (!einstellungen.pinHash) redirect("/");
  if (!pinStimmt(pin, einstellungen)) {
    return { fehler: "Falscher PIN. Bitte erneut versuchen." };
  }

  await setzeEntsperrCookie(einstellungen.pinHash);
  redirect("/");
}

/** Einstellungen: PIN setzen oder ändern */
export async function pinSetzen(_vorher: PinStatus, formData: FormData): Promise<PinStatus> {
  const aktuellerPin = String(formData.get("aktuellerPin") ?? "").trim();
  const neuerPin = String(formData.get("neuerPin") ?? "").trim();
  const einstellungen = await ladeEinstellungen();

  if (einstellungen.pinHash && !pinStimmt(aktuellerPin, einstellungen)) {
    return { fehler: "Der aktuelle PIN ist falsch." };
  }
  if (!istGueltigePin(neuerPin)) {
    return { fehler: "Der PIN muss aus 4 bis 8 Ziffern bestehen." };
  }

  const salz = neuerPinSalz();
  const hash = hashePin(neuerPin, salz);
  await prisma.einstellungen.update({
    where: { id: 1 },
    data: { pinHash: hash, pinSalz: salz },
  });
  await setzeEntsperrCookie(hash);

  revalidatePath("/einstellungen");
  return { erfolg: "PIN-Sperre ist aktiv. Die Sperre greift auf allen Geräten beim nächsten Aufruf." };
}

/** Einstellungen: PIN-Sperre entfernen */
export async function pinEntfernen(_vorher: PinStatus, formData: FormData): Promise<PinStatus> {
  const aktuellerPin = String(formData.get("aktuellerPin") ?? "").trim();
  const einstellungen = await ladeEinstellungen();

  if (!einstellungen.pinHash) return { erfolg: "Es ist kein PIN gesetzt." };
  if (!pinStimmt(aktuellerPin, einstellungen)) {
    return { fehler: "Der aktuelle PIN ist falsch." };
  }

  await prisma.einstellungen.update({
    where: { id: 1 },
    data: { pinHash: null, pinSalz: null },
  });
  (await cookies()).delete(PIN_COOKIE);

  revalidatePath("/einstellungen");
  return { erfolg: "PIN-Sperre wurde entfernt." };
}

/** Manuell sperren (z. B. Feierabend) */
export async function sperren() {
  (await cookies()).delete(PIN_COOKIE);
  redirect("/");
}
