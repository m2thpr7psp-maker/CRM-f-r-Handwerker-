import { randomBytes } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { istEntsperrt } from "@/lib/pin";
import { heuteDatumString } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Liefert eine konsistente Kopie der SQLite-Datenbank als Download.
 * VACUUM INTO erzeugt einen sauberen Schnappschuss, auch wenn die App läuft.
 */
export async function GET() {
  if (!(await istEntsperrt())) {
    return new Response("Gesperrt – bitte zuerst mit PIN entsperren.", { status: 401 });
  }

  const zielPfad = join(tmpdir(), `handwerkos-backup-${randomBytes(8).toString("hex")}.db`);

  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO '${zielPfad.replace(/'/g, "''")}'`);
    const daten = await readFile(zielPfad);

    return new Response(new Uint8Array(daten), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="handwerkos-backup-${heuteDatumString()}.db"`,
      },
    });
  } catch (fehler) {
    console.error("Backup fehlgeschlagen:", fehler);
    return new Response("Backup fehlgeschlagen. Bitte erneut versuchen.", { status: 500 });
  } finally {
    await unlink(zielPfad).catch(() => {});
  }
}
