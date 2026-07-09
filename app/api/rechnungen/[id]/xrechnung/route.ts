import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erzeugeXRechnung, pruefeXRechnungsPflichtangaben } from "@/lib/xrechnung";
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
  const [rechnung, einstellungen] = await Promise.all([
    prisma.rechnung.findUnique({
      where: { id },
      include: {
        auftrag: { include: { kunde: true } },
        positionen: { orderBy: { sortierung: "asc" } },
      },
    }),
    ladeEinstellungen(),
  ]);

  if (!rechnung) {
    return new Response("Rechnungsentwurf nicht gefunden", { status: 404 });
  }

  const fehlend = pruefeXRechnungsPflichtangaben(rechnung, einstellungen);
  if (fehlend.length > 0) {
    const text =
      "Für die XRechnung fehlen noch Pflichtangaben:\n\n- " +
      fehlend.join("\n- ") +
      "\n\nBitte ergänzen Sie die Angaben in den Einstellungen bzw. beim Kunden und versuchen Sie es erneut.";
    return new Response(text, {
      status: 422,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const xmlInhalt = erzeugeXRechnung(rechnung, einstellungen);

  return new Response(xmlInhalt, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${rechnung.nummer}-xrechnung.xml"`,
    },
  });
}
