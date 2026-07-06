import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SeitenKopf, PrimaerLink, LeererZustand, Karte } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KundenSeite() {
  const kunden = await prisma.kunde.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { auftraege: true } } },
  });

  return (
    <>
      <SeitenKopf
        titel="Kunden"
        aktion={<PrimaerLink href="/kunden/neu">Neuer Kunde</PrimaerLink>}
      />
      {kunden.length === 0 ? (
        <LeererZustand
          hinweis="Noch keine Kunden – legen Sie Ihren ersten Kunden an."
          aktionLabel="Ersten Kunden anlegen"
          aktionHref="/kunden/neu"
        />
      ) : (
        <Karte>
          <ul className="divide-y divide-slate-100">
            {kunden.map((kunde) => (
              <li key={kunde.id}>
                <Link
                  href={`/kunden/${kunde.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 md:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {kunde.name}
                      {kunde.firma && (
                        <span className="font-normal text-slate-500"> · {kunde.firma}</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {[kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", ") || "Keine Adresse hinterlegt"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {kunde._count.auftraege}{" "}
                    {kunde._count.auftraege === 1 ? "Auftrag" : "Aufträge"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Karte>
      )}
    </>
  );
}
