import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, PrimaerLink } from "@/components/ui";
import {
  addTage,
  formatDatum,
  heuteDatumString,
  montagDerWoche,
  parseDatum,
  toDatumString,
  formatWochentagKurz,
} from "@/lib/format";
import { kundeAdresse } from "@/lib/auftrag-optionen";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

type TerminMitDetails = Awaited<ReturnType<typeof ladeTermine>>[number];

function ladeTermine(von: Date, bis: Date) {
  return prisma.termin.findMany({
    where: { datum: { gte: von, lte: bis } },
    orderBy: [{ startZeit: "asc" }, { endZeit: "asc" }],
    include: { auftrag: { include: { kunde: true } }, mitarbeiter: true },
  });
}

export default async function KalenderSeite({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const heuteString = heuteDatumString();
  const { tag } = await searchParams;
  const tagString = /^\d{4}-\d{2}-\d{2}$/.test(tag ?? "") ? tag! : heuteString;

  const montag = montagDerWoche(parseDatum(tagString));
  const samstag = addTage(montag, 5);
  const tage = Array.from({ length: 6 }, (_, i) => addTage(montag, i));

  const [termine, mitarbeiter] = await Promise.all([
    ladeTermine(montag, samstag),
    prisma.mitarbeiter.findMany({ orderBy: { name: "asc" } }),
  ]);

  const termineProTag = new Map<string, TerminMitDetails[]>();
  for (const t of termine) {
    const key = toDatumString(t.datum);
    if (!termineProTag.has(key)) termineProTag.set(key, []);
    termineProTag.get(key)!.push(t);
  }

  const vorherigeWoche = toDatumString(addTage(montag, -7));
  const naechsteWoche = toDatumString(addTage(montag, 7));

  return (
    <>
      <SeitenKopf
        titel="Kalender"
        aktion={<PrimaerLink href={`/termine/neu?datum=${tagString}`}>Neuer Termin</PrimaerLink>}
      />

      {/* Wochennavigation */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href={`/kalender?tag=${vorherigeWoche}`}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50"
          aria-label="Vorherige Woche"
        >
          ‹
        </Link>
        <div className="text-center">
          <p className="text-[15px] font-bold">
            {formatDatum(montag)} – {formatDatum(samstag)}
          </p>
          <Link
            href={`/kalender?tag=${heuteString}`}
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            Zu heute springen
          </Link>
        </div>
        <Link
          href={`/kalender?tag=${naechsteWoche}`}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-600 hover:bg-slate-50"
          aria-label="Nächste Woche"
        >
          ›
        </Link>
      </div>

      {/* Mobil: Tagesauswahl + Tagesansicht */}
      <div className="md:hidden">
        <div className="mb-4 grid grid-cols-6 gap-1.5">
          {tage.map((t) => {
            const ts = toDatumString(t);
            const aktiv = ts === tagString;
            const istHeute = ts === heuteString;
            return (
              <Link
                key={ts}
                href={`/kalender?tag=${ts}`}
                className={`flex min-h-16 flex-col items-center justify-center rounded-xl border text-center ${
                  aktiv
                    ? "border-orange-500 bg-orange-500 text-white"
                    : istHeute
                      ? "border-orange-300 bg-orange-50 text-slate-800"
                      : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase">
                  {formatWochentagKurz(t)}
                </span>
                <span className="text-lg font-bold leading-tight">{t.getUTCDate()}</span>
              </Link>
            );
          })}
        </div>
        <TagesListe
          termine={termineProTag.get(tagString) ?? []}
          datumString={tagString}
        />
      </div>

      {/* Desktop: Wochenraster Mo–Sa */}
      <div className="hidden gap-3 md:grid md:grid-cols-6">
        {tage.map((t) => {
          const ts = toDatumString(t);
          const istHeute = ts === heuteString;
          const tagesTermine = termineProTag.get(ts) ?? [];
          return (
            <div
              key={ts}
              className={`flex min-h-64 flex-col rounded-2xl border ${
                istHeute ? "border-orange-300 bg-orange-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <p
                className={`border-b px-3 py-2 text-center text-sm font-bold ${
                  istHeute ? "border-orange-200 text-orange-700" : "border-slate-100 text-slate-600"
                }`}
              >
                {formatWochentagKurz(t)} {formatDatum(t).slice(0, 6)}
              </p>
              <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                {tagesTermine.map((termin) => (
                  <TerminKarte key={termin.id} termin={termin} kompakt />
                ))}
                <Link
                  href={`/termine/neu?datum=${ts}`}
                  className="mt-auto flex min-h-10 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-orange-500"
                  aria-label={`Termin am ${formatDatum(t)} anlegen`}
                >
                  <IconPlus className="h-5 w-5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mitarbeiter-Legende */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {mitarbeiter.map((m) => (
          <span key={m.id} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.farbe }} />
            {m.name}
          </span>
        ))}
        <Link
          href="/mitarbeiter"
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          Mitarbeiter verwalten
        </Link>
      </div>
    </>
  );
}

function TagesListe({
  termine,
  datumString,
}: {
  termine: TerminMitDetails[];
  datumString: string;
}) {
  if (termine.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <p className="text-[15px] text-slate-500">An diesem Tag sind keine Termine geplant.</p>
        <Link
          href={`/termine/neu?datum=${datumString}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[15px] font-semibold text-white hover:bg-orange-600"
        >
          <IconPlus className="h-5 w-5" /> Termin anlegen
        </Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {termine.map((termin) => (
        <li key={termin.id}>
          <TerminKarte termin={termin} />
        </li>
      ))}
    </ul>
  );
}

function TerminKarte({
  termin,
  kompakt = false,
}: {
  termin: TerminMitDetails;
  kompakt?: boolean;
}) {
  const farbe = termin.mitarbeiter?.farbe ?? "#94a3b8";
  const ort = termin.ort ?? kundeAdresse(termin.auftrag.kunde);

  return (
    <Link
      href={`/termine/${termin.id}`}
      className={`block rounded-xl border border-slate-200 bg-white shadow-sm hover:border-orange-300 ${
        kompakt ? "p-2" : "p-3.5"
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: farbe }}
    >
      <p className={`font-bold ${kompakt ? "text-xs" : "text-[15px]"}`}>
        {termin.startZeit}–{termin.endZeit}
      </p>
      <p className={`font-semibold text-slate-800 ${kompakt ? "text-xs leading-snug" : "text-[15px]"}`}>
        {termin.auftrag.titel}
      </p>
      <p className={`text-slate-500 ${kompakt ? "text-[11px] leading-snug" : "text-sm"}`}>
        {termin.auftrag.kunde.name}
        {!kompakt && termin.mitarbeiter ? ` · ${termin.mitarbeiter.name}` : ""}
      </p>
      {!kompakt && ort && <p className="mt-0.5 text-sm text-slate-400">{ort}</p>}
    </Link>
  );
}
