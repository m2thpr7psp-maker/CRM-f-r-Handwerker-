import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, PrimaerLink, LeererZustand, Karte } from "@/components/ui";
import { StatusWechsler } from "@/components/status-wechsler";
import { AUFTRAG_STATUS, AuftragStatus, statusLabel } from "@/lib/status";
import { formatDatum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuftraegeSeite({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = AUFTRAG_STATUS.includes(status as AuftragStatus)
    ? (status as AuftragStatus)
    : undefined;

  const auftraege = await prisma.auftrag.findMany({
    where: filter ? { status: filter } : undefined,
    include: { kunde: true },
    orderBy: { erstelltAm: "desc" },
  });

  return (
    <>
      <SeitenKopf
        titel="Aufträge"
        aktion={<PrimaerLink href="/auftraege/neu">Neuer Auftrag</PrimaerLink>}
      />

      {/* Statusfilter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip href="/auftraege" aktiv={!filter} label="Alle" />
        {AUFTRAG_STATUS.map((s) => (
          <FilterChip
            key={s}
            href={`/auftraege?status=${s}`}
            aktiv={filter === s}
            label={statusLabel(s)}
          />
        ))}
      </div>

      {auftraege.length === 0 ? (
        <LeererZustand
          hinweis={
            filter
              ? `Keine Aufträge mit Status „${statusLabel(filter)}“.`
              : "Noch keine Aufträge – legen Sie Ihren ersten Auftrag an."
          }
          aktionLabel={filter ? undefined : "Ersten Auftrag anlegen"}
          aktionHref={filter ? undefined : "/auftraege/neu"}
        />
      ) : (
        <Karte>
          <ul className="divide-y divide-slate-100">
            {auftraege.map((auftrag) => (
              <li
                key={auftrag.id}
                className="flex flex-col gap-y-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-3 md:px-5"
              >
                <Link href={`/auftraege/${auftrag.id}`} className="min-w-0 py-1 sm:flex-1">
                  <p className="truncate text-[15px] font-semibold hover:text-orange-600">
                    {auftrag.titel}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {auftrag.kunde.name} · {formatDatum(auftrag.erstelltAm)}
                  </p>
                </Link>
                <div className="self-start sm:self-auto">
                  <StatusWechsler auftragId={auftrag.id} status={auftrag.status} />
                </div>
              </li>
            ))}
          </ul>
        </Karte>
      )}
    </>
  );
}

function FilterChip({
  href,
  aktiv,
  label,
}: {
  href: string;
  aktiv: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
        aktiv
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}
