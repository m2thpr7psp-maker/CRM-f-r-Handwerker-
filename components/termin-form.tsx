"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { terminSpeichern, TerminFormStatus } from "@/app/actions/termine";
import { feldKlasse, labelKlasse } from "@/components/ui";
import { IconWarnung } from "@/components/icons";

export type AuftragOption = {
  id: string;
  titel: string;
  kundeName: string;
  kundeAdresse: string;
};

export type MitarbeiterOption = {
  id: string;
  name: string;
  farbe: string;
};

export function TerminForm({
  auftraege,
  mitarbeiter,
  vorgabe,
  terminId,
  abbrechenHref,
}: {
  auftraege: AuftragOption[];
  mitarbeiter: MitarbeiterOption[];
  vorgabe: {
    auftragId: string;
    datum: string;
    startZeit: string;
    endZeit: string;
    mitarbeiterId: string;
    ort: string;
    notiz: string;
  };
  terminId?: string;
  abbrechenHref: string;
}) {
  const [status, formAction, laufend] = useActionState<TerminFormStatus, FormData>(
    terminSpeichern,
    { versuch: 0 }
  );
  const ortRef = useRef<HTMLInputElement>(null);
  const ortManuellGeaendert = useRef(false);
  const router = useRouter();

  const werte = status.werte ?? vorgabe;

  return (
    <form
      key={status.versuch}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
    >
      {terminId && <input type="hidden" name="id" value={terminId} />}

      <div>
        <span className={labelKlasse}>Auftrag *</span>
        <select
          name="auftragId"
          required
          defaultValue={werte.auftragId}
          className={feldKlasse}
          onChange={(e) => {
            // Ort automatisch mit der Kundenadresse vorbelegen,
            // solange der Nutzer den Ort nicht selbst geändert hat
            if (ortManuellGeaendert.current || !ortRef.current) return;
            const auftrag = auftraege.find((a) => a.id === e.target.value);
            if (auftrag) ortRef.current.value = auftrag.kundeAdresse;
          }}
        >
          <option value="" disabled>
            Auftrag auswählen …
          </option>
          {auftraege.map((a) => (
            <option key={a.id} value={a.id}>
              {a.titel} – {a.kundeName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelKlasse}>Datum *</span>
        <input
          type="date"
          name="datum"
          required
          defaultValue={werte.datum}
          className={feldKlasse}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className={labelKlasse}>Von *</span>
          <input
            type="time"
            name="startZeit"
            required
            step={900}
            defaultValue={werte.startZeit}
            className={feldKlasse}
          />
        </div>
        <div>
          <span className={labelKlasse}>Bis *</span>
          <input
            type="time"
            name="endZeit"
            required
            step={900}
            defaultValue={werte.endZeit}
            className={feldKlasse}
          />
        </div>
      </div>

      <div>
        <span className={labelKlasse}>Mitarbeiter</span>
        <select name="mitarbeiterId" defaultValue={werte.mitarbeiterId} className={feldKlasse}>
          <option value="">Kein Mitarbeiter</option>
          {mitarbeiter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelKlasse}>Ort</span>
        <input
          ref={ortRef}
          name="ort"
          defaultValue={werte.ort}
          onChange={() => (ortManuellGeaendert.current = true)}
          placeholder="Standard: Adresse des Kunden"
          className={feldKlasse}
        />
      </div>

      <div>
        <span className={labelKlasse}>Notiz</span>
        <textarea
          name="notiz"
          rows={2}
          defaultValue={werte.notiz}
          placeholder="z. B. Material mitbringen, klingeln bei Nachbarin …"
          className={`${feldKlasse} py-3`}
        />
      </div>

      {status.fehler && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {status.fehler}
        </p>
      )}

      {status.konflikt && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="flex items-start gap-2 text-sm font-medium text-amber-900">
            <IconWarnung className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              <strong>Doppelbuchung:</strong> {status.konflikt}
            </span>
          </p>
          <button
            type="submit"
            name="trotzdem"
            value="1"
            className="min-h-11 self-start rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Trotzdem speichern
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(abbrechenHref)}
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={laufend}
          className="min-h-12 rounded-xl bg-orange-500 px-6 text-[15px] font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {laufend ? "Wird gespeichert …" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
