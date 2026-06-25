import { AVATAR_COLORS, type TournamentParticipant } from '@bv/shared';
import { cn } from '../../lib/cn';

interface EndRowProps {
  participant: TournamentParticipant;
  /** Flechas a mostrar (sorted desc) o null si pendiente. */
  arrows: string[] | null;
  total: number | null;
  arrowsPerEnd: number;
  active: boolean;
  onSelect: () => void;
}

function colorHex(key: string): string {
  return AVATAR_COLORS.find((c) => c.key === key)?.hex ?? '#7B8497';
}

/** Fila de carga de un participante: color + alias + celdas del end + total. */
export function EndRow({
  participant,
  arrows,
  total,
  arrowsPerEnd,
  active,
  onSelect,
}: EndRowProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
        active ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-2',
      )}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: colorHex(participant.color) }}
        aria-hidden
      />
      <span className="w-20 shrink-0 truncate font-medium text-fg text-sm">
        {participant.alias}
      </span>
      <span className="flex flex-1 gap-1">
        {Array.from({ length: arrowsPerEnd }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: celdas posicionales fijas del end
            key={i}
            className="flex h-7 min-w-7 items-center justify-center rounded border border-border px-1 text-fg text-xs"
          >
            {arrows?.[i] ?? '·'}
          </span>
        ))}
      </span>
      <span className="w-8 shrink-0 text-right font-semibold text-fg tabular-nums">
        {total ?? '—'}
      </span>
    </button>
  );
}
