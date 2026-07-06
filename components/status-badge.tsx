import { statusFarbe, statusLabel } from "@/lib/status";

export function StatusBadge({
  status,
  klein = false,
}: {
  status: string;
  klein?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${statusFarbe(status)} ${
        klein ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
