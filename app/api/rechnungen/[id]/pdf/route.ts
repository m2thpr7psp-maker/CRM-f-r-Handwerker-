import { prisma } from "@/lib/prisma";
import { ladeEinstellungen } from "@/lib/einstellungen";
import { erzeugeRechnungsPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _anfrage: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const pdf = await erzeugeRechnungsPdf(rechnung, einstellungen);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${rechnung.nummer}-Entwurf.pdf"`,
    },
  });
}
