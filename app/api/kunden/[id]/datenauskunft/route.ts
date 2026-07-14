import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erzeugeDatenauskunftPdf } from "@/lib/datenauskunft";
import { istEntsperrt } from "@/lib/pin";

export const dynamic = "force-dynamic";

export async function GET(
  _anfrage: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await istEntsperrt())) {
    return new Response("Gesperrt – bitte zuerst mit PIN entsperren.", { status: 401 });
  }

  const { id } = await params;
  const [kunde, einstellungen] = await Promise.all([
    prisma.kunde.findUnique({
      where: { id },
      include: {
        auftraege: {
          orderBy: { erstelltAm: "desc" },
          include: {
            termine: {
              orderBy: [{ datum: "asc" }, { startZeit: "asc" }],
              include: { mitarbeiter: { select: { name: true } } },
            },
            rechnungen: {
              orderBy: { nummer: "asc" },
              include: { positionen: true },
            },
          },
        },
      },
    }),
    ladeEinstellungen(),
  ]);

  if (!kunde) {
    return new Response("Kunde nicht gefunden", { status: 404 });
  }

  const pdf = await erzeugeDatenauskunftPdf(kunde, einstellungen);
  const dateiname = `Datenauskunft-${kunde.name.replace(/[^\wäöüÄÖÜß-]+/g, "_")}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${dateiname}"`,
    },
  });
}
