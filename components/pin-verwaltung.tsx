"use client";

import { useActionState } from "react";
import { pinEntfernen, pinSetzen, PinStatus, sperren } from "@/app/actions/pin";
import { feldKlasse, labelKlasse } from "@/components/ui";

function Meldung({ status }: { status: PinStatus }) {
  if (status.fehler) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
        {status.fehler}
      </p>
    );
  }
  if (status.erfolg) {
    return (
      <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        {status.erfolg}
      </p>
    );
  }
  return null;
}

export function PinVerwaltung({ pinAktiv }: { pinAktiv: boolean }) {
  const [setzenStatus, setzenAction, setzenLaeuft] = useActionState<PinStatus, FormData>(
    pinSetzen,
    {}
  );
  const [entfernenStatus, entfernenAction, entfernenLaeuft] = useActionState<
    PinStatus,
    FormData
  >(pinEntfernen, {});

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Die PIN-Sperre schützt die App vor neugierigen Blicken, wenn das Gerät offen
        herumliegt – z. B. im Büro oder auf der Baustelle. Sie ersetzt keine
        Benutzerkonten und keine Festplatten-Verschlüsselung.
      </p>

      <form action={setzenAction} className="flex flex-col gap-4">
        {pinAktiv && (
          <div>
            <span className={labelKlasse}>Aktueller PIN</span>
            <input
              type="password"
              name="aktuellerPin"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              className={feldKlasse}
            />
          </div>
        )}
        <div>
          <span className={labelKlasse}>{pinAktiv ? "Neuer PIN" : "PIN"} (4–8 Ziffern)</span>
          <input
            type="password"
            name="neuerPin"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={8}
            placeholder="z. B. 2468"
            className={feldKlasse}
          />
        </div>
        <Meldung status={setzenStatus} />
        <button
          type="submit"
          disabled={setzenLaeuft}
          className="min-h-12 self-start rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pinAktiv ? "PIN ändern" : "PIN-Sperre aktivieren"}
        </button>
      </form>

      {pinAktiv && (
        <>
          <hr className="border-slate-200" />
          <form action={sperren}>
            <button
              type="submit"
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Jetzt sperren (Feierabend)
            </button>
          </form>
          <form action={entfernenAction} className="flex flex-col gap-4">
            <div>
              <span className={labelKlasse}>PIN-Sperre entfernen (aktuellen PIN eingeben)</span>
              <input
                type="password"
                name="aktuellerPin"
                inputMode="numeric"
                autoComplete="off"
                required
                maxLength={8}
                className={feldKlasse}
              />
            </div>
            <Meldung status={entfernenStatus} />
            <button
              type="submit"
              disabled={entfernenLaeuft}
              className="min-h-12 self-start rounded-xl border border-red-200 bg-white px-5 text-[15px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              PIN-Sperre entfernen
            </button>
          </form>
        </>
      )}
    </div>
  );
}
