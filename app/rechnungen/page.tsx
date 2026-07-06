import { SeitenKopf } from "@/components/ui";

export default function RechnungenSeite() {
  return (
    <>
      <SeitenKopf titel="Rechnungen" />
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-[15px] text-slate-500">
        Die Rechnungsvorbereitung folgt in Phase 3.
      </p>
    </>
  );
}
