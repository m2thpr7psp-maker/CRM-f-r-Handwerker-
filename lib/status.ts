export const AUFTRAG_STATUS = [
  "ANFRAGE",
  "GEPLANT",
  "IN_ARBEIT",
  "ABGESCHLOSSEN",
  "ABGERECHNET",
] as const;

export type AuftragStatus = (typeof AUFTRAG_STATUS)[number];

export const STATUS_LABEL: Record<AuftragStatus, string> = {
  ANFRAGE: "Anfrage",
  GEPLANT: "Geplant",
  IN_ARBEIT: "In Arbeit",
  ABGESCHLOSSEN: "Abgeschlossen",
  ABGERECHNET: "Abgerechnet",
};

export const STATUS_FARBE: Record<AuftragStatus, string> = {
  ANFRAGE: "bg-amber-100 text-amber-800 border-amber-200",
  GEPLANT: "bg-blue-100 text-blue-800 border-blue-200",
  IN_ARBEIT: "bg-violet-100 text-violet-800 border-violet-200",
  ABGESCHLOSSEN: "bg-green-100 text-green-800 border-green-200",
  ABGERECHNET: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Aufträge, die noch nicht fertig sind */
export const OFFENE_STATUS: AuftragStatus[] = ["ANFRAGE", "GEPLANT", "IN_ARBEIT"];

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as AuftragStatus] ?? status;
}

export function statusFarbe(status: string): string {
  return STATUS_FARBE[status as AuftragStatus] ?? "bg-slate-100 text-slate-600 border-slate-200";
}
