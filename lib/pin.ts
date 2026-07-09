import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ladeEinstellungen } from "@/lib/einstellungen";
import type { Einstellungen } from "@prisma/client";

export const PIN_COOKIE = "hwos_entsperrt";
/** Entsperrung gilt für einen Arbeitstag */
export const PIN_COOKIE_DAUER_SEKUNDEN = 60 * 60 * 12;

export function istGueltigePin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export function neuerPinSalz(): string {
  return randomBytes(16).toString("hex");
}

export function hashePin(pin: string, salz: string): string {
  return scryptSync(pin, salz, 32).toString("hex");
}

export function pinStimmt(pin: string, einstellungen: Einstellungen): boolean {
  if (!einstellungen.pinHash || !einstellungen.pinSalz) return false;
  const eingabe = Buffer.from(hashePin(pin, einstellungen.pinSalz), "hex");
  const gespeichert = Buffer.from(einstellungen.pinHash, "hex");
  return eingabe.length === gespeichert.length && timingSafeEqual(eingabe, gespeichert);
}

/**
 * Der Cookie-Wert ist ein vom PIN-Hash abgeleitetes Token. Wird der PIN
 * geändert oder entfernt, sind alte Cookies automatisch ungültig.
 */
export function entsperrToken(pinHash: string): string {
  return createHmac("sha256", pinHash).update("hwos-entsperrt-v1").digest("hex");
}

/** true, wenn kein PIN gesetzt ist oder der Browser ein gültiges Entsperr-Cookie hat */
export async function istEntsperrt(): Promise<boolean> {
  const einstellungen = await ladeEinstellungen();
  if (!einstellungen.pinHash) return true;
  const cookieWert = (await cookies()).get(PIN_COOKIE)?.value;
  return cookieWert === entsperrToken(einstellungen.pinHash);
}
