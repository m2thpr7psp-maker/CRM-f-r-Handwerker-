import { SeitenKopf } from "@/components/ui";

export default function KalenderSeite() {
  return (
    <>
      <SeitenKopf titel="Kalender" />
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-[15px] text-slate-500">
        Die Terminplanung folgt in Phase 2.
      </p>
    </>
  );
}
