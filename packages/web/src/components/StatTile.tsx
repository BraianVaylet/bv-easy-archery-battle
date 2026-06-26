interface StatTileProps {
  label: string;
  value: string | number;
}

/** Métrica compacta: valor grande + etiqueta. */
export function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <p className="font-semibold text-fg text-xl tabular-nums">{value}</p>
      <p className="text-muted text-xs">{label}</p>
    </div>
  );
}
