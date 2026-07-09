"use client";

import { useActionState } from "react";
import { entsperren, PinStatus } from "@/app/actions/pin";

export function Sperrbildschirm() {
  const [status, formAction, laufend] = useActionState<PinStatus, FormData>(entsperren, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-bold text-white">
          H
        </span>
        <div className="text-center">
          <h1 className="text-xl font-bold">HandwerkOS ist gesperrt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Geben Sie Ihren PIN ein, um weiterzuarbeiten.
          </p>
        </div>
        <input
          type="password"
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          required
          maxLength={8}
          placeholder="PIN"
          className="min-h-14 w-full rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-[0.5em] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        {status.fehler && (
          <p className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800">
            {status.fehler}
          </p>
        )}
        <button
          type="submit"
          disabled={laufend}
          className="min-h-14 w-full rounded-xl bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {laufend ? "Wird geprüft …" : "Entsperren"}
        </button>
      </form>
    </div>
  );
}
